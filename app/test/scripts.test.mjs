/**
 * Tests for the scripts the app drives. These cover the failure modes that
 * matter more than the happy path: drift, a broken network, and an empty build.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEMO = path.join(APP_ROOT, 'demo');

/** Run a script in a scratch copy of the demo project. */
async function inScratch(fn) {
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-test-'));
  await cp(path.join(DEMO, 'src'), path.join(dir, 'src'), { recursive: true });
  return fn(dir);
}

function run(script, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(APP_ROOT, 'scripts', script), ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (out += c));
    child.on('close', (code) => resolve({ code, out }));
  });
}

/* ------------------------------------------------------- collection drift */

test('collections check exits 1 and names the drifted value', async () => {
  await inScratch(async (dir) => {
    const file = path.join(dir, 'src/data/collections.json');
    const data = JSON.parse(await readFile(file, 'utf8'));
    data.collections[0].dateRange = '1999–2023';
    data.collections[0].documentCount = 11;
    await writeFile(file, JSON.stringify(data, null, 2));

    const { code, out } = await run('check-collections.mjs', [], dir);
    assert.equal(code, 1);
    assert.match(out, /dateRange says "1999–2023"/);
    assert.match(out, /computes "1962–2011"/);
    assert.match(out, /documentCount says 11, catalogue has 5/);
  });
});

test('--fix repairs ranges without inventing missing members', async () => {
  await inScratch(async (dir) => {
    const file = path.join(dir, 'src/data/collections.json');
    const data = JSON.parse(await readFile(file, 'utf8'));
    data.collections[0].dateRange = '1999–2023';
    data.collections[0].documentCount = 11;
    await writeFile(file, JSON.stringify(data, null, 2));

    const fixed = await run('check-collections.mjs', ['--fix'], dir);
    assert.equal(fixed.code, 0);

    const after = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(after.collections[0].dateRange, '1962–2011');
    assert.equal(after.collections[0].documentCount, 5);
    // The deliberately missing member stays missing and is still reported.
    const recheck = await run('check-collections.mjs', [], dir);
    assert.equal(recheck.code, 1);
    assert.match(recheck.out, /missing-record-slug/);
  });
});

/* ------------------------------------------------------------- the gate */

test('a failed network cannot mass-relabel the catalogue', async () => {
  await inScratch(async (dir) => {
    const file = path.join(dir, 'src/data/documents.json');
    const before = await readFile(file, 'utf8');

    // Point every record at a host that cannot resolve, so every check fails
    // with a transport error — the signature of a machine with no network.
    const docs = JSON.parse(before).map((d, i) => ({
      ...d,
      sourceUrl: `https://no-such-host-${i}.invalid/page`,
    }));
    await writeFile(file, JSON.stringify(docs, null, 2));
    const poisoned = await readFile(file, 'utf8');

    const { code, out } = await run('verify-links.mjs', ['--write', '--concurrency', '8'], dir);
    assert.equal(code, 3, 'should stop with the dedicated "refused to write" code');
    assert.match(out, /safety threshold/);
    assert.match(out, /Nothing was written/);

    assert.equal(await readFile(file, 'utf8'), poisoned, 'the catalogue must be byte-identical');
    // The report is still written so the failure can be inspected.
    assert.ok(existsSync(path.join(dir, 'src/data/verify-report.json')));
    const report = JSON.parse(await readFile(path.join(dir, 'src/data/verify-report.json'), 'utf8'));
    assert.equal(report.summary.gateTriggered, true);
  });
});

test('a dry run writes neither the catalogue nor the report', async () => {
  await inScratch(async (dir) => {
    const docFile = path.join(dir, 'src/data/documents.json');
    const reportFile = path.join(dir, 'src/data/verify-report.json');
    const before = await readFile(docFile, 'utf8');
    // Remove the copied report so an accidental write is unambiguous.
    await rm(reportFile, { force: true });

    await run('verify-links.mjs', ['--only', 'nothing-matches-this', '--concurrency', '1'], dir);

    assert.equal(await readFile(docFile, 'utf8'), before);
    assert.ok(!existsSync(reportFile), 'a dry run must not create the report');
  });
});

/* -------------------------------------------------------------- sitemap */

test('sitemap refuses to write an empty sitemap', async () => {
  await inScratch(async (dir) => {
    await mkdir(path.join(dir, 'dist'), { recursive: true });
    const { code, out } = await run('sitemap.mjs', [], dir);
    assert.equal(code, 1);
    assert.match(out, /no build output|refusing to write an empty sitemap/);
    assert.ok(!existsSync(path.join(dir, 'dist/sitemap-index.xml')));
  });
});

test('sitemap indexes pages, skips non-canonical ones, and writes robots', async () => {
  await inScratch(async (dir) => {
    const pages = ['', 'collections', 'doc/uk-nao-npfit', 'doc/ia-sigir-hard-lessons', 'random', 'og', 'cite'];
    for (const p of pages) {
      const full = path.join(dir, 'dist', p, 'index.html');
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, '<html></html>');
    }
    await writeFile(path.join(dir, 'dist', '404.html'), 'x');
    await writeFile(path.join(dir, 'dist', 'rss.xml'), 'x');

    const { code, out } = await run('sitemap.mjs', ['--robots', '--site', 'https://example.org'], dir);
    assert.equal(code, 0, out);

    const index = await readFile(path.join(dir, 'dist/sitemap-index.xml'), 'utf8');
    assert.match(index, /<sitemapindex/);
    assert.match(index, /https:\/\/example\.org\/sitemap-0\.xml/);

    const shard = await readFile(path.join(dir, 'dist/sitemap-0.xml'), 'utf8');
    assert.match(shard, /<loc>https:\/\/example\.org\/doc\/uk-nao-npfit\/<\/loc>/);
    // The three that must never be indexed:
    assert.ok(!/\/random\//.test(shard), 'random must be excluded');
    assert.ok(!/\/og\//.test(shard), 'image routes must be excluded');
    assert.ok(!/404/.test(shard), '404 must be excluded');

    const robots = await readFile(path.join(dir, 'dist/robots.txt'), 'utf8');
    assert.match(robots, /Sitemap: https:\/\/example\.org\/sitemap-index\.xml/);
  });
});

/* --------------------------------------------------------------- health */

test('health flags a stale verification run with the exit code CI can use', async () => {
  await inScratch(async (dir) => {
    // No verify-report.json in the scratch copy => "never run" => stale.
    const { code, out } = await run('catalogue-health.mjs', ['--stale-days', '10'], dir);
    assert.equal(code, 2);
    assert.match(out, /stale/);
    const health = JSON.parse(await readFile(path.join(dir, 'src/data/health.json'), 'utf8'));
    assert.equal(health.stale, true);
    assert.ok(health.totals.records > 0);
  });
});

test('health builds a stamp from a fresh report', async () => {
  await inScratch(async (dir) => {
    const report = {
      schemaVersion: 2,
      summary: { generatedAt: new Date().toISOString(), checked: 2, counts: { live: 2 }, flags: {}, regressions: [] },
      results: [
        { key: 'a', id: 'QA-1', status: 'live', sourceUrl: 'https://example.org/a' },
        { key: 'b', id: 'QA-2', status: 'live', sourceUrl: 'https://example.org/b' },
      ],
    };
    await writeFile(path.join(dir, 'src/data/verify-report.json'), JSON.stringify(report));
    const { code } = await run('catalogue-health.mjs', ['--stale-days', '10'], dir);
    assert.equal(code, 0);
    const health = JSON.parse(await readFile(path.join(dir, 'src/data/health.json'), 'utf8'));
    assert.equal(health.stale, false);
    assert.match(health.verifiedLabel, /^Links verified \d{1,2} [A-Z][a-z]+ \d{4}$/);
  });
});
