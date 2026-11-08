/**
 * GET /sitemap.xml -> /sitemap-index.xml
 *
 * src/pages/sitemap.xml.ts
 *
 * The audit found /sitemap.xml returning the site's 404 page while robots.txt
 * pointed at /sitemap-index.xml. Search Console and many crawlers try
 * /sitemap.xml first, so the wrong guess costs indexing.
 *
 * Two ways to fix it. Pick one:
 *
 *   A. (recommended) this redirect, so /sitemap.xml always tracks whatever the
 *      @astrojs/sitemap integration emits — no duplicated list to drift.
 *   B. in astro.config.mjs set `sitemap({ entryLimit: 45000 })` and add
 *      `customPages`, then generate /sitemap.xml directly.
 *
 * If the host does not run redirects for prerendered HTML, add a public/_redirects
 * line instead:  /sitemap.xml  /sitemap-index.xml  301
 */
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(null, {
    status: 301,
    headers: {
      location: '/sitemap-index.xml',
      'cache-control': 'public, max-age=86400',
    },
  });
