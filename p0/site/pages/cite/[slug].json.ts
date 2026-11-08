/**
 * GET /cite/<slug>.json — CSL-JSON, what Pandoc's --citeproc and Zotero ingest.
 * src/pages/cite/[slug].json.ts
 *
 * Also serves /cite/<slug> (without extension) via a second route below, because
 * people paste /cite/<slug> from the page and expect something to happen.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { toCslJson } from '../../lib/cite.mjs';

export const prerender = true;

import documents from '../../data/documents.json';
const docs = (Array.isArray(documents) ? documents : documents.documents) as Array<Record<string, unknown>>;

export const getStaticPaths = (() =>
  docs.map((doc) => ({ params: { slug: String(doc.slug ?? doc.id) }, props: { doc } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const doc = (props as { doc: Record<string, unknown> }).doc;
  return new Response(`${JSON.stringify(toCslJson(doc), null, 2)}\n`, {
    headers: {
      'content-type': 'application/vnd.citationstyles.csl+json; charset=utf-8',
      'cache-control': 'public, max-age=604800',
    },
  });
};
