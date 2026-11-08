/**
 * GET /health.json — machine-readable catalogue health.
 * src/pages/health.json.ts
 *
 * The archive already publishes /search-index.json so that other people can
 * build on it. This is the same courtesy for its own upkeep: a monitor, a
 * journalist or a funder can poll one URL and see whether links are still being
 * checked, instead of reading a hand-typed date.
 */
import type { APIRoute } from 'astro';
import health from '../data/health.json';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(health, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=3600',
    },
  });
