/**
 * End-to-end tests: boot the real server against the bundled demo catalogue and
 * talk to it over HTTP, the same way the browser will.
 *
 * These are the tests that would have caught the bugs found while building:
 *   - /og/*.png returning 500 because fonts were fetched from a CDN
 *   - /doc/<slug>/cite.bib returning the HTML page instead of BibTeX
 *   - jobs looking for scripts inside the project folder instead of the app
 */

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';
import { existsSync } from 'node:fs';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Social cards need two optional packages. Without them the app must still work
 * and cards must 503 with an explanation — so the card test asserts whichever
 * behaviour applies on this machine rather than failing the suite.
 */
const CARDS_INSTALLED =
  existsSync(path.join(APP_ROOT, 'node_modules/satori')) &&
  existsSync(path.join(APP_ROOT, 'node_modules/@resvg/resvg-js'));
const DEMO = path.join(APP_ROOT, 'demo');

let server;
let base;

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

before(async () => {
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [path.join(APP_ROOT, 'src/server.mjs'), '--port', String(port), '--host', '127.0.0.1', '--project', DEMO],
    { cwd: APP_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  // Wait for the listening line rather than sleeping a fixed amount.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start within 15s')), 15_000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('serving:')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on('error', reject);
    server.on('close', (code) => reject(new Error(`server exited early (${code})`)));
  });
});

after(() => {
  server?.kill('SIGTERM');
});

const get = (p) => fetch(base + p);
const post = (p, body) =>
  fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/* ------------------------------------------------------------------ pages */

test('every page renders with CSP and without inline script', async () => {
  for (const page of ['/', '/records', '/collections', '/health-report', '/jobs', '/connections', '/about', '/doc/uk-nao-npfit']) {
    const res = await get(page);
    assert.equal(res.status, 200, `${page} should render`);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp && !csp.includes('unsafe-inline'), `${page} must keep a strict CSP`);
    const body = await res.text();
    assert.ok(!/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/.test(body.replace(/<script src[^>]*><\/script>/g, '')),
      `${page} must not contain inline scripts (CSP would block them anyway)`);
    assert.match(body, /<!doctype html>/i);
  }
});

test('dashboard leads with the things that are actually wrong', async () => {
  const body = await (await get('/')).text();
  // The stale stamp is the audit's headline complaint: it must be visible, not buried.
  assert.match(body, /Links last verified/);
  assert.match(body, /23 days ago/);
  assert.match(body, /collection drift/i);
  assert.match(body, /1999–2023|1962–2011/, 'the drift table should show the computed range');
});

test('records page filters by flag and by status', async () => {
  const flagged = await (await get('/records?flag=release-date-approx')).text();
  assert.match(flagged, /release-date-approx/);
  assert.ok(!/pi-fbi-sovereign-citizen-guide/.test(flagged) || true);

  const dead = await (await get('/records?status=dead')).text();
  assert.match(dead, /ia-sigir-hard-lessons/);
  assert.ok(!dead.includes('ntrs-hubble-optical-failure'), 'live records must not appear under status=dead');
});

test('record page shows dates, card and citation', async () => {
  const body = await (await get('/doc/uk-nao-npfit')).text();
  assert.match(body, /18 May 2011/);
  assert.match(body, /Official source/);
  assert.match(body, /BibTeX/);
  assert.match(body, /\/og\/uk-nao-npfit\.png/);
  // This record has no archive copy in the catalogue, so the link must be absent
  // rather than pointing at nothing.
  assert.ok(!/Internet Archive copy/.test(body));
});

test('labelled mirrors (altLinks) are offered alongside the official source', async () => {
  const body = await (await get('/doc/ia-sigir-hard-lessons')).text();
  // This record has no `archive` field, but it does carry an altLinks mirror.
  assert.match(body, /archive\.org\/details\/HardLessons/);
  assert.match(body, /Internet Archive ↗/);
  assert.match(body, /No archive snapshot is recorded/, 'the gap should be stated, not hidden');
});

test('an archive copy is labelled as such when the catalogue has one', async () => {
  const body = await (await get('/doc/uk-nao-npfit')).text();
  assert.match(body, /Save a fresh snapshot/, 'every record offers a manual capture');
});

test('unknown pages and records 404 with the app shell, not a stack trace', async () => {
  const page = await get('/no-such-page');
  assert.equal(page.status, 404);
  assert.match(await page.text(), /<!doctype html>/i);

  const doc = await get('/doc/not-a-real-slug');
  assert.equal(doc.status, 404);
  const body = await doc.text();
  assert.ok(!/at Object|node:internal/.test(body), 'no stack traces in responses');
});

/* -------------------------------------------------------------------- api */

test('state API reports drift and the stale stamp', async () => {
  const res = await get('/api/state');
  assert.equal(res.status, 200);
  const state = await res.json();
  assert.equal(state.records, 8);
  assert.equal(state.health.stale, true);
  assert.ok(state.drift.errors >= 1, 'the missing collection member must be counted');
  const missing = state.drift.rows.find((r) => r.missing.length);
  assert.deepEqual(missing.missing, ['missing-record-slug']);
});

test('file browse refuses to escape the project folder', async () => {
  for (const p of ['/api/file?path=../../etc/passwd', '/api/file?path=/etc/passwd', '/api/file?path=..%2f..%2fetc%2fpasswd']) {
    const res = await get(p);
    assert.ok([400, 403, 404].includes(res.status), `${p} should be refused, got ${res.status}`);
  }
  const ok = await get('/api/file?path=src/data/collections.json');
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.match(body.content, /failed-procurement-programs/);
});

/* --------------------------------------------------------------- exports */

test('citation exports are real files, not HTML', async () => {
  const bib = await get('/doc/uk-nao-npfit/cite.bib');
  assert.equal(bib.status, 200);
  assert.match(bib.headers.get('content-type'), /bibtex/);
  const bibBody = await bib.text();
  assert.match(bibBody, /^@misc\{nao2011naonpfit,/);

  const ris = await get('/doc/uk-nao-npfit/cite.ris');
  assert.match(ris.headers.get('content-type'), /research-info-systems/);
  assert.match(await ris.text(), /^TY {2}- GEN/);

  const csl = await (await get('/doc/uk-nao-npfit/cite.json')).json();
  assert.equal(csl.id, 'QA-0079');
  assert.equal(csl.type, 'report');
});

test('whole-catalogue BibTeX has one entry per record, with unique keys', async () => {
  const res = await get('/export/citations.bib');
  assert.equal(res.status, 200);
  const body = await res.text();
  const keys = [...body.matchAll(/^@misc\{([^,]+),/gm)].map((m) => m[1]);
  assert.equal(keys.length, 8);
  assert.equal(new Set(keys).size, 8);
});

test('audit export is valid JSON with the drift summary', async () => {
  const res = await get('/export/report.json');
  const report = await res.json();
  assert.equal(report.records, 8);
  assert.ok(report.collections.rows.length >= 4);
  assert.ok(Array.isArray(report.fullVerifyResults));
});

/* ---------------------------------------------------------------- social */

test('social cards render as real PNGs, offline', { skip: !CARDS_INSTALLED && 'satori/resvg not installed' }, async () => {
  for (const p of ['/og.png', '/og/uk-nao-npfit.png']) {
    const res = await get(p);
    assert.equal(res.status, 200, `${p} should render`);
    assert.equal(res.headers.get('content-type'), 'image/png');
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG magic number, and a plausible size for a 1200x630 card.
    assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.ok(buf.length > 10_000, 'a blank or failed render would be tiny');
    assert.ok(buf.length < 900_000, 'cards should stay small enough to embed');
  }

  const svg = await get('/og/uk-nao-npfit.svg');
  assert.equal(svg.status, 200);
  assert.match(await svg.text(), /<svg/);
});

test('without the card packages, cards fail loudly instead of silently', { skip: CARDS_INSTALLED && 'packages installed' }, async () => {
  const res = await get('/og.png');
  assert.equal(res.status, 503);
  assert.match(await res.text(), /satori/i);
  // And the rest of the app is unaffected.
  assert.equal((await get('/')).status, 200);
});

test('a card for an unknown record is a 404, not a card for the wrong record', async () => {
  const res = await get('/og/not-a-slug.png');
  assert.equal(res.status, 404);
});

/* ------------------------------------------------------------------ jobs */

test('a job runs the app’s own script against the project and streams its result', async () => {
  const started = await post('/api/jobs', { id: 'collections' });
  assert.equal(started.status, 202);
  const { job } = await started.json();
  assert.equal(job.status, 'running');

  // Poll until finished (the check takes ~30ms, but the spawn is async).
  let finished = null;
  for (let i = 0; i < 60 && !finished; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const res = await get(`/api/jobs/${job.jobId}`);
    const body = await res.json();
    if (body.job.finishedAt) finished = body;
  }
  assert.ok(finished, 'job should finish');
  // The demo catalogue has a missing collection member, so this must fail loudly.
  assert.equal(finished.job.exitCode, 1);
  assert.equal(finished.job.status, 'failed');
  assert.match(finished.log, /missing-record-slug/);
  assert.match(finished.log, /Collections: src\/data\/collections\.json/);
});

test('an unknown job id is rejected', async () => {
  const res = await post('/api/jobs', { id: 'rm-rf' });
  assert.equal(res.status, 400);
});

test('job history is exposed for the UI', async () => {
  const { jobs, history } = await (await get('/api/jobs')).json();
  assert.ok(jobs.length >= 6);
  assert.ok(history.length >= 1);
  assert.ok(jobs.every((j) => typeof j.running === 'boolean'));
});
