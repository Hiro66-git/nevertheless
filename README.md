# nevertheless — The Quiet Archive

Two deliverables live here:

1. **[`app/`](app/)** — a downloadable local application (dashboard, link checks,
   social cards, citation exports, sitemap generator). Build/download:
   **`app/dist/quiet-archive-app.zip`**. Start with `./start.sh` (or `start.cmd`).
   Read [`app/README.md`](app/README.md).
2. **[`p0/`](p0/)** — the drop-in files that go into the Astro site itself
   (`VerifiedStamp`, `/health/`, OG/citation routes, sitemap, CI workflow).
   Read [`p0/APPLY.md`](p0/APPLY.md).

---

This repo is the workspace for the Quiet Archive upgrade.

The site's source is **not** in this repository — it has never been pushed here
(`main` and `lama` both contain only a one-line README). So instead of guessing at
templates, the P0 work is in [`p0/`](p0/): tested, standalone files that drop into
the real project.

**Read [`p0/APPLY.md`](p0/APPLY.md) first.** It covers:

- what was verified as broken on the live site, and what fixes it
- the exact `cp` commands to install the kit
- the four edits only the project owner can make
- the assumptions made without source access, and how to check each one
- what was actually run to verify the code (26 tests + a full Astro build)

Contents of `p0/`:

| Path | What it is |
| --- | --- |
| `scripts/verify-links.mjs` | Link verifier v2: derived stamp, Wayback auto-fallback, hand-check pins, per-host politeness, regression exit code |
| `scripts/catalogue-health.mjs` | Builds `health.json` (the stamp + `/health/` data) from the verify run |
| `scripts/check-collections.mjs` | Recomputes collection counts and date ranges; fails on drift; `--fix` |
| `scripts/og-preview.mjs` | Renders social cards locally, no Astro build needed |
| `site/lib/dates.mjs` | Date parsing/formatting, ranges, deterministic picks |
| `site/lib/cite.mjs` | BibTeX, RIS, CSL-JSON, plain citations |
| `site/lib/og-render.mjs` | 1200×630 social-card renderer |
| `site/pages/` | `/og.png`, `/og/<slug>.png`, `/cite/<slug>.{bib,ris,json}`, `/citations.bib`, `/health/`, `/health.json`, `/sitemap.xml` |
| `site/astro/` | `VerifiedStamp.astro` + head/doc-page snippets |
| `.github/workflows/verify-links.yml` | Weekly check that commits its own report and fails on regressions |
| `fixtures/` | A miniature catalogue including the real 1999-vs-1962 bug, used to prove the checkers work |
