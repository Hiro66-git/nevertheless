#!/usr/bin/env node
/**
 * Collection integrity check — the guard for the audit's finding #1.
 *
 * The homepage said "Failed Procurement Programs · 11 documents · 1999–2023"
 * while /collections/ said "11 documents · 1962–2023" for the same collection.
 * The document count matched, so nobody noticed the range was a different
 * string typed by a different hand.
 *
 * This script recomputes every collection's count, date range and step count
 * from the catalogue and fails the build on any disagreement.
 *
 * Usage
 *   node scripts/check-collections.mjs                  # verify; exit 1 on drift
 *   node scripts/check-collections.mjs --fix            # rewrite derived ranges
 *   node scripts/check-collections.mjs --json out.json  # embed in /health/
 *
 * Exit codes: 0 ok · 1 drift found · 2 unreadable data
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { dateRange } from '../site/lib/dates.mjs';

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

const FIX = Boolean(flag('fix', false));
const JSON_OUT = flag('json', null);
const STRICT = Boolean(flag('strict', false));

/* ------------------------------------------------------------------ loading */

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

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
}

/** Find the collection definitions file without hard-coding its name. */
async function loadCollections() {
  const explicit = flag('collections');
  const candidates = explicit
    ? [String(explicit)]
    : (await listJson('src/data')).filter((f) => /collection/i.test(f));

  for (const rel of candidates) {
    const parsed = await readJson(rel).catch(() => null);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.collections) ? parsed.collections : null;
    if (arr && arr.some((c) => c && (c.slug || c.id) && Array.isArray(c.documents ?? c.docs ?? c.steps ?? c.entries))) {
      return { rel, container: parsed, arr, isArray: Array.isArray(parsed) };
    }
  }
  return null;
}

async function loadDocs() {
  const docs = new Map();
  for (const rel of await listJson('src/data')) {
    if (/collection/i.test(rel)) continue;
    let parsed;
    try { parsed = await readJson(rel); } catch { continue; }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.documents) ? parsed.documents : null;
    if (!arr) continue;
    for (const d of arr) {
      if (d && typeof d.sourceUrl === 'string') docs.set(d.id, d);
      if (d?.slug) docs.set(`slug:${d.slug}`, d);
    }
  }
  return docs;
}

/* -------------------------------------------------------------------- check */

const problems = [];

/** Collapse a range label so "1995–1995" and "1995" compare equal. */
function normalizeRange(label) {
  const parts = String(label).split(/\s*[–—-]\s*/).filter(Boolean);
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0];
  return parts.join('–');
}


function report(level, collectionName, message) {
  problems.push({ level, collection: collectionName, message });
  const glyph = level === 'error' ? 'x' : level === 'warn' ? '!' : '-';
  console.log(`  ${glyph} [${collectionName}] ${message}`);
}

async function main() {
  const found = await loadCollections();
  if (!found) {
    console.error('check-collections: no collections file found under src/data/. Use --collections <path>.');
    process.exit(2);
  }
  const docs = await loadDocs();
  console.log(`Collections: ${found.rel} (${found.arr.length})`);
  console.log(`Catalogue:   ${docs.size} keys\n`);

  const computed = [];

  for (const collection of found.arr) {
    const name = collection.slug || collection.id || collection.title || '?';
    const members = collection.documents ?? collection.docs ?? collection.steps ?? collection.entries;

    // Resolve each member reference to a catalogue record.
    const resolved = [];
    const missing = [];
    for (const ref of members) {
      const key = typeof ref === 'string' ? ref : ref?.slug || ref?.id || ref?.document;
      if (!key) { missing.push(JSON.stringify(ref)); continue; }
      const doc = docs.get(key) || docs.get(`slug:${key}`);
      if (!doc) missing.push(key);
      else resolved.push(doc);
    }

    if (missing.length) {
      report('error', name, `${missing.length} member(s) not found in the catalogue: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}`);
    }

    // Duplicate members inside one collection.
    const seen = new Set();
    const dupes = [];
    for (const d of resolved) {
      if (seen.has(d.id)) dupes.push(d.id);
      seen.add(d.id);
    }
    if (dupes.length) report('warn', name, `same record listed twice: ${dupes.join(', ')}`);

    // The core drift check.
    const range = dateRange(resolved);
    const statedCount = typeof collection.documentCount === 'number'
      ? collection.documentCount
      : typeof collection.count === 'number' ? collection.count : null;
    const statedRange = collection.dateRange ?? collection.range ?? collection.years ?? null;

    if (statedCount != null && statedCount !== resolved.length) {
      report('error', name, `documentCount says ${statedCount}, catalogue has ${resolved.length}`);
    }
    if (statedRange && range.label && String(statedRange) !== range.label) {
      // A single-year collection written as "1995–1995" is a formatting wart, not
      // wrong data: downgrade it so real drift stays loud.
      const degenerate = range.min === range.max
        && normalizeRange(String(statedRange)) === normalizeRange(`${range.min}–${range.max}`);
      report(
        degenerate ? 'warn' : 'error',
        name,
        `dateRange says "${statedRange}", catalogue computes "${range.label}" (earliest ${range.min}, latest ${range.max})`,
      );
      if (FIX) {
        if ('dateRange' in collection || !('range' in collection) && !('years' in collection)) collection.dateRange = range.label;
        else if ('range' in collection) collection.range = range.label;
        else collection.years = range.label;
      }
    }
    if (FIX && statedCount != null && statedCount !== resolved.length) collection.documentCount = resolved.length;

    // Records whose dates are guesses must not silently anchor a range label.
    const approximateEdge = resolved.filter((d) => {
      const flags = d.flags ?? [];
      const y = typeof d.year === 'number' ? d.year : null;
      return flags.includes('document-date-approx') && (y === range.min || y === range.max);
    });
    if (approximateEdge.length) {
      report('warn', name, `range edge rests on an approximate date (${approximateEdge.map((d) => d.id).join(', ')}); UI should show "c." for this end`);
    }

    // Collections with no stated range at all: nothing to drift, but worth knowing.
    if (!statedRange) report('info', name, `no stored dateRange; pages must compute "${range.label ?? 'n/a'}" from data`);

    computed.push({
      slug: collection.slug || collection.id,
      title: collection.title,
      count: resolved.length,
      statedCount,
      min: range.min,
      max: range.max,
      dateRange: range.label,
      statedRange,
      documentIds: resolved.map((d) => d.id),
      hasUncertainEdges: approximateEdge.length > 0,
    });
  }

  /* ------------------------------------------- cross-collection invariants */

  // Every catalogue record should be in at most one collection? No — but a record
  // in no collection is invisible to browsing, so surface it.
  const inAnyCollection = new Set(computed.flatMap((c) => c.documentIds));
  const orphans = [...new Set([...docs.values()].map((d) => d.id))].filter((id) => !inAnyCollection.has(id));
  if (orphans.length) {
    console.log(`  - ${orphans.length} record(s) in no collection: ${orphans.slice(0, 10).join(', ')}${orphans.length > 10 ? '…' : ''}`);
    problems.push({ level: 'info', collection: null, message: `${orphans.length} records are in no collection`, ids: orphans });
  }

  /* --------------------------------------------------------------- output */

  const errors = problems.filter((p) => p.level === 'error');
  const warns = problems.filter((p) => p.level === 'warn');

  if (JSON_OUT) {
    await writeFile(
      abs(JSON_OUT),
      `${JSON.stringify({ generatedAt: new Date().toISOString(), source: found.rel, collections: computed, problems, orphans }, null, 2)}\n`,
      'utf8',
    );
    console.log(`\nWrote ${JSON_OUT}`);
  }

  if (FIX && errors.length) {
    const payload = found.isArray ? found.arr : { ...found.container, collections: found.arr };
    await writeFile(path.join(ROOT, found.rel), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`\nRewrote ${found.rel}`);
  }

  console.log('');
  if (errors.length) {
    console.log(`${errors.length} drift error(s), ${warns.length} warning(s).${FIX ? ' Fixed in place — re-run without --fix to confirm.' : ' Re-run with --fix to rewrite derived ranges.'}`);
    process.exit(FIX ? 0 : 1);
  }
  console.log(`No drift. ${warns.length} warning(s), ${problems.length - errors.length - warns.length} note(s).`);
  if (STRICT && warns.length) process.exit(1);
}

main().catch((err) => {
  console.error('check-collections: fatal', err);
  process.exit(2);
});
