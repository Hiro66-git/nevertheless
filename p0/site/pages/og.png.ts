/**
 * GET /og.png — the site-wide social card.
 *
 * src/pages/og.png.ts
 *
 * Requires (devDependencies): satori, @resvg/resvg-js
 * Fonts: put Inter TTFs in src/assets/fonts/ (Inter-Regular/SemiBold/Bold.ttf)
 * so the build never depends on a CDN.
 */
import type { APIRoute } from 'astro';
import { renderOgPng } from '../lib/og-render.mjs';
import health from '../data/health.json';

export const prerender = true;

export const GET: APIRoute = async () => {
  const stamp = health.verifiedLabel?.replace('Links verified ', '') ?? null;

  const png = await renderOgPng(
    {
      id: 'VOL. II',
      title: 'Public records nobody reads, catalogued.',
      issuerShort: health.totals.records
        ? `${health.totals.records} records · every link checked`
        : 'A reading room for the public record',
      documentType: 'A reading room for the public record',
      status: null,
    },
    { stamp },
  );

  return new Response(png, {
    headers: {
      'content-type': 'image/png',
      // Cards are rebuilt whenever the catalogue changes; cache for a week.
      'cache-control': 'public, max-age=604800, immutable',
    },
  });
};
