#!/usr/bin/env node
/**
 * Quiet Archive app — entry point.
 *
 *   node bin/quiet-archive.mjs                        # bundled demo catalogue
 *   node bin/quiet-archive.mjs --project ../site      # your project folder
 *   node bin/quiet-archive.mjs --url owner/repo       # clone it, then run
 *   node bin/quiet-archive.mjs --port 8080 --host 0.0.0.0
 *
 * No database, no build step. Node 20+.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cloneProject, inspectProject, projectsDir, gitAvailable } from '../src/connect.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(here, '..');
const server = path.join(APP_ROOT, 'src', 'server.mjs');

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`The Quiet Archive — local app

Usage
  node bin/quiet-archive.mjs [options]

Options
  --project <dir>   project folder containing src/data/ (default: bundled demo)
  --url <remote>    git clone a project first, then open it
                    accepts owner/repo, https://…, or git@host:owner/repo.git
  --port <n>        port to listen on (default 4173, or $PORT)
  --host <addr>     bind address (default 0.0.0.0)
  --help            this text

Environment
  QA_PROJECT, PORT

Examples
  node bin/quiet-archive.mjs --project ../quiet-archive
  node bin/quiet-archive.mjs --url Hiro66-git/nevertheless
  QA_PROJECT=~/sites/quiet-archive node bin/quiet-archive.mjs
`);
  process.exit(0);
}

/* ------------------------------------------------- optional clone-then-open */

const remoteArg = arg('url', null);
let projectArg = arg('project', process.env.QA_PROJECT ?? null);

if (remoteArg) {
  if (typeof remoteArg !== 'string') {
    console.error('--url needs a value');
    process.exit(1);
  }
  const git = await gitAvailable();
  if (!git) {
    console.error('--url needs git on PATH. Use --project <dir> instead.');
    process.exit(1);
  }

  const name = String(remoteArg)
    .replace(/\.git$/, '')
    .split(/[/:]/)
    .filter(Boolean)
    .slice(-2)
    .join('-');
  const dest = path.join(projectsDir(APP_ROOT), name);

  if (existsSync(dest) && existsSync(path.join(dest, 'src/data'))) {
    console.log(`\n  Using existing clone: ${dest}\n`);
    projectArg = dest;
  } else {
    console.log(`\n  Cloning ${remoteArg}\n  into    ${dest}\n`);
    const result = await cloneProject({ url: remoteArg, dest });
    if (!result.ok) {
      console.error(`\n  Could not clone: ${result.message}\n`);
      if (result.log) console.error(result.log);
      console.error('  Tip: clone it yourself (so git can prompt for credentials) and use --project <dir>.\n');
      process.exit(1);
    }
    const info = result.project;
    console.log(`  Cloned. ${info.hasData ? `Found src/data (${info.dataFiles.join(', ')})` : 'No src/data found in that repository.'}\n`);
    projectArg = dest;
  }
}

/* ---------------------------------------------------------------- defaults */

if (!projectArg) projectArg = path.join(APP_ROOT, 'demo');

const info = await inspectProject(projectArg);
if (info.exists && !info.hasData) {
  console.warn(
    `\n  ⚠ ${projectArg} has no JSON in src/data/.\n` +
      '    The app will open in read-only mode. Point it at the folder that contains src/data/.\n',
  );
}

/* ------------------------------------------------------------------- start */

const child = spawn(process.execPath, [server, ...argv, '--project', projectArg], { stdio: 'inherit' });

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
child.on('close', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('failed to start:', err.message);
  process.exit(1);
});
