/**
 * GET /citations.bib — the whole catalogue as one BibTeX library.
 * src/pages/citations.bib.ts
 *
 * Generated from the same data as the per-record files, with stable urldates
 * (the verification date) so an unchanged catalogue produces an unchanged file.
 */
import type { APIRoute } from 'astro';
import { toBibtexLibrary } from '../lib/cite.mjs';
import health from '../data/health.json';

export const prerender = true;

import documents from '../data/documents.json';
const docs = (Array.isArray(documents) ? documents : documents.documents) as Array<Record<string, unknown>>;

export const GET: APIRoute = () => {
  const verified = health.verifiedAt ? String(health.verifiedAt) : undefined;
  const body = toBibtexLibrary(docs, {
    urldate: verified?.slice(0, 10),
    generatedAt: verified ?? undefined,
  });

  return new Response(body, {
    headers: {
      'content-type': 'application/x-bibtex; charset=utf-8',
      'content-disposition': 'attachment; filename="quiet-archive.bib"',
      'cache-control': 'public, max-age=3600',
    },
  });
};
