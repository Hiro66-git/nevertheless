/**
 * Citation export for The Quiet Archive.
 *
 * Every document page already renders a hand-made MLA-ish sentence. That is fine
 * to read but useless to paste into Zotero, and the audit flagged the absence
 * of BibTeX/RIS as a real barrier for the archive's most likely heavy users:
 * students, journalists and researchers.
 *
 * These builders are pure functions of the catalogue record, so the same text
 * appears in /cite/<slug>.bib, the page footer, and /citations.bib.
 *
 * No dependencies.
 */

import { parseCatalogueDate } from './dates.mjs';

const SITE_NAME = 'The Quiet Archive';
const SITE_URL = 'https://quiet-archive-19i.pages.dev';

/* ---------------------------------------------------------------- helpers */

/** Escape the ten characters BibTeX treats as special. */
export function bibtexEscape(input) {
  return String(input ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/** Person-ish name -> "Borah, Heerak Jyoti" (best effort; no dependencies). */
function invertName(name) {
  const n = String(name ?? '').trim();
  if (!n) return '';
  if (n.includes(',')) return n;
  const parts = n.split(/\s+/);
  if (parts.length === 1) return n;
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
}

function firstAuthor(doc) {
  const author = doc.author || doc.issuerLong || doc.issuerShort || doc.issuer || doc.host || SITE_NAME;
  return String(author);
}

/** A stable, readable citation key: issuerShort + year + slug words. */
export function citationKey(doc) {
  const issuer = String(doc.issuerShort || doc.host || 'qa')
    .toLowerCase().replace(/[^a-z0-9]+/g, '');
  const year = parseCatalogueDate(doc.documentDate)?.year
    ?? parseCatalogueDate(doc.releaseDate)?.year
    ?? 'nd';
  const slugWords = String(doc.slug || doc.id || '')
    .toLowerCase()
    .replace(/^(bv|ia|ga|pi|osti|ntrs|nl|uk|ca|au|in)-/, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('');
  return `${issuer}${year}${slugWords}`.replace(/-/g, '');
}

function isoDate(value) {
  const d = parseCatalogueDate(value);
  if (!d) return null;
  const mm = String(d.month ?? 1).padStart(2, '0');
  const dd = String(d.day ?? 1).padStart(2, '0');
  return `${d.year}-${mm}-${dd}`;
}

function pageUrl(doc) {
  return `${SITE_URL}/doc/${doc.slug || doc.id}/`;
}

/* ------------------------------------------------------------------ bibtex */

/**
 * @param {object} doc
 * @param {{key?:string, siteUrl?:string}} [opts]
 * @returns {string} a single @misc entry
 */
export function toBibtex(doc, opts = {}) {
  const key = opts.key || citationKey(doc);
  const author = firstAuthor(doc);
  const year = parseCatalogueDate(doc.documentDate)?.year
    ?? parseCatalogueDate(doc.releaseDate)?.year
    ?? 'n.d.';
  const fields = [
    ['author', `{${bibtexEscape(author)}}`],
    ['title', `{${bibtexEscape(doc.title)}}`],
    ['year', `{${year}}`],
    doc.issuerLong && ['institution', `{${bibtexEscape(doc.issuerLong)}}`],
    doc.documentType && ['type', `{${bibtexEscape(titleCase(doc.documentType))}}`],
    ['howpublished', `{\\url{${doc.sourceUrl}}}`],
    doc.archive && ['note', `{Internet Archive copy: \\url{${doc.archive}}}`],
    doc.id && ['number', `{${bibtexEscape(doc.id)}}`],
    doc.releaseDate && ['yearpublished', null], // dropped below: BibTeX has no such field
    ['url', `{${pageUrl(doc)}}`],
    // Pass opts.urldate (e.g. the verify run's date) so rebuilding unchanged data
    // produces byte-identical output instead of a new day on every build.
    ['urldate', `{${(opts.urldate || todayUtc())}}`],
  ]
    .filter((f) => f && f[1] !== null)
    .map(([k, v]) => `  ${k.padEnd(14)} = ${v}`);

  return `@misc{${key},\n${fields.join(',\n')}\n}\n`;
}

/* --------------------------------------------------------------------- RIS */

/**
 * RIS (RefMan) — understood by Zotero, EndNote, Mendeley, Papers.
 * @returns {string}
 */
export function toRis(doc) {
  const lines = [
    'TY  - GEN',
    `TI  - ${doc.title ?? ''}`,
    `AU  - ${firstAuthor(doc)}`,
  ];
  if (doc.issuerLong) lines.push(`PB  - ${doc.issuerLong}`);
  const issued = isoDate(doc.documentDate);
  if (issued) lines.push(`DA  - ${issued}`);
  const released = isoDate(doc.releaseDate);
  if (released) lines.push(`Y2  - ${released}`);
  if (doc.country) lines.push(`CY  - ${doc.country}`);
  if (doc.summary) lines.push(`AB  - ${oneLine(doc.summary)}`);
  if (doc.documentType) lines.push(`M3  - ${titleCase(doc.documentType)}`);
  lines.push(`UR  - ${doc.sourceUrl}`);
  if (doc.archive) lines.push(`L2  - ${doc.archive}`);
  for (const tag of doc.tags ?? []) lines.push(`KW  - ${tag}`);
  lines.push(`N1  - ${doc.id ? `${doc.id} · ` : ''}Catalogued in ${SITE_NAME}: ${pageUrl(doc)}`);
  lines.push('ER  - ', '');
  return lines.join('\n');
}

/* ---------------------------------------------------------------- CSL-JSON */

/**
 * CSL-JSON — what Zotero's connector and Pandoc's --citeproc consume directly.
 */
export function toCslJson(doc) {
  const author = firstAuthor(doc);
  const written = parseCatalogueDate(doc.documentDate);
  const released = parseCatalogueDate(doc.releaseDate);
  const dateParts = written ? [written.year, written.month, written.day].filter((x) => x != null) : null;
  return {
    id: doc.id || doc.slug,
    type: 'report',
    title: doc.title,
    author: [{ literal: author }],
    publisher: doc.issuerLong || doc.issuer || doc.host || SITE_NAME,
    issued: dateParts ? { 'date-parts': [dateParts] } : undefined,
    'event-date': released ? { 'date-parts': [[released.year, released.month, released.day].filter((x) => x != null)] } : undefined,
    URL: doc.sourceUrl,
    archive: doc.archive || undefined,
    archive_location: doc.id ? `${SITE_NAME} ${doc.id}` : undefined,
    note: doc.summary,
    keyword: (doc.tags ?? []).join(', ') || undefined,
    genre: doc.documentType ? titleCase(doc.documentType) : undefined,
    'container-title': doc.country ? `${doc.country} public record` : undefined,
  };
}

/* --------------------------------------------------------------- plain text */

/**
 * Human-readable citation for the page footer, in Chicago-ish note style.
 * Replaces the hand-rolled sentence the audit found (which said "accessed via
 * The Quiet Archive" but never gave a stable URL to the catalogue entry).
 */
export function toPlainCitation(doc, { accessed = new Date() } = {}) {
  const author = firstAuthor(doc);
  const written = parseCatalogueDate(doc.documentDate);
  const released = parseCatalogueDate(doc.releaseDate);
  const bits = [`${author}. “${doc.title}.”`];
  if (written) bits.push(`${written.year}.`);
  if (released) bits.push(`Released ${released.day ?? ''}${released.month ? ` ${monthName(released.month)}` : ''} ${released.year}.`.replace(/\s+/g, ' '));
  bits.push(`${doc.sourceUrl}.`);
  bits.push(`Archived in ${SITE_NAME}${doc.id ? ` as ${doc.id}` : ''}: ${pageUrl(doc)} (accessed ${accessed.getUTCDate()} ${monthName(accessed.getUTCMonth() + 1)} ${accessed.getUTCFullYear()}).`);
  return bits.join(' ');
}

/* --------------------------------------------------------------- multiline */

/**
 * A whole-catalogue .bib for /citations.bib. Keys are de-duplicated so two
 * records with the same issuer/year/slug stem don't silently collide.
 */
export function toBibtexLibrary(docs, opts = {}) {
  const used = new Map();
  const entries = docs.map((doc) => {
    const base = citationKey(doc);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return toBibtex(doc, { key: n === 1 ? base : `${base}${String.fromCharCode(96 + n)}`, urldate: opts.urldate });
  });
  return [
    `% ${SITE_NAME} — ${docs.length} catalogue entries`,
    `% Generated ${opts.generatedAt || new Date().toISOString()}`,
    `% Source data: ${SITE_URL}/search-index.json`,
    '',
    ...entries,
  ].join('\n');
}

/* ---------------------------------------------------------------- helpers */

/** UTC today, YYYY-MM-DD. */
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function oneLine(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function titleCase(s) {
  return String(s ?? '').replace(/(^|[\s-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

function monthName(n) {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'][n - 1] ?? '';
}
