/**
 * Catalogue loading, shared by the CLI and the app server.
 *
 * The audit's underlying problem was that the same fact (a collection's date
 * range) was typed in two places and drifted. So every consumer here reads the
 * same loader, and nothing re-implements discovery.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Fields a record must have to be worth listing. */
export const isRecord = (o) =>
  Boolean(o) && typeof o === 'object' && typeof o.id === 'string' && typeof o.sourceUrl === 'string';

async function listJson(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of await readdir(dir)) {
    const abs = path.join(dir, name);
    const s = await stat(abs);
    if (s.isDirectory()) out.push(...(await listJson(abs)));
    else if (name.endsWith('.json')) out.push(abs);
  }
  return out;
}

/**
 * Load every catalogue record found under <root>/src/data (or an explicit file).
 * Files that are reports or derived health data are skipped.
 *
 * @param {string} root
 * @param {{dataFile?: string}} [opts]
 */
export async function loadCatalogue(root, opts = {}) {
  const files = opts.dataFile
    ? [path.resolve(root, opts.dataFile)]
    : (await listJson(path.join(root, 'src/data'))).filter(
        (f) => !/verify-report\.json$|health\.json$/.test(f),
      );

  const docs = [];
  const sources = [];
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.documents) ? parsed.documents : null;
    if (!arr) continue;
    const recs = arr.filter(isRecord);
    if (!recs.length) continue;
    sources.push(path.relative(root, file));
    docs.push(...recs);
  }
  return { docs, sources };
}

/** Load collection definitions, wherever they live. */
export async function loadCollections(root) {
  for (const file of (await listJson(path.join(root, 'src/data'))).filter((f) => /collection/i.test(f))) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.collections) ? parsed.collections : null;
    if (!arr) continue;
    return { file: path.relative(root, file), collections: arr };
  }
  return null;
}

/** Cached health/verify report, if the scripts have run. */
export async function loadReport(root, name) {
  const file = path.join(root, 'src/data', name);
  if (!existsSync(file)) return null;
  try {
    return { file: path.relative(root, file), data: JSON.parse(await readFile(file, 'utf8')) };
  } catch {
    return null;
  }
}

/** A tiny summary used by the app chrome on every response. */
export async function loadSummary(root, opts = {}) {
  const { docs, sources } = await loadCatalogue(root, opts);
  const health = (await loadReport(root, 'health.json'))?.data ?? null;
  return {
    records: docs.length,
    sources,
    verifiedLabel: health?.verifiedLabel ?? null,
    verifiedAt: health?.verifiedAt ?? null,
    stale: health?.stale ?? null,
    checkAgeDays: health?.checkAgeDays ?? null,
  };
}
