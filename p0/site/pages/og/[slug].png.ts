/**
 * GET /og/<slug>.png — one social card per document.
 *
 * src/pages/og/[slug].png.ts
 *
 * 250 records × ~55 KB ≈ 14 MB of static PNGs, which is fine for Cloudflare
 * Pages (25 MB per asset, 20k files per deployment) and far better than a
 * runtime screenshot service: nothing third-party is contacted when a reader
 * loads a page, so the site keeps its "no third-party requests" promise.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgPng, ogImagePath } from '../../lib/og-render.mjs';
import health from '../../data/health.json';

export const prerender = true;

// Adjust this import to wherever the catalogue actually lives.
import documents from '../../data/documents.json';

const docs = Array.isArray(documents)
  ? documents
  : (documents as { documents: unknown[] }).documents;

export const getStaticPaths = (() =>
  (docs as Array<Record<string, unknown>>).map((doc) => ({
    params: { slug: String(doc.slug ?? doc.id) },
    props: { doc },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const doc = (props as { doc: Record<string, unknown> }).doc;
  const stamp = health.verifiedLabel?.replace('Links verified ', '') ?? null;

  const png = await renderOgPng(doc, { stamp });

  return new Response(png, {
    headers: {
      'content-type': 'image/png',
      // The record itself changes rarely; a new verify run does not change the
      // card except for the stamp, so a week is a safe, cheap cache window.
      'cache-control': 'public, max-age=604800',
      'x-og-image-for': ogImagePath(String(doc.slug ?? doc.id)),
    },
  });
};
