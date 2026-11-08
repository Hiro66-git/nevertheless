/**
 * Job runner: the app's buttons, backed by the same scripts the CLI runs.
 *
 * Every job spawns a script as a child process so that a hung network call can
 * be killed, output can be streamed to the browser, and the app's event loop is
 * never blocked. Jobs are serialised per key: two "verify" runs at once would
 * fight over the same JSON files.
 */

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * The menu. `script` paths are relative to the app root.
 * `writes` marks jobs that modify files (the UI asks before running them).
 */
export const JOB_DEFS = {
  verify: {
    label: 'Check every source link',
    description: 'Requests each source URL, records the result, finds Internet Archive fallbacks, and writes verify-report.json.',
    script: 'scripts/verify-links.mjs',
    args: ['--write', '--concurrency', '6', '--per-host', '2'],
    writes: true,
    destructive: false,
    minutes: 8,
  },
  'verify-dry': {
    label: 'Dry run: check without writing',
    description: 'Same requests, but nothing is modified. Good first step on a new machine.',
    script: 'scripts/verify-links.mjs',
    args: [],
    writes: false,
    minutes: 8,
  },
  health: {
    label: 'Rebuild catalogue health',
    description: 'Recomputes the verified stamp, link states and flags from the last verify run.',
    script: 'scripts/catalogue-health.mjs',
    args: ['--stale-days', '10'],
    writes: true,
    minutes: 1,
  },
  collections: {
    label: 'Check collection integrity',
    description: 'Recomputes every collection’s document count and date range from the catalogue; fails on drift.',
    script: 'scripts/check-collections.mjs',
    args: [],
    writes: false,
    minutes: 1,
  },
  'collections-fix': {
    label: 'Repair drifted collections',
    description: 'Rewrites collection counts and date ranges to match the catalogue. Modifies collections.json.',
    script: 'scripts/check-collections.mjs',
    args: ['--fix'],
    writes: true,
    minutes: 1,
  },
  sitemap: {
    label: 'Generate sitemap + robots.txt',
    description: 'Builds sitemap-index.xml and sitemap-N.xml from the built site. Needs a build in dist/ first.',
    script: 'scripts/sitemap.mjs',
    args: ['--robots'],
    writes: true,
    minutes: 2,
    needsDist: true,
  },
};

/** Jobs that must not run concurrently with each other. */
const EXCLUSIVE_GROUPS = {
  verify: 'network',
  'verify-dry': 'network',
  health: 'data',
  collections: 'data',
  'collections-fix': 'data',
};

const running = new Map(); // group -> jobId
const history = []; // newest first
const MAX_HISTORY = 40;

export class JobRunner {
  /**
   * @param {string} appRoot      where the app's own scripts live
   * @param {string} projectRoot  the catalogue the scripts operate on (cwd)
   * @param {{onEvent?: (event: object) => void}} [opts]
   */
  constructor(appRoot, projectRoot, opts = {}) {
    this.appRoot = appRoot;
    this.projectRoot = projectRoot ?? appRoot;
    this.onEvent = opts.onEvent ?? (() => {});
  }

  /**
   * Scripts ship with the app, so the app can be unzipped anywhere and pointed
   * at a project without copying files into it. If the project happens to carry
   * its own copy (a normal vendored setup), prefer that one — it may be newer.
   */
  scriptPath(script) {
    const projectScript = path.join(this.projectRoot, script);
    return existsSync(projectScript) ? projectScript : path.join(this.appRoot, script);
  }

  list() {
    return Object.entries(JOB_DEFS).map(([id, def]) => ({
      id,
      label: def.label,
      description: def.description,
      writes: def.writes,
      minutes: def.minutes,
      running: [...running.values()].some((j) => j.jobId && this.get(j.jobId)?.id === id) || false,
      lastRun: history.find((h) => h.id === id) ?? null,
    }));
  }

  get(jobId) {
    return history.find((h) => h.jobId === jobId) ?? null;
  }

  history() {
    return history.slice(0, MAX_HISTORY);
  }

  /** Start a job. Returns the run record immediately; output streams via events. */
  start(id, { extraArgs = [] } = {}) {
    const def = JOB_DEFS[id];
    if (!def) throw new Error(`unknown job: ${id}`);

    const group = EXCLUSIVE_GROUPS[id];
    if (group && running.has(group)) {
      const other = running.get(group);
      throw new Error(`“${other.id}” is already running on this machine. Wait for it to finish.`);
    }

    const jobId = randomUUID();
    const startedAt = new Date();
    const record = {
      jobId,
      id,
      label: def.label,
      startedAt: startedAt.toISOString(),
      finishedAt: null,
      exitCode: null,
      status: 'running',
      lines: [],
      args: [...def.args, ...extraArgs],
    };

    history.unshift(record);
    if (history.length > MAX_HISTORY) history.pop();
    if (group) running.set(group, { id, jobId });

    this.onEvent({ type: 'job-started', job: summarise(record) });

    const script = this.scriptPath(def.script);
    record.script = path.relative(this.appRoot, script) || script;

    const child = spawn(process.execPath, [script, ...record.args], {
      // cwd is the project: the scripts resolve src/data relative to cwd.
      cwd: this.projectRoot,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const push = (stream, chunk) => {
      const text = chunk.toString();
      for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        record.lines.push({ stream, text: stripAnsi(line) });
        this.onEvent({ type: 'job-line', jobId, stream, text: stripAnsi(line) });
      }
      // Keep memory bounded on a 250-request run.
      if (record.lines.length > 4000) record.lines.splice(0, record.lines.length - 4000);
    };

    child.stdout.on('data', (c) => push('out', c));
    child.stderr.on('data', (c) => push('err', c));

    const finish = (code, signal) => {
      record.exitCode = code;
      // 2 is the scripts' "ran fine, but found something you should look at"
      // code (stale verification, drifted collections). That is a warning, not a
      // crash: it must not read as "the app is broken".
      record.status = code === 0 ? 'ok' : code === 2 ? 'warning' : 'failed';
      record.finishedAt = new Date().toISOString();
      record.durationMs = new Date(record.finishedAt) - startedAt;
      if (signal) record.signal = signal;
      if (group && running.get(group)?.jobId === jobId) running.delete(group);
      this.onEvent({ type: 'job-finished', job: summarise(record) });
    };

    child.on('error', (err) => {
      record.lines.push({ stream: 'err', text: `failed to start: ${err.message}` });
      finish(1, null);
    });
    child.on('close', (code, signal) => finish(code ?? 1, signal));

    record.child = child;
    return summarise(record);
  }

  /** Kill a running job (SIGTERM; the script exits cleanly between checks). */
  cancel(jobId) {
    const rec = history.find((h) => h.jobId === jobId);
    if (!rec?.child) return false;
    rec.child.kill('SIGTERM');
    rec.status = 'cancelled';
    this.onEvent({ type: 'job-cancelled', jobId });
    return true;
  }

  /** Text log for a job, as the terminal would have shown it. */
  log(jobId) {
    const rec = this.get(jobId);
    if (!rec) return null;
    return rec.lines.map((l) => l.text).join('\n');
  }
}

function summarise(rec) {
  return {
    jobId: rec.jobId,
    id: rec.id,
    label: rec.label,
    status: rec.status,
    startedAt: rec.startedAt,
    finishedAt: rec.finishedAt,
    exitCode: rec.exitCode,
    durationMs: rec.durationMs ?? null,
  };
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001B\[[0-9;]*m/g, '');
}
