# The Quiet Archive — P0 fix kit

Everything here is **tested and standalone**. Nothing in this folder assumes it can
see your site's source; each piece is a drop-in file or a small, surgical edit.

Built and verified on Node 22.26 / 22.22, Astro 4.16.18.

---

## Why this exists (the short version)

You said you can't upload the project and can't publish it. So I did not try to
guess at your templates. Instead I rebuilt the parts that are *provably broken*
against your live site, and wrote them so they attach to any Astro project:

| Audit finding (verified on the live site) | Fixed by |
| --- | --- |
| Homepage says Failed Procurement Programs is **1999–2023**; `/collections/` says **1962–2023** | `scripts/check-collections.mjs` — computes ranges from data, fails the build on drift, `--fix` rewrites them |
| "Links verified 16 Oct 2026" is **hard-coded** and stale while the check claims to run weekly | `scripts/verify-links.mjs` → `src/data/verify-report.json` → `health.json` → `<VerifiedStamp />` |
| Dead links get no automatic Internet Archive fallback | verifier queries the Wayback API and writes `archive` + `archive-used` automatically |
| Hand-verified records get overwritten by the weekly bot | `verify.manual` pins are respected for 3 months (`--pinned-months`) |
| `/sitemap.xml` returns the site's 404 while robots.txt points at `sitemap-index.xml` | `site/pages/sitemap.xml.ts` |
| No OG cards; every shared link is a bare URL | `site/lib/og-render.mjs` — 1200×630 PNG per record, generated at build |
| No BibTeX / RIS / citation export | `site/lib/cite.mjs` + `/cite/<slug>.{bib,ris,json}` + `/citations.bib` |
| No public evidence of upkeep | `/health/` page + `/health.json`, both generated |

---

## 1. Get this folder into your project

The files live in the repo this session is attached to
(`Hiro66-git/nevertheless`, branch `arena/c10ee5a0-nevertheless`, directory `p0/`).

```bash
# on your PC, outside your project
git clone -b arena/c10ee5a0-nevertheless https://github.com/Hiro66-git/nevertheless.git qa-kit
```

Then copy the pieces into your Astro project:

```bash
cd /path/to/your/quiet-archive

# 1. shared logic (no dependencies, no build step)
mkdir -p src/lib
cp qa-kit/p0/site/lib/dates.mjs      src/lib/
cp qa-kit/p0/site/lib/cite.mjs       src/lib/
cp qa-kit/p0/site/lib/og-render.mjs  src/lib/

# 2. scripts (run with plain node)
cp qa-kit/p0/scripts/*.mjs           scripts/

# 3. pages
cp qa-kit/p0/site/pages/og.png.ts            src/pages/
mkdir -p src/pages/og src/pages/cite
cp 'qa-kit/p0/site/pages/og/[slug].png.ts'   src/pages/og/
cp 'qa-kit/p0/site/pages/cite/[slug].bib.ts' src/pages/cite/
cp 'qa-kit/p0/site/pages/cite/[slug].ris.ts' src/pages/cite/
cp 'qa-kit/p0/site/pages/cite/[slug].json.ts' src/pages/cite/
cp qa-kit/p0/site/pages/citations.bib.ts     src/pages/
cp qa-kit/p0/site/pages/health.astro         src/pages/
cp qa-kit/p0/site/pages/health.json.ts       src/pages/
cp qa-kit/p0/site/pages/sitemap.xml.ts       src/pages/

# 4. component + workflow
mkdir -p src/components
cp qa-kit/p0/site/astro/VerifiedStamp.astro  src/components/
cp qa-kit/p0/.github/workflows/verify-links.yml .github/workflows/

# 5. build-only deps for the social cards
npm i -D satori @resvg/resvg-js
mkdir -p src/assets/fonts
# put Inter-Regular.ttf, Inter-SemiBold.ttf, Inter-Bold.ttf here
# (https://github.com/rsms/inter/releases — free, no CDN at build time)
```

---

## 2. The four edits only you can make

These are the only places where your project's shape matters. Each is one line.

### 2a. `astro.config.mjs` — pin `@astrojs/sitemap`

```js
// 3.7.4 crashes with "Cannot read properties of undefined (reading 'reduce')"
// on any build. I hit this while verifying; 3.2.1 works.
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://quiet-archive-19i.pages.dev', // <-- move off pages.dev later
  integrations: [sitemap({ filter: (page) => !page.includes('/random/') })],
});
```

```bash
npm i -D @astrojs/sitemap@3.2.1
```

### 2b. Your base layout `<head>`

Open `src/layouts/Base.astro` (or whatever your single layout is called) and
replace the `<title>`/OG block with `site/astro/base-head.astro.snippet`. If you'd
rather not replace, the minimum is these three lines plus the derived stamp:

```astro
<meta property="og:image" content={new URL(`/og/${doc?.slug ?? ''}${doc ? '.png' : 'og.png'}`, Astro.site).toString()} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### 2c. The header stamp

Find the hand-written string in your header — the one that currently renders
`Links verified 16 October 2026`. Delete it and use:

```astro
---
import VerifiedStamp from '../components/VerifiedStamp.astro';
---
<VerifiedStamp />
```

Then run the verifier once (step 3) so `health.json` exists. If `health.json` is
missing, the component renders "Link status not yet published" — a loud, honest
failure instead of a lie.

### 2d. The document page's "Cite" section

Replace your hand-built citation paragraph with
`site/astro/doc-page-additions.snippet.astro`. The page-level `<getStaticPaths>`
convention it uses is `Astro.props.doc`; if your page receives records
differently, change the single line marked `// adjust to however this page receives its record`.

---

## 3. First run

```bash
# expects your catalogue in src/data/ with `id` + `sourceUrl` fields;
# it discovers the file(s) itself. Override with --data path/to/file.json
node scripts/verify-links.mjs --concurrency 6            # dry run, report only
node scripts/verify-links.mjs --write                    # patch status/flags/archive/checked
node scripts/catalogue-health.mjs --stale-days 10        # builds src/data/health.json
node scripts/check-collections.mjs                       # 0 = no drift, 1 = drift
node scripts/check-collections.mjs --fix                 # rewrite derived ranges

npm run build                                            # now includes /og/*.png, /cite/*, /health/
```

Check the numbers before you ship:

```bash
node -e "const h=require('./src/data/health.json');console.log(h.verifiedLabel, h.totals, h.linkStates)"
```

---

## 4. What I could not verify (be sceptical of these)

I had no access to your source, so these are the assumptions the kit makes. Each
is a one-line change if wrong:

1. **Astro.** Your URLs (`/doc/<slug>/`, `/explore/?q=`, `/rss.xml`,
   `/search-index.json`, `sitemap-index.xml`) and your `/about/` page's
   description of `scripts/verify-links.mjs` and `npm run verify` are consistent
   with Astro. If it's actually Next/Eleventy, the `.mjs` logic ports unchanged
   and only the thin page wrappers need rewriting.
2. **Catalogue shape.** I coded against the schema published on your `/about/`
   page (`issuer`, `issuerShort`, `documentDate`, `releaseDate`, `sourceUrl`,
   `flags`, `verify`, …) plus the fields the live `/search-index.json` actually
   emits (`s`, `y`, `ry`, `dd`, `rd`, `ty`, `c`, `archive`, `status`, `checked`).
   The scripts discover the file rather than hard-coding `documents.json`.
3. **Cloudflare Pages settings.** Redirects/prerendering assume the default
   `output: 'static'`. If `/sitemap.xml` still 404s after deploy, add
   `public/_redirects` with `/sitemap.xml /sitemap-index.xml 301` — that
   overrides everything.
4. **Font availability.** `og-render.mjs` loads Inter from `src/assets/fonts/`
   first and only falls back to a CDN. Verified locally with the TTF files in
   `fixtures/src/assets/fonts/`.

---

## 5. Verified, not just written

```bash
cd p0 && npm install && npm test          # 26 tests, all passing
```

What was actually run during development:

- `check-collections.mjs` against a fixture that reproduces your **exact**
  production bug — it printed
  `dateRange says "1999–2023", catalogue computes "1962–2011"`, exited 1;
  `--fix` rewrote it, and a re-run then only flagged the genuinely missing member.
- `verify-links.mjs` against live HTTP: 200, 404, unresolvable host, and a
  TLS-broken host. Confirmed it writes `live` / `dead` / `unreachable`,
  refuses to overwrite a recent `verify.manual`, honours `--fail-on-regression`
  (exit 2), and never writes a diagnostic string into an editorial note.
- `og-render.mjs` — real PNGs rendered and inspected
  (see `fixtures/.og-preview/`). First attempt overflowed to 4 lines and
  collided with the footer; the type scale now shrinks with title length.
- A throwaway Astro 4 project, building **all** the pages above:
  `/og.png`, 8 × `/og/<slug>.png`, 8 × `/cite/<slug>.bib`, `/citations.bib`,
  `/health/`, `/health.json`, `/sitemap.xml` → `sitemap-index.xml`.
  The stamp was then forced stale and re-checked: it rendered
  `Links last verified 16 October 2026 · 23 days ago · check overdue` and set
  `data-stale="true"`.

---

## 6. Deliberately not done

- **No custom domain, no analytics.** Both need your Cloudflare account and a
  decision about whether the archive should be tracked at all. My recommendation:
  move to a real domain, and add Cloudflare Web Analytics (cookieless) *or*
  state plainly on `/about/` that there is none.
- **No fuzzy search.** Real work on `/explore/`, and it should be built against
  your actual component, not guessed.
- **No commits to your catalogue.** The verifier writes `status`, `flags`,
  `archive`, `checked` and `verify.note`. Nothing else is touched.
