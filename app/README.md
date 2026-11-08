# The Quiet Archive — app

A local app for the catalogue. Point it at your project folder; it shows you what
has drifted or gone dead, and fixes what can be fixed — all by editing plain JSON
in that folder.

Works offline. No account, no database, no build step.

---

## Get it

The zip is built by `node tools/build-zip.mjs`. If you downloaded it from the
repository, it is at **`app/dist/quiet-archive-app.zip`** (~0.6 MB). Unzip it
anywhere; the folder is self-contained.

## Start it

**macOS / Linux**

```bash
unzip quiet-archive-app.zip
cd quiet-archive-app
./start.sh
```

**Windows**

```bat
unzip quiet-archive-app.zip
cd quiet-archive-app
start.cmd
```

It opens on <http://localhost:4173> with a small demo catalogue so you can see
what it does before pointing it at anything real.

You need **Node 20 or newer** ([nodejs.org](https://nodejs.org)). Nothing else:
the link checker, sitemap and citation exports use only Node's standard library.

### Point it at your project

```bash
./start.sh --project ../quiet-archive
```

The folder must contain `src/data/` with JSON records in it. Or use the
**Connect & deploy** page in the app to type a path or paste a git remote.

That page is also where `--url` and cloning are explained:

```bash
./start.sh --url owner/repo          # public remote, no credentials needed
./start.sh --url git@github.com:you/quiet-archive.git   # uses your existing ssh key
```

A private remote cloned by the app uses whatever git credentials are already
configured on your machine. The app never asks for a password or token and never
stores one. If git cannot authenticate without prompting, the app says so and
tells you to clone it yourself — that is deliberate.

---

## What it does

| Page | What it shows |
| --- | --- |
| **Overview** | Records, collections, drift errors, the verified stamp — and whether that stamp is stale |
| **Records** | Every record, filterable by status and by flag; opens a detail page with the social card and citations |
| **Collections** | Each collection's count and date range, recomputed from the catalogue vs. the stored value |
| **Link health** | Link states, flags, newly dead links, records with no archive fallback |
| **Checks & fixes** | One-click runs of the four checks, with streamed output |
| **Connect & deploy** | Folder / git routes in, publish route out |

### The checks

1. **Collection drift** — recomputes every collection's count and date range from
   the records it contains. This is what catches the homepage saying
   *1999–2023* while `/collections/` says *1962–2023* for the same eleven records.
   Shown on the Overview page on every load, not only when you press a button.
2. **Link verification** — requests every source URL once, classifies the result
   (live / moved / bot-walled / unreachable / dead), finds an Internet Archive
   snapshot for anything that fails, and leaves recent hand checks alone.
3. **Health data** — turns that run into the "Links verified …" stamp and the
   numbers on the site's `/health/` page. If the last run is older than ten days
   the stamp says *last verified … check overdue* instead of quietly implying
   freshness.
4. **Sitemap** — writes `sitemap-index.xml` plus shards, and `robots.txt`, from
   the built site in `dist/`. No framework integration, so nothing can crash
   because it found no pages.

### Social cards and citations

- `/og/<slug>.png` and `/og.png` render 1200×630 cards from the catalogue. Fonts
  ship with the app, so this works with no network.
- `/doc/<slug>/cite.bib`, `.ris`, `.json` and `/export/citations.bib` export the
  catalogue for Zotero, EndNote, Pandoc and LaTeX.

---

## What it changes — and what it refuses to

The app writes only inside the folder you connected, and only these things:

- on records: `status`, `flags`, `archive`, `checked`, `verify.note`
- on collections: `documentCount`, `dateRange`
- new files: `src/data/verify-report.json`, `src/data/health.json`,
  `dist/sitemap-index.xml`, `dist/sitemap-N.xml`, `dist/robots.txt`

It never touches your pages, never commits, never pushes, and never contacts
Cloudflare. Review everything with git before you commit:

```bash
git -C ../quiet-archive diff
```

Outbound requests are limited to: the source URLs in your catalogue, the Wayback
availability API, and `git` if you asked it to clone something.

---

## Using the scripts directly

The app is a front end for four scripts. They work without it:

```bash
node scripts/verify-links.mjs --write          # check links, patch the catalogue
node scripts/catalogue-health.mjs --stale-days 10
node scripts/check-collections.mjs             # exit 1 on drift
node scripts/check-collections.mjs --fix       # repair it
node scripts/sitemap.mjs --robots --site https://your-domain.example
```

Wire the ones you want into CI. The kit in `../p0/` (if you have it) includes a
GitHub Actions workflow that runs the verifier weekly, commits the report, and
fails the job when a working link dies.

---

## Publish

The app does not deploy. The chain is deliberately boring:

```bash
cd ../quiet-archive
npm run build          # add: node scripts/sitemap.mjs --robots
git add -A && git commit -m "chore(data): link check"
git push               # Cloudflare Pages rebuilds
```

---

## Layout

```
bin/quiet-archive.mjs   launcher (clones a remote if asked, then starts the server)
src/server.mjs          HTTP server, routes, JSON API, SSE
src/ui.mjs              server-rendered pages
src/jobs.mjs            runs the scripts, streams their output
src/connect.mjs         folder inspection, git clone/pull, credential-free rules
src/og.mjs              social cards (optional: satori + resvg)
ui/                     styles.css, app.js
scripts/                verify-links, catalogue-health, check-collections, sitemap
site/lib/               shared date and citation logic
fonts/                  Inter, bundled so cards render offline
demo/                   small catalogue used when no project is given
test/                   end-to-end tests (boot the server, use HTTP)
```

## Tests

```bash
npm install      # only for the social-card renderer
npm test         # boots the real server against demo/ and drives it over HTTP
```

The suite covers the bugs that were actually hit while building this: cards
returning 500 because fonts came from a CDN, `/doc/<slug>/cite.bib` returning
HTML, and jobs looking for scripts in the wrong folder.

## Notes and limits

- Verified on Node 22 / Linux. Node 20 should work; the code uses no
  post-20 syntax, but that version was not run.
- The server has no authentication. It binds `0.0.0.0` so it can be reached from
  another machine, which is convenient in a container and unwise on a shared
  network. Use `--host 127.0.0.1` if you only want it locally.
- Cloning inside the app is a convenience. When it fails on a private remote,
  that is git declining to prompt — clone it yourself and pass `--project`.
