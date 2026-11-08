/**
 * GET /cite/<slug>.ris — RIS, understood by Zotero, EndNote, Mendeley, Papers.
 * src/pages/cite/[slug].ris.ts
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { toRis } from '../../lib/cite.mjs';

export const prerender = true;

import documents from '../../data/documents.json';
const docs = (Array.isArray(documents) ? documents : documents.documents) as Array<Record<string, unknown>>;

export const getStaticPaths = (() =>
  docs.map((doc) => ({ params: { slug: String(doc.slug ?? doc.id) }, props: { doc } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const doc = (props as { doc: Record<string, unknown> }).doc;
  return new Response(toRis(doc), {
    headers: {
      'content-type': 'application/x-research-info-systems; charset=utf-8',
      'content-disposition': `attachment; filename="${doc.slug ?? doc.id}.ris"`,
      'cache-control': 'public, max-age=604800',
    },
  });
};
