#!/usr/bin/env node
/**
 * Render social cards locally, without running an Astro build.
 *
 *   npm i -D satori @resvg/resvg-js
 *   node scripts/og-preview.mjs                     # -> .og-preview/default.png
 *   node scripts/og-preview.mjs --slug uk-nao-npfit # -> .og-preview/uk-nao-npfit.png
 *   node scripts/og-preview.mjs --all --out /tmp/og # every record, for eyeballing
 *
 * Useful for two things the audit asked for: checking that every doc page has a
 * card that actually renders, and catching text overflow before a bad card is
 * cached by three social networks.
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { renderOgPng } from '../site/lib/og-render.mjs';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const OUT_DIR = path.isAbsolute(String(flag('out', '.og-preview')))
  ? String(flag('out', '.og-preview'))
  : path.join(ROOT, String(flag('out', '.og-preview')));
const SLUG = flag('slug', null);
const ALL = Boolean(flag('all', false));
const STAMP = flag('stamp', null);

async function listJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  if ((await stat(abs)).isFile()) return [rel];
  const out = [];
  for (const n of await readdir(abs)) {
    const child = path.join(rel, n);
    if ((await stat(path.join(ROOT, child))).isDirectory()) out.push(...(await listJson(child)));
    else if (n.endsWith('.json')) out.push(child);
  }
  return out;
}

async function loadDocs() {
  const docs = [];
  for (const rel of await listJson('src/data')) {
    let parsed;
    try { parsed = JSON.parse(await readFile(path.join(ROOT, rel), 'utf8')); } catch { continue; }
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.documents) ? parsed.documents : null;
    if (arr) docs.push(...arr.filter((d) => d && typeof d.sourceUrl === 'string'));
  }
  return docs;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  if (SLUG || ALL) {
    const docs = await loadDocs();
    if (!docs.length) {
      console.error('og-preview: no catalogue data under src/data/');
      process.exit(1);
    }
    const targets = SLUG ? docs.filter((d) => d.slug === SLUG || d.id === SLUG) : docs;
    if (!targets.length) {
      console.error(`og-preview: no record matching "${SLUG}"`);
      process.exit(1);
    }
    for (const doc of targets) {
      const png = await renderOgPng(doc, { root: ROOT, stamp: STAMP });
      const name = `${doc.slug || doc.id}.png`;
      await writeFile(path.join(OUT_DIR, name), png);
      console.log(`${String(png.length).padStart(7)} B  ${name}`);
    }
    console.log(`\n${targets.length} card(s) in ${path.relative(ROOT, OUT_DIR)}/`);
    return;
  }

  // Site default card.
  const png = await renderOgPng(
    {
      id: 'VOL. II',
      title: 'Public records nobody reads, catalogued.',
      issuerShort: '250 records · 84 books · 16 collections',
      documentType: 'A reading room for the public record',
      status: null,
    },
    { root: ROOT, stamp: STAMP },
  );
  await writeFile(path.join(OUT_DIR, 'default.png'), png);
  console.log(`${png.length} B  default.png -> ${path.relative(ROOT, path.join(OUT_DIR, 'default.png'))}`);
}

main().catch((err) => {
  console.error('og-preview: fatal', err?.message || err);
  process.exit(1);
});
