/**
 * GET /cite/<slug>.bib, /cite/<slug>.ris, /cite/<slug>.json and /citations.bib
 *
 * src/pages/cite/[slug].bib.ts      (BibTeX, one record)
 * src/pages/cite/[slug].ris.ts      (RIS, one record)
 * src/pages/cite/[slug].json.ts     (CSL-JSON, one record)
 * src/pages/citations.bib.ts        (every record, one library)
 *
 * This file is written for the .bib route; the other three are identical except
 * for the last two lines. Keeping them as prerendered routes means no runtime
 * function and no cost on Cloudflare Pages.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { toBibtex } from '../../lib/cite.mjs';
import health from '../../data/health.json';

export const prerender = true;

import documents from '../../data/documents.json';
const docs = (Array.isArray(documents) ? documents : documents.documents) as Array<Record<string, unknown>>;

export const getStaticPaths = (() =>
  docs.map((doc) => ({ params: { slug: String(doc.slug ?? doc.id) }, props: { doc } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const doc = (props as { doc: Record<string, unknown> }).doc;
  // Use the verification date as urldate so rebuilding unchanged data produces
  // an identical file (no spurious diffs, no "accessed today" churn).
  const urldate = health.verifiedAt ? String(health.verifiedAt).slice(0, 10) : undefined;

  const body = toBibtex(doc, { urldate });

  return new Response(body, {
    headers: {
      'content-type': 'application/x-bibtex; charset=utf-8',
      'content-disposition': `attachment; filename="${doc.slug ?? doc.id}.bib"`,
      'cache-control': 'public, max-age=604800',
    },
  });
};
