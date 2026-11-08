#!/usr/bin/env node
/**
 * Sitemap generator for The Quiet Archive.
 *
 * Replaces @astrojs/sitemap entirely.
 *
 * Why: the integration is the thing that crashed. Two separate defects —
 *   1. @astrojs/sitemap 3.7.4 throws "Cannot read properties of undefined
 *      (reading 'reduce')" in astro:build:done when it finds no page routes
 *      to collect, which is exactly the case when a project has no index or
 *      when the catalogue pages are generated elsewhere.
 *   2. If no sitemap is produced at all, robots.txt still advertises
 *      /sitemap-index.xml, so crawlers get a 404 for the one file that is
 *      supposed to list everything.
 *
 * This script has no dependency on Astro's integration API: it reads the built
 * output (dist/) plus the catalogue, and writes a valid sitemap index + shards.
 * It runs after `astro build`, so whatever routes exist are already on disk.
 *
 * Usage
 *   node scripts/sitemap.mjs                       # after astro build
 *   node scripts/sitemap.mjs --site https://example.org --dist dist
 *   node scripts/sitemap.mjs --check                # verify only, write nothing
 *   node scripts/sitemap.mjs --robots               # also rewrite robots.txt
 *
 * Output (Sitemaps 0.9):
 *   dist/sitemap-index.xml
 *   dist/sitemap-0.xml ... (45,000 URLs per shard, the protocol limit)
 */

import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';


const ROOT = process.cwd();
const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const SITE = String(flag('site', process.env.SITE_URL ?? 'https://quiet-archive-19i.pages.dev')).replace(/\/+$/, '');
const DIST = String(flag('dist', 'dist'));
const CHECK_ONLY = Boolean(flag('check', false));
const WRITE_ROBOTS = Boolean(flag('robots', false));
const MAX_PER_SHARD = Number(flag('per-shard', 45000));
const VERIFIED_AT = flag('verified-at', null);

/** Paths that must never appear in a sitemap. */
const EXCLUDE = [
  /^\/random\//,           // deliberately non-canonical, and robots-disallowed
  /^\/404/,
  /^\/og\//,               // images, not pages
  /^\/cite\//,
  /^\/search-index\.json$/,
  /^\/health\.json$/,
  /\/rss\.xml$/,
  /^\/sitemap.*\.xml$/,
];

/** Rank hint. Not honoured by Google any more, but harmless and useful for others. */
function priority(urlPath) {
  if (urlPath === '/') return '1.0';
  if (/^\/(collections|library|guides|explore)\/?$/.test(urlPath)) return '0.9';
  if (/^\/doc\//.test(urlPath)) return '0.8';
  if (/^\/(about|health)\//.test(urlPath)) return '0.5';
  return '0.6';
}

function changefreq(urlPath) {
  if (urlPath === '/' || urlPath === '/explore/' || urlPath === '/collections/') return 'weekly';
  if (/^\/doc\//.test(urlPath)) return 'monthly';
  if (/^\/(about|health)\//.test(urlPath)) return 'weekly';
  return 'monthly';
}

async function walkDist(rel = '') {
  const abs = path.join(ROOT, DIST, rel);
  const out = [];
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walkDist(childRel)));
    else out.push(childRel);
  }
  return out;
}

/**
 * Derive page URLs from the built files. `dist/doc/foo/index.html` -> `/doc/foo/`.
 * Root index.html -> `/`. Files that are not HTML pages (PNG, JSON, BIB) are skipped.
 */
function urlForFile(file) {
  if (!file.endsWith('.html')) return null;
  if (file.endsWith('index.html')) {
    const dir = file.slice(0, -'index.html'.length).replace(/\/$/, '');
    return dir === '' ? '/' : `/${dir}/`;
  }
  // 404.html and friends are real files but not canonical pages.
  const base = file.replace(/\.html$/, '');
  if (/(^|\/)404$/.test(base)) return null;
  return `/${base}`;
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Optional per-URL lastmod from the catalogue's own `checked` timestamps. */
async function loadLastmods() {
  const map = new Map();
  const dir = path.join(ROOT, 'src/data');
  if (!existsSync(dir)) return map;
  for (const name of await readdir(dir)) {
    if (!name.endsWith('.json')) continue;
    if (/verify-report|health/.test(name)) continue;
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
    } catch {
      continue;
    }
    const arr = Array.isArray(parsed) ? parsed : parsed?.documents;
    if (!Array.isArray(arr)) continue;
    for (const doc of arr) {
      if (!doc?.slug) continue;
      const when = doc.checked ?? doc.addedAt ?? doc.releaseDate;
      if (when) map.set(`/doc/${doc.slug}/`, String(when).slice(0, 10));
    }
  }
  return map;
}

async function main() {
  if (!existsSync(path.join(ROOT, DIST))) {
    console.error(`sitemap: no build output at ${DIST}/ — run "astro build" first (or pass --dist).`);
    process.exit(1);
  }

  const files = await walkDist();
  const seen = new Set();
  const urls = [];

  for (const file of files) {
    const u = urlForFile(file);
    if (!u || seen.has(u)) continue;
    if (EXCLUDE.some((re) => re.test(u))) continue;
    seen.add(u);
    urls.push(u);
  }

  // The catalogue's document pages are the bulk of the site. If the build did not
  // emit them (e.g. a partial build), say so loudly rather than shipping a
  // sitemap that omits 250 pages.
  const docPages = urls.filter((u) => u.startsWith('/doc/')).length;
  const lastmods = await loadLastmods();
  const expectedDocs = [...lastmods.keys()].length;
  if (expectedDocs > 0 && docPages === 0) {
    console.warn(
      `sitemap: !! the catalogue has ${expectedDocs} document pages but the build emitted none.\n` +
        '         Have you built the whole site? The sitemap will be missing every record.',
    );
  }

  urls.sort((a, b) => a.localeCompare(b));

  /* ------------------------------------------------------------- summary */

  console.log(`sitemap: ${urls.length} URLs from ${DIST}/ (${docPages} documents)${CHECK_ONLY ? ' [check only]' : ''}`);

  const bySection = {};
  for (const u of urls) {
    const section = u === '/' ? '(home)' : `/${u.split('/')[1]}/`;
    bySection[section] = (bySection[section] || 0) + 1;
  }
  for (const [k, v] of Object.entries(bySection).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }

  if (CHECK_ONLY) {
    verifyOrDie(urls, lastmods);
    return;
  }

  if (!urls.length) {
    console.error('sitemap: refusing to write an empty sitemap (crawlers treat that as a crawl error).');
    process.exit(1);
  }

  /* -------------------------------------------------------------- write */

  const shards = [];
  for (let i = 0; i < urls.length; i += MAX_PER_SHARD) shards.push(urls.slice(i, i + MAX_PER_SHARD));

  const written = [];
  for (const [i, shard] of shards.entries()) {
    const body = shard
      .map((u) => {
        const loc = `${SITE}${u}`;
        const lastmod = lastmods.get(u) ?? (VERIFIED_AT ? String(VERIFIED_AT).slice(0, 10) : null);
        return [
          '  <url>',
          `    <loc>${escape(loc)}</loc>`,
          lastmod ? `    <lastmod>${escape(lastmod)}</lastmod>` : null,
          `    <changefreq>${changefreq(u)}</changefreq>`,
          `    <priority>${priority(u)}</priority>`,
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
    const name = `sitemap-${i}.xml`;
    await writeFile(path.join(ROOT, DIST, name), xml, 'utf8');
    written.push(name);
  }

  // Always an index, even with a single shard: robots.txt already points at
  // sitemap-index.xml, so that URL must exist. (This was the 404.)
  const indexXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    written
      .map((name) => {
        const lastmod = VERIFIED_AT ? `\n    <lastmod>${escape(String(VERIFIED_AT).slice(0, 10))}</lastmod>` : '';
        return `  <sitemap>\n    <loc>${escape(`${SITE}/${name}`)}</loc>${lastmod}\n  </sitemap>`;
      })
      .join('\n') +
    `\n</sitemapindex>\n`;

  await writeFile(path.join(ROOT, DIST, 'sitemap-index.xml'), indexXml, 'utf8');
  written.push('sitemap-index.xml');

  // Remove stale shards from previous builds with more URLs.
  for (const file of await walkDist()) {
    const m = file.match(/^sitemap-(\d+)\.xml$/);
    if (m && !written.includes(file)) {
      await writeFile(path.join(ROOT, DIST, file), '', 'utf8');
      console.log(`  removed stale ${file}`);
    }
  }

  for (const name of written) console.log(`  wrote ${DIST}/${name}`);

  /* ------------------------------------------------------------- robots */

  if (WRITE_ROBOTS) {
    const robots = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /random/',
      '',
      `Sitemap: ${SITE}/sitemap-index.xml`,
      '',
    ].join('\n');
    await mkdir(path.join(ROOT, DIST), { recursive: true });
    await writeFile(path.join(ROOT, DIST, 'robots.txt'), robots, 'utf8');
    console.log(`  wrote ${DIST}/robots.txt (pointing at /sitemap-index.xml)`);
  }

  verifyOrDie(urls, lastmods);
}

/** Cheap self-check so a malformed sitemap never ships. */
function verifyOrDie(urls, lastmods) {
  const problems = [];

  if (urls.some((u) => !u.startsWith('/'))) problems.push('a URL does not start with "/"');
  if (new Set(urls).size !== urls.length) problems.push('duplicate URLs');
  if (urls.some((u) => u.includes('//'))) problems.push('a URL contains "//"');
  const bad = urls.filter((u) => EXCLUDE.some((re) => re.test(u)));
  if (bad.length) problems.push(`excluded paths present: ${bad.slice(0, 3).join(', ')}`);

  const noLastmod = urls.filter((u) => u.startsWith('/doc/') && !lastmods.has(u));
  if (noLastmod.length) {
    console.log(`  note: ${noLastmod.length} document URL(s) have no lastmod (catalogue has no checked/addedAt/releaseDate)`);
  }

  if (problems.length) {
    for (const p of problems) console.error(`sitemap: x ${p}`);
    process.exit(1);
  }
  console.log('  self-check passed (unique, canonical, no excluded paths)');
}

main().catch((err) => {
  console.error('sitemap: fatal', err);
  process.exit(1);
});
