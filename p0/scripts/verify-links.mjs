#!/usr/bin/env node
/**
 * The Quiet Archive — link verifier, v2.
 *
 * Fixes the P0 audit findings:
 *   1. The "Links verified <date>" stamp is now *derived* from this run's output
 *      (src/data/verify-report.json) instead of being hard-coded in a template.
 *   2. Failing URLs get an Internet Archive fallback automatically: we look up the
 *      nearest Wayback snapshot, and (opt-in) trigger Save Page Now when none exists.
 *   3. Hand-verified records stay hand-verified: `verify.manual` pins are respected
 *      for `--pinned-months` (default 3) instead of being overwritten weekly.
 *   4. Per-host politeness (max N concurrent per host + delay) so weekly runs stop
 *      looking like a scraper to cia.gov / gao.gov.
 *
 * Usage
 *   node scripts/verify-links.mjs                    # dry run, report only
 *   node scripts/verify-links.mjs --write            # also patch documents.json
 *   node scripts/verify-links.mjs --only QA-0042,uk-nao-npfit --concurrency 4
 *   node scripts/verify-links.mjs --spn --spn-max 3  # Save Page Now for dead links
 *
 * Exit codes: 0 = ran (write or dry) ; 1 = fatal error ; 2 = --fail-on-regression
 *             found newly dead links.
 *
 * Dependencies: none (Node >= 18 for global fetch).
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import tls from 'node:tls';
import path from 'node:path';
import process from 'node:process';

/* ------------------------------------------------------------------ config */

const ROOT = process.cwd();
const REPORT_PATH = 'src/data/verify-report.json';

// A browser-ish UA is required: several reading rooms (CIA, GAO) return 403 to
// anything that announces itself as a bot. We keep an honest contact token so a
// sysadmin can still identify us in their logs.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/128.0.0.0 Safari/537.36 QuietArchiveLinkCheck/2.0 (+https://quiet-archive-19i.pages.dev/about/)';

/** Hosts known to refuse automated clients even with a browser UA. */
const BOT_WALL_HOSTS = [
  'cia.gov', 'gao.gov', 'sec.gov', 'archives.gov', 'nara.gov', 'fbi.gov',
  'justice.gov', 'dod.mil', 'defense.gov', 'state.gov', 'govinfo.gov',
  'trove.nla.gov.au', 'legislation.gov.uk', 'nationalarchives.gov.uk',
];

/** Statuses that mean "you are not allowed to look", not "the file is gone". */
const WALL_STATUSES = new Set([401, 403, 405, 406, 418, 429, 451, 503]);

/* ------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};
const num = (name, fallback) => {
  const v = flag(name);
  return v === undefined ? fallback : Number(v);
};

const OPT = {
  write: Boolean(flag('write', false)),
  dataArg: flag('data'),
  collectionsArg: flag('collections'),
  only: (flag('only') || '').split(',').map((s) => s.trim()).filter(Boolean),
  concurrency: num('concurrency', 6),
  perHost: num('per-host', 2),
  hostDelay: num('host-delay', 400),
  timeout: num('timeout', 25000),
  pinnedMonths: num('pinned-months', 3),
  archiveLookup: flag('no-archive') ? false : true,
  spn: Boolean(flag('spn', false)),
  spnMax: num('spn-max', 2),
  spnDelay: num('spn-delay', 20000),
  failOnRegression: Boolean(flag('fail-on-regression', false)),
  now: flag('now') ? new Date(String(flag('now'))) : new Date(),
  quiet: Boolean(flag('quiet', false)),
};

// Local/proxy CA support: --ca <pem> is equivalent to NODE_EXTRA_CA_CERTS, which
// must be set *before* Node starts, so we honour a flag by re-adding the root.
if (flag('ca')) {
  const caFile = String(flag('ca'));
  if (!existsSync(caFile)) {
    console.error(`verify-links: --ca ${caFile} not found`);
    process.exit(1);
  }
  const pem = await readFile(caFile, 'utf8');
  tls.setDefaultCACertificates([...tls.getCACertificates('default'), pem]);
}

if (Number.isNaN(OPT.now.getTime())) {
  console.error('verify-links: --now must be a parseable date');
  process.exit(1);
}

const log = (...a) => { if (!OPT.quiet) console.log(...a); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* --------------------------------------------------------------- data I/O */

const isRecord = (o) =>
  o && typeof o === 'object' && typeof o.id === 'string' && typeof o.sourceUrl === 'string';

async function listJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  const s = await stat(abs);
  if (s.isFile()) return [rel];
  const out = [];
  for (const name of await readdir(abs)) {
    if (!name.endsWith('.json')) continue;
    const child = path.join(rel, name);
    const cs = await stat(path.join(ROOT, child));
    if (cs.isDirectory()) out.push(...(await listJson(child)));
    else out.push(child);
  }
  return out;
}

/**
 * Find the catalogue without assuming an exact filename. Any JSON file that
 * contains an array of objects with `id` + `sourceUrl` counts as catalogue data.
 */
async function discoverDataFiles() {
  if (OPT.dataArg) return String(OPT.dataArg).split(',').map((s) => s.trim());
  const candidates = await listJson('src/data');
  const found = [];
  for (const rel of candidates) {
    if (rel.endsWith('verify-report.json')) continue;
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
    } catch {
      continue;
    }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.documents) ? parsed.documents : null;
    if (arr && arr.some(isRecord)) found.push(rel);
  }
  return found;
}

function docKey(doc) {
  return doc.slug || doc.id;
}

/* ------------------------------------------------------------- http check */

const sleepUntil = new Map(); // host -> epoch ms
const hostActive = new Map(); // host -> in-flight count

async function acquireHost(host) {
  // Simple per-host concurrency gate.
  for (;;) {
    const active = hostActive.get(host) || 0;
    if (active < OPT.perHost) break;
    await sleep(50 + Math.random() * 50);
  }
  hostActive.set(host, (hostActive.get(host) || 0) + 1);
  const wait = (sleepUntil.get(host) || 0) - Date.now();
  if (wait > 0) await sleep(wait);
}

function releaseHost(host) {
  hostActive.set(host, Math.max(0, (hostActive.get(host) || 1) - 1));
  sleepUntil.set(host, Date.now() + OPT.hostDelay);
}

function classify(err) {
  const code = err?.cause?.code || err?.code;
  const detail = err?.cause?.message || err?.message || String(err);
  // Node's fetch collapses every transport error into "fetch failed"; the useful
  // text is on err.cause. Surface it, and name the most common local cause.
  const msg = [code, detail].filter(Boolean).join(': ');
  if (/UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED|CERT_HAS_EXPIRED|UNABLE_TO_GET_ISSUER/.test(msg)) {
    return {
      status: 'unreachable',
      flag: 'host-tls-misconfigured',
      detail: `${msg} — if every host fails like this, the machine is missing a CA. Run with NODE_EXTRA_CA_CERTS=/path/to/root-ca.pem.`,
    };
  }
  if (/CERT|TLS|SSL|self.signed|altname/i.test(msg)) return { status: 'unreachable', flag: 'host-tls-misconfigured', detail: msg };
  if (/TIMEOUT|ETIMEDOUT|aborted|AbortError/i.test(msg)) return { status: 'unreachable', flag: 'checker-timeout', detail: 'timeout' };
  if (/ENOTFOUND|EAI_AGAIN|DNS/i.test(msg)) return { status: 'dead', flag: 'official-url-dead', detail: msg };
  if (/ECONNREFUSED|ECONNRESET|EPIPE/i.test(msg)) return { status: 'unreachable', flag: null, detail: msg };
  return { status: 'unreachable', flag: null, detail: msg };
}

function isBotWallHost(url) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return false; }
  return BOT_WALL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

async function checkUrl(url, { noRange = false } = {}) {
  const started = Date.now();
  let host = '';
  try { host = new URL(url).hostname; } catch {
    return { status: 'dead', httpStatus: null, flag: 'official-url-dead', detail: 'malformed URL', elapsedMs: 0 };
  }
  await acquireHost(host);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), OPT.timeout);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
        'accept-language': 'en-GB,en;q=0.9',
        // Ask for one byte only; PDFs here can be hundreds of megabytes.
        ...(noRange ? {} : { range: 'bytes=0-0' }),
      },
    });
    const elapsedMs = Date.now() - started;
    const finalUrl = res.url || url;
    const code = res.status;

    // Some hosts answer a Range request with 200 + the whole file instead of 206.
    // Cancel immediately: a 300 MB PDF would otherwise be pulled down weekly.
    try { await res.body?.cancel(); } catch { /* already consumed */ }

    if (code >= 200 && code < 300) {
      const moved = normalizeUrl(finalUrl) !== normalizeUrl(url);
      return { status: moved ? 'live-redirected' : 'live', httpStatus: code, finalUrl: moved ? finalUrl : null, elapsedMs, flag: null };
    }
    if (code === 404 || code === 410) {
      return { status: 'dead', httpStatus: code, elapsedMs, flag: 'official-url-dead' };
    }
    if (code === 416) {
      // Range not satisfiable — the file may be empty or the header unsupported.
      // Retry once without the Range header before calling it broken.
      const plain = await checkUrl(url, { noRange: true });
      return plain.httpStatus && plain.httpStatus < 400
        ? { ...plain, flag: null, elapsedMs: Date.now() - started }
        : plain;
    }
    if (WALL_STATUSES.has(code)) {
      // A 403 from a host that is *known* to wall scripts is expected, not alarming.
      const walled = isBotWallHost(url) || code === 429 || code === 451 || code === 503;
      return {
        status: walled ? 'blocked' : 'unreachable',
        httpStatus: code,
        elapsedMs,
        flag: walled ? 'host-blocks-automated-checks' : null,
      };
    }
    return { status: 'unreachable', httpStatus: code, elapsedMs, flag: null };
  } catch (err) {
    return { ...classify(err), httpStatus: null, elapsedMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
    releaseHost(host);
  }
}

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    // Treat a trailing slash as equivalent so cosmetic redirects don't count.
    let s = x.toString();
    if (s.endsWith('/') && x.pathname !== '/') s = s.slice(0, -1);
    return s.replace(/^http:/, 'https:');
  } catch { return String(u); }
}

/* --------------------------------------------------------------- wayback */

async function waybackLookup(url) {
  const stamp = OPT.now.toISOString().slice(0, 10).replace(/-/g, '');
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${stamp}`;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20000);
    const res = await fetch(api, { signal: ac.signal, headers: { 'user-agent': UA, accept: 'application/json' } });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, reason: `availability API HTTP ${res.status}` };
    const json = await res.json();
    const snap = json?.archived_snapshots?.closest;
    if (!snap?.available || !snap.url) return { ok: true, snapshot: null };
    return {
      ok: true,
      snapshot: {
        url: snap.url.replace(/^http:/, 'https:'),
        timestamp: snap.timestamp,
        httpStatus: snap.status,
      },
    };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) };
  }
}

let spnUsed = 0;
let spnLast = 0;
async function savePageNow(url) {
  if (spnUsed >= OPT.spnMax) return { ok: false, reason: 'spn budget exhausted' };
  const wait = spnLast + OPT.spnDelay - Date.now();
  if (wait > 0) await sleep(wait);
  spnUsed += 1;
  spnLast = Date.now();
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 60000);
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'user-agent': UA, accept: 'text/html' },
    });
    const finalUrl = res.url || '';
    try { await res.body?.cancel(); } catch { /* ignore */ }
    clearTimeout(timer);
    const ok = res.status >= 200 && res.status < 400 && /\/web\/\d{14}\//.test(finalUrl);
    return { ok, httpStatus: res.status, url: ok ? finalUrl : null, reason: ok ? null : `SPN HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) };
  }
}

/* ----------------------------------------------------------------- flags */

/** Flags that this script owns. Editorial flags (mirror-used, *-approx) are preserved. */
const DERIVED_FLAGS = new Set([
  'official-url-dead',
  'archive-used',
  'host-blocks-automated-checks',
  'checker-timeout',
  'host-tls-misconfigured',
]);

function applyFlags(existing, derived) {
  const kept = (existing || []).filter((f) => !DERIVED_FLAGS.has(f));
  return [...new Set([...kept, ...derived])].sort();
}

function isPinned(doc) {
  const m = doc?.verify?.manual;
  if (!m) return false;
  const d = new Date(m);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date(OPT.now.getTime());
  cutoff.setMonth(cutoff.getMonth() - OPT.pinnedMonths);
  return d >= cutoff;
}

/* ------------------------------------------------------------------- run */

async function main() {
  const dataFiles = await discoverDataFiles();
  if (!dataFiles.length) {
    console.error('verify-links: no catalogue JSON found (looked for src/data/**/*.json with id + sourceUrl). Use --data <path>.');
    process.exit(1);
  }
  log(`Catalogue files: ${dataFiles.join(', ')}`);

  const files = new Map(); // rel -> parsed array container
  const docs = []; // { rel, index, doc }
  for (const rel of dataFiles) {
    const raw = await readFile(path.join(ROOT, rel), 'utf8');
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.documents;
    files.set(rel, { parsed, arr, isArray: Array.isArray(parsed) });
    arr.forEach((doc, index) => { if (isRecord(doc)) docs.push({ rel, index, doc }); });
  }

  let targets = docs;
  if (OPT.only.length) {
    const want = new Set(OPT.only);
    targets = docs.filter(({ doc }) => want.has(doc.id) || want.has(doc.slug));
  }
  log(`Checking ${targets.length} of ${docs.length} records…\n`);

  // Previous run, for regression detection.
  let previous = null;
  if (existsSync(path.join(ROOT, REPORT_PATH))) {
    try { previous = JSON.parse(await readFile(path.join(ROOT, REPORT_PATH), 'utf8')); } catch { previous = null; }
  }
  const prevByKey = new Map((previous?.results || []).map((r) => [r.key, r]));

  const results = [];
  const queue = [...targets];
  const workers = Array.from({ length: Math.max(1, OPT.concurrency) }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      const { doc } = item;
      const key = docKey(doc);
      const pinned = isPinned(doc);
      const http = await checkUrl(doc.sourceUrl);

      // Anything not confirmed live deserves a look for an archive copy.
      let archive = null;
      let archiveNote = null;
      let archiveNoteIsDiagnostic = false;
      if (OPT.archiveLookup && (http.status === 'dead' || http.status === 'unreachable')) {
        const lookup = await waybackLookup(doc.sourceUrl);
        if (lookup.ok) {
          if (lookup.snapshot) {
            archive = { url: lookup.snapshot.url, capturedAt: lookup.snapshot.timestamp };
            archiveNote = 'nearest snapshot found automatically';
          } else if (OPT.spn) {
            const spn = await savePageNow(doc.sourceUrl);
            archiveNote = spn.ok
              ? 'no snapshot existed; Save Page Now triggered'
              : `no snapshot existed; Save Page Now failed (${spn.reason})`;
            if (spn.ok) archive = { url: spn.url, capturedAt: new Date(OPT.now).toISOString().replace(/\D/g, '').slice(0, 14) };
          } else {
            archiveNote = 'no snapshot found';
          }
        } else {
          // An unreachable Wayback API is *our* problem, not the record's.
          // Keep it in the report only; never overwrite the editorial note.
          archiveNote = `archive lookup failed: ${lookup.reason}`;
          archiveNoteIsDiagnostic = true;
        }
      }

      // Decide the effective status, honouring hand checks.
      let status = http.status;
      const derived = [];
      if (http.flag) derived.push(http.flag);
      if (pinned && status !== 'dead') {
        status = 'manual';
        const drop = derived.indexOf('host-blocks-automated-checks');
        if (drop !== -1) derived.splice(drop, 1);
      }
      if (archive && status !== 'manual') derived.push('archive-used');

      const prev = prevByKey.get(key);
      const regression = Boolean(prev && prev.status !== 'dead' && status === 'dead');

      results.push({
        key,
        id: doc.id,
        slug: doc.slug ?? null,
        title: doc.title,
        sourceUrl: doc.sourceUrl,
        status,
        httpStatus: http.httpStatus,
        finalUrl: http.finalUrl || null,
        elapsedMs: http.elapsedMs ?? null,
        flag: http.flag ?? null,
        derivedFlags: derived,
        pinned,
        manual: doc.verify?.manual ?? null,
        archive,
        archiveNote,
        archiveNoteIsDiagnostic,
        regression,
        checkedAt: OPT.now.toISOString(),
      });

      const mark = { live: 'ok  ', 'live-redirected': 'ok→ ', blocked: 'wall', dead: 'DEAD', unreachable: 'FAIL', manual: 'hand' }[status] || '?   ';
      log(`${mark} ${doc.id} ${truncate(doc.sourceUrl, 88)}${archive ? '  [archive]' : ''}`);
    }
  });
  await Promise.all(workers);

  results.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  /* ---------------------------------------------------------- summary */

  const summary = {
    generatedAt: OPT.now.toISOString(),
    checked: results.length,
    catalogueSize: docs.length,
    counts: countBy(results, (r) => r.status),
    flags: countBy(results.flatMap((r) => r.derivedFlags), (f) => f),
    hostsWalling: countBy(results.filter((r) => r.status === 'blocked' || r.status === 'manual'), (r) => hostOf(r.sourceUrl)),
    archiveFallbacks: results.filter((r) => r.archive).length,
    regressions: results.filter((r) => r.regression).map((r) => ({ id: r.id, slug: r.slug, url: r.sourceUrl })),
    failures: results
      .filter((r) => r.status === 'dead' || r.status === 'unreachable')
      .map((r) => ({ id: r.id, slug: r.slug, status: r.status, detail: r.httpStatus || r.flag, archive: r.archive?.url ?? null })),
  };

  const report = { schemaVersion: 2, summary, results };

  /* ------------------------------------------------------------ write */

  if (OPT.write) {
    for (const [rel, entry] of files) {
      for (const r of results) {
        const doc = entry.arr.find((d) => isRecord(d) && docKey(d) === r.key);
        if (!doc) continue;
        doc.checked = r.checkedAt;
        if (r.status !== 'manual') doc.status = r.status;
        else if (!doc.status) doc.status = 'blocked';
        doc.flags = applyFlags(doc.flags, r.derivedFlags);
        if (r.archive?.url) doc.archive = r.archive.url;
        // Only editorial notes reach the catalogue; diagnostic text stays in the report.
        if (r.archiveNote && !r.archiveNoteIsDiagnostic) (doc.verify ||= {}).note = r.archiveNote;
      }
      const payload = entry.isArray ? entry.arr : { ...entry.parsed, documents: entry.arr };
      await writeFile(path.join(ROOT, rel), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    }
    await writeFile(path.join(ROOT, REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    log(`\nWrote ${REPORT_PATH} and patched ${[...files.keys()].length} catalogue file(s).`);
  } else {
    log('\nDry run (no files written). Re-run with --write to patch the catalogue.');
  }

  /* ---------------------------------------------------------- summary log */

  log('');
  log(`Checked ${summary.checked}/${summary.catalogueSize} records at ${summary.generatedAt}`);
  for (const [k, v] of Object.entries(summary.counts)) log(`  ${k.padEnd(16)} ${v}`);
  if (summary.archiveFallbacks) log(`  archive fallbacks ${summary.archiveFallbacks}`);
  if (summary.regressions.length) {
    log(`\n!! ${summary.regressions.length} newly dead link(s):`);
    for (const r of summary.regressions) log(`   - ${r.id} ${r.slug ?? ''} ${r.url}`);
  }

  if (OPT.failOnRegression && summary.regressions.length) process.exit(2);
}

/* ---------------------------------------------------------------- helpers */

function countBy(list, fn) {
  const out = {};
  for (const item of list) {
    const k = fn(item);
    if (k == null || k === null) continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'invalid'; }
}
function truncate(s, n) { return s.length > n ? `${s.slice(0, n - 1)}…` : s; }

main().catch((err) => {
  console.error('verify-links: fatal', err);
  process.exit(1);
});
