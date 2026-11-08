/**
 * Social-card renderer for The Quiet Archive.
 *
 * The audit found no OG verification and no per-document images: every link
 * posted to Mastodon/Bluesky/Reddit rendered as a bare URL. This module turns a
 * catalogue record into a 1200×630 PNG at build time — no runtime rendering, no
 * third-party screenshot service, nothing fetched when a reader loads a page.
 *
 * Used by src/pages/og.png.ts (site default) and src/pages/og/[slug].png.ts.
 * Kept as plain .mjs with lazy imports so `node scripts/og-preview.mjs` can
 * render a PNG locally without an Astro build.
 *
 * Needs two build-time dependencies (devDependencies):
 *   npm i -D satori @resvg/resvg-js
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { formatCatalogueDate } from './dates.mjs';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/* ------------------------------------------------------------------ fonts */

const FONT_SOURCES = [
  // Inter ships static TTFs; jsdelivr serves them without a redirect chain.
  { weight: 400, url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.20/files/inter-latin-400-normal.woff' },
  { weight: 600, url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.20/files/inter-latin-600-normal.woff' },
  { weight: 700, url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.20/files/inter-latin-700-normal.woff' },
];

// Order matters for satori: woff/woff2 support is not universal, TTF is safest.
const LOCAL_FONT_DIRS = ['src/assets/fonts', 'public/fonts', 'fonts'];
const LOCAL_FONT_FILES = {
  400: ['Inter-Regular.ttf', 'inter-regular.ttf'],
  600: ['Inter-SemiBold.ttf', 'inter-semibold.ttf'],
  700: ['Inter-Bold.ttf', 'inter-bold.ttf'],
};

let fontCache = null;

/**
 * Load fonts once per build. A local TTF in src/assets/fonts/ always wins so
 * builds keep working offline and the rendering never changes under us.
 */
export async function loadFonts(root = process.cwd()) {
  if (fontCache) return fontCache;
  const fonts = [];

  for (const [weight, names] of Object.entries(LOCAL_FONT_FILES)) {
    for (const dir of LOCAL_FONT_DIRS) {
      const hit = names.map((n) => path.join(root, dir, n)).find((p) => existsSync(p));
      if (hit) {
        fonts.push({ name: 'Inter', weight: Number(weight), style: 'normal', data: await readFile(hit) });
        break;
      }
    }
  }

  if (fonts.length < 3) {
    for (const src of FONT_SOURCES) {
      if (fonts.some((f) => f.weight === src.weight)) continue;
      const data = await fetchWithRetry(src.url);
      // satori accepts ArrayBuffer/TypedArray for woff/woff2 and TTF alike.
      fonts.push({ name: 'Inter', weight: src.weight, style: 'normal', data });
    }
  }

  fontCache = fonts.sort((a, b) => a.weight - b.weight);
  return fontCache;
}

async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`font HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error(
    `og: could not load a font (${lastErr?.message}). ` +
      'Add Inter TTFs to src/assets/fonts/ to build offline.',
  );
}

/* ----------------------------------------------------------------- markup */

const PAPER = '#FBF7EF';
const INK = '#191613';
const INK_SOFT = '#6B635A';
const RULE = '#D9D0C1';
const ACCENT = '#8C2F1E';
const GREEN = '#2F5D3A';

const STATUS_TONE = {
  live: GREEN,
  'live-redirected': GREEN,
  manual: GREEN,
  blocked: INK_SOFT,
  unreachable: ACCENT,
  dead: ACCENT,
};

/**
 * Fit a headline to a 3-line box in a 1010px column.
 *
 * Measured against real Inter: at 62px the column holds roughly 29 characters
 * per line (4 lines at ~115 chars, which is what the first render did and why
 * it collided with the footer). Each step down buys proportional room, so the
 * card always fills three lines and never overflows.
 */
export function headlineStyle(title) {
  const len = String(title ?? '').length;
  if (len <= 78) return { fontSize: '62px', lineHeight: 1.14, letterSpacing: '-1.2px' };
  if (len <= 104) return { fontSize: '54px', lineHeight: 1.16, letterSpacing: '-1px' };
  if (len <= 140) return { fontSize: '46px', lineHeight: 1.18, letterSpacing: '-0.8px' };
  if (len <= 180) return { fontSize: '40px', lineHeight: 1.2, letterSpacing: '-0.6px' };
  return { fontSize: '34px', lineHeight: 1.24, letterSpacing: '-0.4px' };
}

function clamp(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

/**
 * Build the satori element tree for one record. Pure function: identical input
 * always produces identical output, which makes the build diffable.
 *
 * @param {object} doc catalogue record (may be a partial/synthetic record)
 * @param {{baseUrl?:string}} [options]
 */
export function buildOgMarkup(doc = {}, options = {}) {
  const {
    id = 'QA-0000',
    title = 'Public records nobody reads, catalogued.',
    issuerShort = doc.issuerShort ?? doc.host ?? '',
    issuer = doc.author ?? doc.issuer ?? '',
    documentType = doc.documentType ?? '',
    documentDate = doc.documentDate ?? null,
    releaseDate = doc.releaseDate ?? null,
    country = doc.country ?? '',
    status = doc.status ?? null,
  } = doc;

  const written = formatCatalogueDate(documentDate);
  const released = formatCatalogueDate(releaseDate);
  const kicker = [documentType, country].filter(Boolean).join(' · ').toUpperCase();
  const metaBits = [
    issuerShort || issuer,
    written ? `written ${written}` : null,
    released ? `released ${released}` : null,
  ].filter(Boolean);
  const tone = STATUS_TONE[status] ?? INK_SOFT;
  const stamp = options.stamp ? `LINKS VERIFIED ${options.stamp.toUpperCase()}` : null;

  return {
    type: 'div',
    props: {
      style: {
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: PAPER,
        color: INK,
        padding: '64px 72px',
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Top rule + masthead
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '14px' },
                  children: [
                    { type: 'div', props: { style: { width: '34px', height: '4px', backgroundColor: ACCENT, display: 'flex' } } },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '20px', letterSpacing: '3px', fontWeight: 600, color: INK },
                        children: 'THE QUIET ARCHIVE',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '18px', letterSpacing: '1px', color: INK_SOFT },
                        children: `· ${id}`,
                      },
                    },
                  ],
                },
              },
              // Filing-card tab with the status dot
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex', alignItems: 'center', gap: '10px',
                    border: `1px solid ${RULE}`, borderRadius: '999px',
                    padding: '8px 18px', fontSize: '16px', color: INK_SOFT,
                    letterSpacing: '1px',
                  },
                  children: [
                    { type: 'div', props: { style: { width: '11px', height: '11px', borderRadius: '999px', backgroundColor: tone, display: 'flex' } } },
                    { type: 'div', props: { style: { display: 'flex' }, children: (status ?? 'catalogued').toUpperCase().replace(/-/g, ' ') } },
                  ],
                },
              },
            ],
          },
        },

        // Headline block
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1010px' },
            children: [
              kicker
                ? {
                    type: 'div',
                    props: {
                      style: { fontSize: '20px', letterSpacing: '3px', color: ACCENT, fontWeight: 600 },
                      children: kicker,
                    },
                  }
                : null,
              {
                type: 'div',
                props: {
                  style: { ...headlineStyle(title), fontWeight: 700 },
                  children: clamp(title, 210),
                },
              },
            ].filter(Boolean),
          },
        },

        // Bottom: issuer / dates / stamp
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' },
            children: [
              { type: 'div', props: { style: { height: '1px', backgroundColor: RULE, width: '100%', display: 'flex' } } },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '22px', color: INK_SOFT, display: 'flex', flexWrap: 'wrap', gap: '10px' },
                        children: metaBits.join('  ·  '),
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '16px', letterSpacing: '2px', color: INK_SOFT, textAlign: 'right' },
                        children: stamp ?? 'UNREAD PUBLIC RECORDS',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/* ----------------------------------------------------------------- render */

/**
 * Render a record (or the site default) to a PNG buffer.
 * @returns {Promise<Buffer>}
 */
export async function renderOgPng(doc, { root = process.cwd(), stamp = null } = {}) {
  const [{ default: satori }, { Resvg }] = await Promise.all([
    import('satori'),
    import('@resvg/resvg-js'),
  ]);
  const fonts = await loadFonts(root);
  const svg = await satori(buildOgMarkup(doc, { stamp }), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts.map((f) => ({ name: f.name, weight: f.weight, style: f.style, data: f.data })),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
  return Buffer.from(png);
}

/** The image referenced by <meta property="og:image"> for a document page. */
export function ogImagePath(slug) {
  return slug ? `/og/${slug}.png` : '/og.png';
}
