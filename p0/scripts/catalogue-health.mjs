#!/usr/bin/env node
/**
 * Build the public catalogue-health page data.
 *
 * The audit's biggest trust problem: /about/ presents a table of counts, the
 * masthead a "verified" date, and both are hand-maintained, so they drift.
 * Everything here is computed from verify-report.json + the catalogue, so the
 * numbers on /health/ can never disagree with the data.
 *
 *   src/data/verify-report.json  ->  src/data/health.json (+ optional markdown)
 *
 * Usage
 *   node scripts/catalogue-health.mjs
 *   node scripts/catalogue-health.mjs --write-markdown src/pages/health.md
 *   node scripts/catalogue-health.mjs --stale-days 10   # exit 2 if the last run is old
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { formatVerifiedStamp, relativeDays } from '../site/lib/dates.mjs';

const ROOT = process.cwd();

/** Respect absolute paths (path.join('/a', '/tmp/x') would mangle them). */
function abs(p) {
  return path.isAbsolute(String(p)) ? String(p) : path.join(ROOT, String(p));
}

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const REPORT = String(flag('report', 'src/data/verify-report.json'));
const OUT = String(flag('out', 'src/data/health.json'));
const STALE_DAYS = Number(flag('stale-days', 0));
const MD_OUT = flag('write-markdown', null);

/** Human copy for each status, kept in one place so page + RSS agree. */
const STATUS_COPY = {
  live: { label: 'Live', blurb: 'Responded normally to the last automated check.' },
  'live-redirected': { label: 'Live (moved)', blurb: 'Works, but now redirects to a different address; the new address is recorded.' },
  blocked: { label: 'Bot-walled', blurb: 'The host refuses automated checkers, so the link cannot be machine-verified. Checked by hand where possible.' },
  manual: { label: 'Checked by hand', blurb: 'Verified by a person because the host blocks scripts.' },
  unreachable: { label: 'Unreachable', blurb: 'Timed out or errored during the last check; it may be geo-restricted or temporarily down.' },
  dead: { label: 'Dead', blurb: 'Failed the last check. Use the Internet Archive copy.' },
};

const FLAG_COPY = {
  'host-blocks-automated-checks': 'The host blocks automated link checks; the link was confirmed by hand or via the official index.',
  'release-date-approx': 'Release date is approximate (best available public evidence).',
  'document-date-approx': 'Document date is approximate or spans a range; the earliest year is shown.',
  'release-date-unknown': 'No reliable public release date could be found.',
  'official-url-dead': 'The original official URL no longer works.',
  'mirror-used': 'Links to a faithful mirror because the official copy is gone or unusable.',
  'archive-used': 'Links to an Internet Archive snapshot because the official site is offline.',
  'checker-timeout': 'The host timed out during automated checks (often geo-restricted).',
  'host-tls-misconfigured': "The server's certificate is misconfigured; strict clients may refuse it.",
};

async function listJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  if ((await stat(abs)).isFile()) return [rel];
  const out = [];
  for (const name of await readdir(abs)) {
    const child = path.join(rel, name);
    const s = await stat(path.join(ROOT, child));
    if (s.isDirectory()) out.push(...(await listJson(child)));
    else if (name.endsWith('.json')) out.push(child);
  }
  return out;
}

async function loadCatalogue() {
  const docs = [];
  for (const rel of await listJson('src/data')) {
    if (rel.endsWith('verify-report.json') || rel.endsWith('health.json')) continue;
    let parsed;
    try { parsed = JSON.parse(await readFile(path.join(ROOT, rel), 'utf8')); } catch { continue; }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.documents) ? parsed.documents : null;
    if (arr) docs.push(...arr.filter((d) => d && typeof d.sourceUrl === 'string'));
  }
  return docs;
}

function tally(items, keyFn) {
  const out = new Map();
  for (const item of items) {
    const k = keyFn(item);
    if (k == null || k === '') continue;
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
}

function byCountDesc(a, b) {
  return b[1] - a[1] || a[0].localeCompare(b[0]);
}

function pct(n, total) {
  if (!total) return '0%';
  return `${((n / total) * 100).toFixed(n / total < 0.1 ? 1 : 0)}%`;
}

async function main() {
  const docs = await loadCatalogue();
  if (!docs.length) {
    console.error('catalogue-health: no catalogue records found under src/data/');
    process.exit(1);
  }

  let report = null;
  if (existsSync(abs(REPORT))) {
    report = JSON.parse(await readFile(abs(REPORT), 'utf8'));
  }
  const results = report?.results ?? [];
  const total = docs.length;
  const checkedAt = report?.summary?.generatedAt ?? null;

  /* ---------------------------------------------------------- link state */

  const statusCounts = tally(results.length ? results : docs, (r) => r.status);
  const linkStates = Object.keys(STATUS_COPY)
    .map((key) => ({
      key,
      ...STATUS_COPY[key],
      count: statusCounts.get(key) || 0,
      share: pct(statusCounts.get(key) || 0, results.length || total),
    }))
    .filter((s) => s.count > 0);

  const machineChecked = results.filter((r) => r.status === 'live' || r.status === 'live-redirected').length;
  const humanChecked = results.filter((r) => r.status === 'manual' || r.status === 'blocked').length;
  const withArchive = results.filter((r) => r.archive?.url).length;
  const noFallback = results.filter((r) => (r.status === 'dead' || r.status === 'unreachable') && !r.archive?.url);

  /* --------------------------------------------------------------- flags */

  const flagCounts = tally(docs.flatMap((d) => (Array.isArray(d.flags) ? d.flags : [])), (f) => f);
  const flags = [...flagCounts.entries()]
    .sort(byCountDesc)
    .map(([key, count]) => ({
      key,
      count,
      share: pct(count, total),
      blurb: FLAG_COPY[key] || null,
    }));

  const dateUncertain = docs.filter((d) =>
    (d.flags || []).some((f) => /date-(approx|unknown)$/.test(f)),
  ).length;

  /* -------------------------------------------------------------- facets */

  const byHost = [...tally(docs, (d) => d.host).entries()].sort(byCountDesc);
  const byIssuer = [...tally(docs, (d) => d.issuerShort ?? d.host).entries()].sort(byCountDesc);
  const byCountry = [...tally(docs, (d) => d.country).entries()].sort(byCountDesc);
  const byType = [...tally(docs, (d) => d.documentType).entries()].sort(byCountDesc);
  const byYear = [...tally(docs, (d) => (typeof d.year === 'number' ? d.year : null)).entries()].sort((a, b) => a[0] - b[0]);

  /* ------------------------------------------------------------ integrity */

  const ids = new Set();
  const duplicateIds = [];
  const duplicateSlugs = [];
  const seenSlugs = new Set();
  for (const d of docs) {
    if (ids.has(d.id)) duplicateIds.push(d.id);
    ids.add(d.id);
    const slug = d.slug || d.id;
    if (seenSlugs.has(slug)) duplicateSlugs.push(slug);
    seenSlugs.add(slug);
  }

  const missingReleaseDate = docs.filter((d) => !d.releaseDate).length;
  const httpUrls = docs.filter((d) => /^http:\/\//i.test(d.sourceUrl || ''));
  const nonHttps = httpUrls.map((d) => ({ id: d.id, url: d.sourceUrl }));
  const noSummary = docs.filter((d) => !d.summary || String(d.summary).trim().length < 40).map((d) => d.id);

  /* ---------------------------------------------------------------- stale */

  const ageDays = checkedAt ? Math.floor((Date.now() - new Date(checkedAt).getTime()) / 86_400_000) : null;
  const stale = ageDays == null || (STALE_DAYS > 0 && ageDays > STALE_DAYS);

  const health = {
    generatedAt: new Date().toISOString(),
    verifiedAt: checkedAt,
    verifiedLabel: checkedAt ? formatVerifiedStamp(checkedAt) : null,
    verifiedRelative: checkedAt ? relativeDays(checkedAt) : null,
    checkAgeDays: ageDays,
    stale,
    staleAfterDays: STALE_DAYS || null,
    totals: {
      records: total,
      machineChecked,
      humanChecked,
      handCheckedShare: pct(humanChecked, total),
      archiveFallbacks: withArchive,
      recordsAwaitingFallback: noFallback.length,
      dateUncertainty: dateUncertain,
      missingReleaseDate,
    },
    linkStates,
    flags,
    hosts: byHost.map(([host, count]) => ({ host, count })),
    issuers: byIssuer.map(([issuer, count]) => ({ issuer, count })),
    countries: byCountry.map(([country, count]) => ({ country, count })),
    documentTypes: byType.map(([type, count]) => ({ type, count })),
    years: byYear.map(([year, count]) => ({ year, count })),
    problems: {
      duplicateIds,
      duplicateSlugs,
      nonHttps,
      thinSummaries: noSummary,
      awaitingFallback: noFallback.map((r) => ({ id: r.id, slug: r.slug, status: r.status, url: r.sourceUrl })),
    },
    regressions: report?.summary?.regressions ?? [],
  };

  await writeFile(abs(OUT), `${JSON.stringify(health, null, 2)}\n`, 'utf8');
  console.log(`catalogue-health: ${total} records, ${machineChecked} machine-checked, ${humanChecked} by hand, ${withArchive} archive fallbacks`);
  console.log(`  stamp: ${health.verifiedLabel ?? 'none'} (${ageDays == null ? 'no report' : `${ageDays}d old`})`);
  if (duplicateIds.length) console.warn(`  !! duplicate ids: ${duplicateIds.join(', ')}`);
  if (duplicateSlugs.length) console.warn(`  !! duplicate slugs: ${duplicateSlugs.join(', ')}`);
  if (nonHttps.length) console.warn(`  !! ${nonHttps.length} source URL(s) not on https`);
  if (noFallback.length) console.warn(`  !! ${noFallback.length} failing record(s) with no archive copy`);
  console.log(`  wrote ${OUT}`);

  if (MD_OUT) {
    await writeFile(abs(MD_OUT), renderMarkdownTable(health), 'utf8');
    console.log(`  wrote ${MD_OUT}`);
  }

  if (stale) {
    console.warn(`\n  !! link verification is stale (${ageDays == null ? 'never run' : `${ageDays} days`}); the site stamp will show as stale.`);
    if (STALE_DAYS > 0) process.exit(2);
  }
}

/** The markdown table /about/ can drop straight into its "How links are verified" section. */
export function renderMarkdownTable(health) {
  const lines = [
    '| Status | Meaning | Records |',
    '| --- | --- | --- |',
    ...health.linkStates.map((s) => `| ${s.label} | ${s.blurb} | ${s.count} |`),
    '',
    '| Flag | Meaning | Records |',
    '| --- | --- | --- |',
    ...health.flags.map((f) => `| \`${f.key}\` | ${f.blurb ?? ''} | ${f.count} |`),
    '',
  ];
  return lines.join('\n');
}

main().catch((err) => {
  console.error('catalogue-health: fatal', err);
  process.exit(1);
});
