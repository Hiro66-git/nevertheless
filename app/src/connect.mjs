/**
 * Connecting a project to the app.
 *
 * Three ways in, in order of how much they need from you:
 *
 *   1. A local folder        — no network, no credentials. Always works.
 *   2. A public git remote   — `git clone` with no auth. Works for anything
 *                              already public.
 *   3. A private git remote  — uses the git credentials already configured on
 *                              *your* machine. The app never asks for a token,
 *                              never stores one, and never sees one: it shells
 *                              out to `git` and lets git decide.
 *
 * Every operation is a spawn of a real `git` command whose arguments are passed
 * as an array (never a shell string), so a URL cannot inject a command.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, stat, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Run a command, capture output, never throw on non-zero.
 * @returns {Promise<{code:number, stdout:string, stderr:string}>}
 */
export function run(cmd, args, { cwd, timeoutMs = 120_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);

    child.stdout.on('data', (c) => {
      stdout += c.toString();
      if (stdout.length > 200_000) stdout = stdout.slice(-200_000);
    });
    child.stderr.on('data', (c) => {
      stderr += c.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-200_000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 127, stdout, stderr: `${stderr}\n${err.message}` });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

/** Is `git` usable at all? */
export async function gitAvailable() {
  const res = await run('git', ['--version']);
  return res.code === 0 ? res.stdout.trim() : null;
}

/** Redact credentials that a remote URL might carry, for display and logs. */
export function redactUrl(url) {
  return String(url ?? '').replace(/\/\/[^/@\s]+@/, '//***@');
}

/**
 * Validate a remote URL before handing it to git.
 * Accepts https, git, ssh and scp-like `git@host:owner/repo` forms.
 */
export function parseRemote(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, reason: 'no URL given' };

  if (/^[\w.-]+\/[\w.-]+$/.test(raw)) {
    return { ok: true, url: `https://github.com/${raw.replace(/\.git$/, '')}.git`, inferred: true };
  }
  if (/^git@[\w.-]+:[\w./-]+\.git$/.test(raw)) return { ok: true, url: raw };
  try {
    const u = new URL(raw);
    if (!['https:', 'http:', 'git:', 'ssh:'].includes(u.protocol)) {
      return { ok: false, reason: `unsupported protocol ${u.protocol}` };
    }
    if (u.protocol === 'http:') return { ok: false, reason: 'plain http is refused; use https or ssh' };
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, reason: 'not a URL and not owner/repo' };
  }
}

/** Does this folder look like the thing the app can work on? */
export async function inspectProject(dir) {
  if (!existsSync(dir)) return { exists: false, hasData: false, dataFiles: [], isRepo: false };

  const dataDir = path.join(dir, 'src/data');
  let dataFiles = [];
  if (existsSync(dataDir)) {
    dataFiles = (await readdir(dataDir).catch(() => [])).filter((n) => n.endsWith('.json'));
  }

  let isRepo = false;
  let remote = null;
  let branch = null;
  if (existsSync(path.join(dir, '.git'))) {
    isRepo = true;
    const r = await run('git', ['-C', dir, 'remote', 'get-url', 'origin']);
    remote = r.code === 0 ? redactUrl(r.stdout.trim()) : null;
    const b = await run('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD']);
    branch = b.code === 0 ? b.stdout.trim() : null;
  }

  return {
    exists: true,
    hasData: dataFiles.length > 0,
    dataFiles,
    isRepo,
    remote,
    branch,
    dir,
  };
}

/**
 * Clone a remote into a destination and report what was found.
 *
 * @param {{url:string, dest:string, depth?:number}} opts
 */
export async function cloneProject({ url, dest, depth = 1, timeoutMs = 300_000 }) {
  const parsed = parseRemote(url);
  if (!parsed.ok) return { ok: false, stage: 'validate', message: parsed.reason, log: '' };

  await mkdir(path.dirname(dest), { recursive: true });
  if (existsSync(dest)) {
    const entries = await readdir(dest).catch(() => []);
    if (entries.length) {
      return { ok: false, stage: 'dest', message: `${dest} already exists and is not empty`, log: '' };
    }
  }

  const args = ['clone', '--depth', String(depth), '--no-single-branch', parsed.url, dest];
  const res = await run('git', args, { timeoutMs });

  if (res.code !== 0) {
    // Translate the common git failures into something actionable.
    const text = `${res.stderr}\n${res.stdout}`;
    let hint = 'git failed';
    if (/Could not resolve host|Name or service not known/i.test(text)) {
      hint = 'This machine has no DNS/network access to the git host. Use a local folder instead.';
    } else if (/Authentication failed|could not read Username|Permission denied \(publickey\)|terminal prompts disabled/i.test(text)) {
      hint =
        'The remote is private and this machine has no credentials for it. Either run ' +
        '`git clone` yourself (which can prompt you) and point the app at the folder, or use a local path.';
    } else if (/Repository not found|not found/i.test(text)) {
      hint = 'The repository is not visible without credentials. If it is private, clone it yourself and use a local path.';
    } else if (/already exists/i.test(text)) {
      hint = 'The destination already has a repository.';
    }
    return { ok: false, stage: 'clone', message: hint, log: text.slice(-4000) };
  }

  const info = await inspectProject(dest);
  return { ok: true, stage: 'done', message: `Cloned to ${dest}`, project: info, log: res.stderr.slice(-2000) };
}

/**
 * Pull the latest in an existing repo (fast-forward only, so the app can never
 * create a merge commit in your working tree).
 */
export async function updateProject(dir) {
  const info = await inspectProject(dir);
  if (!info.isRepo) return { ok: false, message: 'not a git repository' };

  const dirty = await run('git', ['-C', dir, 'status', '--porcelain']);
  if (dirty.code === 0 && dirty.stdout.trim()) {
    return {
      ok: false,
      message: 'The working tree has uncommitted changes; commit or stash them first so a pull cannot mix with them.',
      dirty: dirty.stdout.split('\n').slice(0, 20),
    };
  }

  const res = await run('git', ['-C', dir, 'pull', '--ff-only']);
  return {
    ok: res.code === 0,
    message: res.code === 0 ? 'Up to date.' : 'Pull failed (see log).',
    log: `${res.stdout}\n${res.stderr}`.trim().slice(-4000),
  };
}

/** Where cloned projects live inside the app folder. */
export function projectsDir(appRoot) {
  return path.join(appRoot, 'projects');
}

/** List folders previously cloned by the app. */
export async function listClonedProjects(appRoot) {
  const dir = projectsDir(appRoot);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    if (!(await stat(full)).isDirectory()) continue;
    const info = await inspectProject(full);
    out.push({ name, ...info });
  }
  return out;
}

/** Delete a clone the app made. Refuses anything outside projects/. */
export async function removeClonedProject(appRoot, name) {
  const dir = path.resolve(projectsDir(appRoot), name);
  if (!dir.startsWith(projectsDir(appRoot) + path.sep)) {
    return { ok: false, message: 'refusing to delete outside the projects folder' };
  }
  if (!existsSync(dir)) return { ok: false, message: 'not found' };
  await rm(dir, { recursive: true, force: true });
  return { ok: true, message: `Removed ${name}` };
}
