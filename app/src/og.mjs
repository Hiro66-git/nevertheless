/**
 * Social-card rendering for the app.
 *
 * Same layout as the build-time renderer, but:
 *   - the fonts are downloaded once into the app's own cache (so the app works
 *     offline afterwards), and
 *   - the renderer is optional: if satori/resvg failed to install, the app says
 *     so and every other feature keeps working.
 *
 * Only PNG is produced here (no PDF/embedding), because the deliverable is a
 * card you can post, not a print asset.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { formatCatalogueDate } from '../site/lib/dates.mjs';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/* Font sources: Inter static TTFs, fetched once and cached on disk. */
const FONT_URLS = {
  400: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/400Regular/Inter_400Regular.ttf',
  600: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/600SemiBold/Inter_600SemiBold.ttf',
  700: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/700Bold/Inter_700Bold.ttf',
};

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

export class RendererUnavailable extends Error {
  constructor(cause) {
    super(
      'Social cards need two optional packages that are not installed (satori, @resvg/resvg-js). ' +
        'Run: npm install --include=optional  (or npm install) inside the app folder.',
    );
    this.cause = cause;
  }
}

/** Where fonts may already exist, in priority order. */
const LOCAL_FONT_DIRS = ['fonts', 'src/assets/fonts', 'public/fonts'];

/** Lazily resolve the two optional renderers. */
async function loadRenderers() {
  try {
    const [{ default: satori }, { Resvg }] = await Promise.all([
      import('satori'),
      import('@resvg/resvg-js'),
    ]);
    return { satori, Resvg };
  } catch (err) {
    throw new RendererUnavailable(err);
  }
}

export function rendererAvailable() {
  return existsSync(path.join(process.cwd(), 'node_modules/satori')) &&
    existsSync(path.join(process.cwd(), 'node_modules/@resvg/resvg-js'));
}

const fontCache = new Map();

/**
 * Look for the three Inter weights next to the app or inside the project.
 * Returns only what it found, in weight order.
 */
async function findBundledFonts() {
  const names = { 400: 'Inter-Regular.ttf', 600: 'Inter-SemiBold.ttf', 700: 'Inter-Bold.ttf' };
  const found = [];
  for (const [weight, name] of Object.entries(names)) {
    for (const dir of LOCAL_FONT_DIRS) {
      const file = path.join(process.cwd(), dir, name);
      if (!existsSync(file)) continue;
      const cached = fontCache.get(file);
      if (cached) {
        found.push(cached);
        break;
      }
      const font = { name: 'Inter', weight: Number(weight), style: 'normal', data: await readFile(file) };
      fontCache.set(file, font);
      found.push(font);
      break;
    }
  }
  return found.sort((a, b) => a.weight - b.weight);
}

/**
 * Load fonts, preferring a local copy under app/fonts/, then the download cache.
 * Cache location is inside the app folder so that deleting it costs one re-fetch.
 */
export async function loadFonts(cacheDir) {
  const dir = cacheDir ?? path.join(process.cwd(), '.cache/fonts');

  // 1. Fonts that ship with the app. This is the normal path: the app renders
  //    cards offline, with no CDN call and no build step.
  const bundled = await findBundledFonts();
  if (bundled.length === 3) return bundled;

  // 2. Cache of previously downloaded fonts, then 3. download.
  await mkdir(dir, { recursive: true });
  const fonts = [...bundled];

  for (const [weight, url] of Object.entries(FONT_URLS)) {
    if (fonts.some((f) => f.weight === Number(weight))) continue;
    const key = `inter-${weight}.ttf`;
    const file = path.join(dir, key);
    if (fontCache.has(file)) {
      fonts.push(fontCache.get(file));
      continue;
    }
    let data;
    if (existsSync(file)) {
      data = await readFile(file);
    } else {
      let res;
      try {
        res = await fetch(url);
      } catch (err) {
        throw new Error(
          `Social cards need the Inter font, which is not in fonts/ and could not be downloaded ` +
            `(${err?.cause?.code ?? err?.message ?? err}). Restore the fonts/ folder that ships with this app.`,
        );
      }
      if (!res.ok) throw new Error(`could not download font ${weight} (HTTP ${res.status})`);
      data = Buffer.from(await res.arrayBuffer());
      await writeFile(file, data).catch(() => {});
    }
    const font = { name: 'Inter', weight: Number(weight), style: 'normal', data };
    fontCache.set(file, font);
    fonts.push(font);
  }
  return fonts.sort((a, b) => a.weight - b.weight);
}

/* ----------------------------------------------------------------- markup */

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

/** Build the satori tree. Pure: same input, same output. */
export function buildOgMarkup(doc = {}, options = {}) {
  const id = doc.id ?? '';
  const title = doc.title ?? 'Public records nobody reads, catalogued.';
  const written = formatCatalogueDate(doc.documentDate ?? doc.dd ?? doc.year);
  const released = formatCatalogueDate(doc.releaseDate ?? doc.rd ?? doc.ry);
  const kicker = [doc.documentType ?? doc.ty, doc.country ?? doc.c]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();
  const metaBits = [doc.issuerShort ?? doc.as ?? doc.host, written ? `written ${written}` : null, released ? `released ${released}` : null]
    .filter(Boolean);
  const tone = STATUS_TONE[doc.status] ?? INK_SOFT;
  const stamp = options.stamp ? `LINKS VERIFIED ${String(options.stamp).toUpperCase()}` : 'UNREAD PUBLIC RECORDS';

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
      },
      children: [
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
                    { type: 'div', props: { style: { fontSize: '20px', letterSpacing: '3px', fontWeight: 600 }, children: 'THE QUIET ARCHIVE' } },
                    id ? { type: 'div', props: { style: { fontSize: '18px', letterSpacing: '1px', color: INK_SOFT }, children: `· ${id}` } } : null,
                  ].filter(Boolean),
                },
              },
              doc.status
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${RULE}`,
                        borderRadius: '999px', padding: '8px 18px', fontSize: '16px', color: INK_SOFT, letterSpacing: '1px',
                      },
                      children: [
                        { type: 'div', props: { style: { width: '11px', height: '11px', borderRadius: '999px', backgroundColor: tone, display: 'flex' } } },
                        { type: 'div', props: { style: { display: 'flex' }, children: String(doc.status).toUpperCase().replace(/-/g, ' ') } },
                      ],
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1010px' },
            children: [
              kicker ? { type: 'div', props: { style: { fontSize: '20px', letterSpacing: '3px', color: ACCENT, fontWeight: 600 }, children: kicker } } : null,
              { type: 'div', props: { style: { ...headlineStyle(title), fontWeight: 700 }, children: clamp(title, 210) } },
            ].filter(Boolean),
          },
        },
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
                    { type: 'div', props: { style: { fontSize: '22px', color: INK_SOFT, display: 'flex' }, children: metaBits.join('  ·  ') } },
                    { type: 'div', props: { style: { fontSize: '16px', letterSpacing: '2px', color: INK_SOFT, textAlign: 'right' }, children: stamp } },
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

/** Render a record to a PNG buffer. */
export async function renderPng(doc, { stamp = null, cacheDir = null } = {}) {
  const { satori, Resvg } = await loadRenderers();
  const fonts = await loadFonts(cacheDir ?? undefined);
  const svg = await satori(buildOgMarkup(doc, { stamp }), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts.map((f) => ({ name: f.name, weight: f.weight, style: f.style, data: f.data })),
  });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng());
}

/** SVG variant, for editing in a vector tool (no extra dependency). */
export async function renderSvg(doc, { stamp = null, cacheDir = null } = {}) {
  const { satori } = await loadRenderers();
  const fonts = await loadFonts(cacheDir ?? undefined);
  return satori(buildOgMarkup(doc, { stamp }), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts.map((f) => ({ name: f.name, weight: f.weight, style: f.style, data: f.data })),
  });
}
