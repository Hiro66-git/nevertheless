/**
 * Server-rendered UI. No framework, no build step, no inline scripts (the CSP
 * disallows them), no third-party requests.
 *
 * Every value that comes from the catalogue is escaped through `e()`. That
 * matters: catalogue summaries are third-party text.
 */

import { formatCatalogueDate, dateRange, parseCatalogueDate } from '../site/lib/dates.mjs';
import { toPlainCitation, citationKey } from '../site/lib/cite.mjs';

/* ----------------------------------------------------------------- basics */

const e = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const raw = (s) => ({ __html: String(s ?? '') });
const isRaw = (v) => v && typeof v === 'object' && '__html' in v;
const str = (v) => (isRaw(v) ? v.__html : v == null || v === false ? '' : e(v));
const join = (arr, sep = '') => arr.filter((x) => x != null && x !== false).map(str).join(sep);

const NAV = [
  ['/', 'Overview', 'dashboard'],
  ['/records', 'Records', 'records'],
  ['/collections', 'Collections', 'collections'],
  ['/health-report', 'Link health', 'health'],
  ['/jobs', 'Checks & fixes', 'jobs'],
  ['/connections', 'Connect & deploy', 'connections'],
  ['/about', 'About', 'about'],
];

const STATUS_LABEL = {
  live: 'Live',
  'live-redirected': 'Live (moved)',
  manual: 'Checked by hand',
  blocked: 'Bot-walled',
  unreachable: 'Unreachable',
  dead: 'Dead',
};

function shell({ kind, data, title, body, subtitle }) {
  const h = data.health;
  const stale = h?.stale;
  const records = data.docs.length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(title)} · Quiet Archive App</title>
<link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="app">
  <aside class="side">
    <a class="brand" href="/">
      <span class="brand__rule" aria-hidden="true"></span>
      <span class="brand__name">The Quiet Archive</span>
      <span class="brand__sub">local app</span>
    </a>

    <nav class="nav" aria-label="Sections">
      ${NAV.map(
        ([href, label, key]) =>
          `<a href="${href}" class="nav__link${key === kind ? ' nav__link--on' : ''}"${key === kind ? ' aria-current="page"' : ''}>${e(label)}</a>`,
      ).join('\n      ')}
    </nav>

    <div class="side__foot">
      <p class="side__stat"><strong>${records}</strong> records</p>
      ${
        h?.verifiedLabel
          ? `<p class="side__stamp${stale ? ' side__stamp--stale' : ''}">
               ${e(stale ? 'Links last verified' : 'Links verified')}
               <time datetime="${e(h.verifiedAt)}">${e(h.verifiedLabel.replace('Links verified ', ''))}</time>
               ${stale ? `<span class="side__warn">· ${e(h.checkAgeDays)} days ago</span>` : ''}
             </p>`
          : `<p class="side__stamp side__stamp--unknown">No verification run yet</p>`
      }
      <p class="side__path" title="${e(data.target)}">${e(shortenPath(data.target))}</p>
    </div>
  </aside>

  <main class="main" id="main">
    <header class="head">
      <div>
        <p class="kicker">${e(kind === 'dashboard' ? 'Overview' : title)}</p>
        <h1>${e(title)}</h1>
        ${subtitle ? `<p class="head__sub">${str(subtitle)}</p>` : ''}
      </div>
    </header>
    ${body}
    <p class="conn" data-conn hidden role="status"></p>
    <footer class="foot">
      <p>Reads and writes only inside <code>${e(data.target)}</code>. Nothing is uploaded anywhere.</p>
      <p><a href="/about">What this app does and does not change</a></p>
    </footer>
  </main>
</div>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

function shortenPath(p, max = 42) {
  const parts = String(p).split('/').filter(Boolean);
  if (parts.length <= 2) return p;
  const tail = parts.slice(-2).join('/');
  return `…/${tail}`.length > max ? p : `…/${tail}`;
}

/* --------------------------------------------------------------- fragments */

function metric(label, value, note) {
  return `<div class="metric">
    <span class="metric__value">${e(value)}</span>
    <span class="metric__label">${e(label)}</span>
    ${note ? `<span class="metric__note">${str(note)}</span>` : ''}
  </div>`;
}

function pill(status) {
  return `<span class="pill pill--${e(status || 'unknown')}">${e(STATUS_LABEL[status] ?? status ?? 'unknown')}</span>`;
}

function flagChips(flags = []) {
  if (!flags.length) return '<span class="muted">—</span>';
  return `<span class="chips">${flags.map((f) => `<span class="chip">${e(f)}</span>`).join('')}</span>`;
}

function jobButton(id, label, { writes = false, primary = false, block = false } = {}) {
  return `<button class="btn${primary ? ' btn--primary' : ''}${block ? ' btn--block' : ''}"
     data-job="${e(id)}"
     data-writes="${writes ? '1' : '0'}"
     data-label="${e(label)}"
     type="button">${e(label)}</button>`;
}

function barTable(rows, total) {
  if (!rows.length) return '<p class="muted">No data.</p>';
  return `<table class="table">
    <thead><tr><th scope="col">Status</th><th scope="col">Meaning</th><th scope="col" class="num">Records</th><th scope="col" class="num">Share</th></tr></thead>
    <tbody>
    ${rows
      .map(
        (s) => `<tr>
      <th scope="row">${pill(s.key)}</th>
      <td>${e(s.blurb ?? '')}</td>
      <td class="num">${e(s.count)}</td>
      <td class="num"><span class="bar" aria-hidden="true"><span style="width:${Math.min(100, (s.count / Math.max(1, total)) * 100).toFixed(1)}%"></span></span>${e(s.share)}</td>
    </tr>`,
      )
      .join('')}
    </tbody>
  </table>`;
}

/* ------------------------------------------------------------------ pages */

function dashboard({ data, drift }) {
  const h = data.health;
  const v = data.verify;
  const counts = v?.counts ?? {};
  const total = v?.checked ?? data.docs.length;
  const linkStates = h?.linkStates ?? Object.entries(counts).map(([key, count]) => ({ key, count, share: `${((count / Math.max(1, total)) * 100).toFixed(0)}%`, blurb: '' }));

  const noData = data.docs.length === 0;

  return {
    title: 'Overview',
    body: `
    ${
      noData
        ? `<section class="panel panel--warn">
            <h2>No catalogue found</h2>
            <p>The app could not find <code>src/data/*.json</code> with records in <code>${e(data.target)}</code>.</p>
            <p>Start it against your project:</p>
            <pre class="pre">node bin/quiet-archive.mjs --project /path/to/your/quiet-archive</pre>
            <p>Or set <code>QA_PROJECT</code>. See <a href="/connections">Connect &amp; deploy</a>.</p>
          </section>`
        : ''
    }

    <section class="metrics" aria-label="Key numbers">
      ${metric('records', data.docs.length)}
      ${metric('collections', data.collections?.collections.length ?? 0)}
      ${metric('links checked', total, v ? `in the last run` : 'no run yet')}
      ${metric('drift errors', drift.errors, drift.errors ? 'needs fixing' : 'none')}
    </section>

    ${
      h?.stale
        ? `<section class="panel panel--warn">
            <h2>The weekly check is overdue</h2>
            <p>Last run: <time datetime="${e(h.verifiedAt)}">${e(h.verifiedLabel?.replace('Links verified ', '') ?? 'never')}</time> (${e(h.checkAgeDays)} days ago). The published stamp says so, which is better than silence — but it should not say so for long.</p>
            <div class="actions">${jobButton('verify', 'Run the check now', { writes: true, primary: true })}</div>
          </section>`
        : ''
    }

    <section class="panel${drift.errors ? ' panel--alert' : ''}" id="drift">
      <div class="panel__head">
        <h2>Collection drift</h2>
        <span class="badge ${drift.errors ? 'badge--bad' : 'badge--good'}">${drift.errors ? `${drift.errors} error${drift.errors === 1 ? '' : 's'}` : 'in sync'}</span>
      </div>
      <p class="panel__lead">
        Counts and date ranges are recomputed from the catalogue on every load and compared with what
        <code>${e(drift.file ?? 'collections.json')}</code> stores. This is the check that would have caught
        <em>“Failed Procurement Programs · 1999–2023”</em> on the homepage against <em>1962–2023</em> on <code>/collections/</code>.
      </p>
      ${
        drift.available
          ? `<table class="table">
        <thead><tr><th scope="col">Collection</th><th scope="col" class="num">Members</th><th scope="col" class="num">Stored count</th><th scope="col">Computed range</th><th scope="col">Stored range</th></tr></thead>
        <tbody>
        ${drift.rows
          .map(
            (r) => `<tr class="${r.countMismatch || r.rangeMismatch || r.missing.length ? 'row--bad' : ''}">
          <th scope="row">${e(r.title)}<br /><code class="tiny">${e(r.slug)}</code></th>
          <td class="num">${e(r.members)}${r.missing.length ? `<br /><span class="tiny bad">${r.missing.length} missing</span>` : ''}</td>
          <td class="num ${r.countMismatch ? 'bad' : ''}">${e(r.statedCount ?? '—')}</td>
          <td>${e(r.computed ?? '—')}</td>
          <td class="${r.rangeMismatch ? 'bad' : ''}">${e(r.stated ?? '—')}</td>
        </tr>`,
          )
          .join('')}
        </tbody>
      </table>
      <div class="actions">
        ${jobButton('collections', 'Re-check')}
        ${jobButton('collections-fix', 'Repair drifted values', { writes: true, primary: drift.errors > 0 })}
      </div>`
          : '<p class="muted">No collections file found in <code>src/data/</code>.</p>'
      }
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Link states</h2><a class="link" href="/health-report">full health report</a></div>
      ${barTable(linkStates, total)}
      <div class="actions">
        ${jobButton('verify-dry', 'Dry run (no writes)')}
        ${jobButton('verify', 'Check every link and write results', { writes: true, primary: true })}
      </div>
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Uncertainty</h2><a class="link" href="/records?flag=release-date-approx">browse flagged records</a></div>
      <p class="panel__lead">The archive flags what it does not know. These come from the catalogue itself.</p>
      <div class="flaglist">
        ${(h?.flags ?? [])
          .map(
            (f) => `<a class="flagrow" href="/records?flag=${encodeURIComponent(f.key)}">
          <code>${e(f.key)}</code>
          <span class="flagrow__count">${e(f.count)}</span>
          <span class="flagrow__share">${e(f.share)}</span>
        </a>`,
          )
          .join('') || '<p class="muted">No flags recorded.</p>'}
      </div>
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Where records come from</h2></div>
      <ul class="rank">
        ${(h?.hosts ?? []).slice(0, 10).map((x) => `<li><span>${e(x.host)}</span><span class="num">${e(x.count)}</span></li>`).join('') || '<li class="muted">No host data — run the health build.</li>'}
      </ul>
    </section>`,
  };
}

function records({ data, query }) {
  const q = (query.q ?? '').toLowerCase();
  const status = query.status ?? '';
  const flag = query.flag ?? '';

  let rows = data.docs;
  if (q) {
    rows = rows.filter((d) =>
      [d.title, d.id, d.slug, d.issuerShort, d.host, d.summary, ...(d.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }
  if (status) rows = rows.filter((d) => d.status === status);
  if (flag) rows = rows.filter((d) => (d.flags ?? []).includes(flag));

  const statuses = [...new Set(data.docs.map((d) => d.status).filter(Boolean))].sort();
  const flags = [...new Set(data.docs.flatMap((d) => d.flags ?? []))].sort();

  return {
    title: 'Records',
    subtitle: `${data.docs.length} in the catalogue${rows.length !== data.docs.length ? ` · ${rows.length} shown` : ''}`,
    body: `
    <form class="filters" method="get" action="/records">
      <label class="field field--grow">
        <span>Search</span>
        <input type="search" name="q" value="${e(query.q ?? '')}" placeholder="title, issuer, tag, summary" />
      </label>
      <label class="field">
        <span>Status</span>
        <select name="status">
          <option value="">Any</option>
          ${statuses.map((s) => `<option value="${e(s)}"${s === status ? ' selected' : ''}>${e(STATUS_LABEL[s] ?? s)}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>Flag</span>
        <select name="flag">
          <option value="">Any</option>
          ${flags.map((f) => `<option value="${e(f)}"${f === flag ? ' selected' : ''}>${e(f)}</option>`).join('')}
        </select>
      </label>
      <button class="btn btn--primary" type="submit">Filter</button>
      ${q || status || flag ? '<a class="btn btn--ghost" href="/records">Clear</a>' : ''}
    </form>

    <table class="table table--records">
      <thead>
        <tr>
          <th scope="col">No.</th>
          <th scope="col">Record</th>
          <th scope="col">Written</th>
          <th scope="col">Released</th>
          <th scope="col">Link</th>
          <th scope="col">Flags</th>
        </tr>
      </thead>
      <tbody>
      ${rows
        .map(
          (d) => `<tr>
        <td class="tiny nowrap">${e(d.id)}</td>
        <th scope="row">
          <a href="/doc/${e(d.slug ?? d.id)}">${e(d.title)}</a>
          <span class="tiny muted">${e(d.issuerShort ?? d.host ?? '')}${d.documentType ? ` · ${e(d.documentType)}` : ''}</span>
        </th>
        <td class="nowrap">${e(formatCatalogueDate(d.documentDate ?? d.dd ?? d.year) ?? '—')}</td>
        <td class="nowrap">${e(formatCatalogueDate(d.releaseDate ?? d.rd ?? d.ry) ?? '—')}</td>
        <td class="nowrap">${pill(d.status)}</td>
        <td>${flagChips(d.flags)}</td>
      </tr>`,
        )
        .join('') || `<tr><td colspan="6" class="muted">Nothing matches. <a href="/records">Clear filters</a>.</td></tr>`}
      </tbody>
    </table>`,
  };
}

function collectionsPage({ data, drift }) {
  return {
    title: 'Collections',
    subtitle: `Recomputed from the catalogue, not typed by hand`,
    body: `
    <section class="panel">
      <div class="panel__head">
        <h2>${drift.file ? e(drift.file) : 'No collections file'}</h2>
        <span class="badge ${drift.errors ? 'badge--bad' : 'badge--good'}">${drift.errors ? `${drift.errors} error${drift.errors === 1 ? '' : 's'}` : 'in sync'}</span>
      </div>
      ${
        drift.available
          ? `<table class="table">
        <thead><tr><th scope="col">Collection</th><th scope="col" class="num">Members</th><th scope="col" class="num">Stored</th><th scope="col">Computed range</th><th scope="col">Stored range</th><th scope="col">Missing members</th></tr></thead>
        <tbody>
        ${drift.rows
          .map(
            (r) => `<tr class="${r.countMismatch || r.rangeMismatch || r.missing.length ? 'row--bad' : ''}">
          <th scope="row">${e(r.title)}<br /><code class="tiny">${e(r.slug)}</code></th>
          <td class="num">${e(r.members)}</td>
          <td class="num ${r.countMismatch ? 'bad' : ''}">${e(r.statedCount ?? '—')}</td>
          <td>${e(r.computed ?? '—')}</td>
          <td class="${r.rangeMismatch ? 'bad' : ''}">${e(r.stated ?? '—')}</td>
          <td class="tiny">${r.missing.length ? r.missing.map((m) => `<code class="bad">${e(m)}</code>`).join(' ') : '<span class="muted">—</span>'}</td>
        </tr>`,
          )
          .join('')}
        </tbody>
      </table>
      <div class="actions">
        ${jobButton('collections', 'Re-check')}
        ${jobButton('collections-fix', 'Repair drifted values', { writes: true, primary: drift.errors > 0 })}
      </div>
      <p class="note">Repair rewrites only <code>documentCount</code> and <code>dateRange</code>. Missing member slugs are reported, never invented.</p>`
          : '<p class="muted">Nothing to check: no collections file under <code>src/data/</code>.</p>'
      }
    </section>`,
  };
}

function healthPage({ data }) {
  const h = data.health;
  const v = data.verify;
  if (!h) {
    return {
      title: 'Link health',
      body: `<section class="panel panel--warn">
        <h2>No health data yet</h2>
        <p>Run the link check once, then rebuild the health data. Both are one click:</p>
        <div class="actions">
          ${jobButton('verify', 'Check every link', { writes: true, primary: true })}
          ${jobButton('health', 'Rebuild health data', { writes: true })}
        </div>
      </section>`,
    };
  }

  const total = h.totals.records;
  return {
    title: 'Link health',
    subtitle: `${e(h.verifiedLabel ?? 'never verified')} · ${e(h.checkAgeDays)} days ago`,
    body: `
    ${h.stale ? `<section class="panel panel--warn"><h2>Stale</h2><p>The published stamp says <strong>${e(h.verifiedLabel ?? '')}</strong> — ${e(h.checkAgeDays)} days old. Visitors see that wording, so this is a truth-telling state, not a hidden one.</p><div class="actions">${jobButton('verify', 'Run the check', { writes: true, primary: true })}</div></section>` : ''}

    <section class="metrics">
      ${metric('records', total)}
      ${metric('machine-checked', h.totals.machineChecked)}
      ${metric('by hand', h.totals.humanChecked, `${e(h.totals.handCheckedShare)} of catalogue`)}
      ${metric('archive copies', h.totals.archiveFallbacks)}
      ${metric('awaiting fallback', h.totals.recordsAwaitingFallback)}
      ${metric('uncertain dates', h.totals.dateUncertainty)}
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Link states</h2><span class="muted tiny">from ${e('src/data/verify-report.json')}</span></div>
      ${barTable(h.linkStates, total)}
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Flags</h2></div>
      <table class="table">
        <thead><tr><th scope="col">Flag</th><th scope="col">Meaning</th><th scope="col" class="num">Records</th><th scope="col" class="num">Share</th></tr></thead>
        <tbody>
        ${h.flags.map((f) => `<tr><th scope="row"><code>${e(f.key)}</code></th><td>${e(f.blurb ?? '')}</td><td class="num">${e(f.count)}</td><td class="num">${e(f.share)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>

    ${
      h.regressions?.length
        ? `<section class="panel panel--alert">
            <h2>Newly dead links</h2>
            <p>These answered at the previous run and failed at this one.</p>
            <ul class="plainlist">
              ${h.regressions.map((r) => `<li><a href="/doc/${e(r.slug)}">${e(r.id)}</a> <code class="tiny">${e(r.url)}</code></li>`).join('')}
            </ul>
          </section>`
        : ''
    }

    ${
      h.problems?.awaitingFallback?.length
        ? `<section class="panel">
            <h2>Failing, with no archive copy</h2>
            <ul class="plainlist">
              ${h.problems.awaitingFallback.map((r) => `<li>${pill(r.status)} <a href="/doc/${e(r.slug)}">${e(r.id)}</a> <code class="tiny">${e(r.url)}</code></li>`).join('')}
            </ul>
          </section>`
        : ''
    }

    <section class="panel">
      <div class="panel__head"><h2>Catalogue integrity</h2></div>
      <ul class="plainlist">
        <li>Duplicate catalogue numbers: <strong>${e(h.problems?.duplicateIds?.length ?? 0)}</strong></li>
        <li>Duplicate slugs: <strong>${e(h.problems?.duplicateSlugs?.length ?? 0)}</strong></li>
        <li>Source URLs not on https: <strong>${e(h.problems?.nonHttps?.length ?? 0)}</strong></li>
        <li>Summaries under 40 characters: <strong>${e(h.problems?.thinSummaries?.length ?? 0)}</strong></li>
      </ul>
      <p class="note">Exports: <a href="/export/report.json">audit JSON</a> · <a href="/export/citations.bib">whole catalogue as BibTeX</a></p>
    </section>`,
  };
}

const JOB_LABELS = {
  'verify-dry': ['Dry run: check links, write nothing', 'Requests every source URL and reports, but changes no files.'],
  verify: ['Check every link and write results', 'Requests every source URL, records the outcome, finds archive fallbacks.'],
  health: ['Rebuild health data + verified stamp', 'Recomputes the stamp, link states and flags from the last run.'],
  collections: ['Check collection integrity', 'Recomputes counts and date ranges; fails on drift.'],
  'collections-fix': ['Repair drifted collection values', 'Rewrites documentCount and dateRange to match the catalogue.'],
  sitemap: ['Generate sitemap + robots.txt', 'Builds sitemap-index.xml and shards from dist/. Needs a build first.'],
};

function jobsPage() {
  return {
    title: 'Checks & fixes',
    subtitle: 'Each button runs a script in this folder and streams its output here',
    body: `
    <section class="panel">
      <div class="panel__head"><h2>Run a check</h2></div>
      <div class="jobgrid">
        ${Object.entries(JOB_LABELS)
          .map(
            ([id, [label, desc]]) => `<div class="jobcard">
          <h3>${e(label)}</h3>
          <p class="tiny muted">${e(desc)}</p>
          ${jobButton(id, 'Run', { writes: id !== 'verify-dry' && id !== 'collections', primary: id === 'verify' || id === 'collections' })}
        </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="panel" id="logpanel" hidden>
      <div class="panel__head">
        <h2 id="logtitle">Output</h2>
        <span class="live" data-live hidden aria-live="polite"></span>
        <button class="btn btn--ghost" type="button" data-close-log>Close</button>
      </div>
      <pre class="pre pre--log" id="log" aria-live="polite"></pre>
    </section>

    <section class="panel">
      <div class="panel__head"><h2>This session</h2></div>
      <table class="table" id="history">
        <thead><tr><th scope="col">Job</th><th scope="col">Status</th><th scope="col">Started</th><th scope="col" class="num">Took</th></tr></thead>
        <tbody><tr><td colspan="4" class="muted">Nothing run yet in this session.</td></tr></tbody>
      </table>
    </section>`,
  };
}

const CONNECT_STEPS = [
  ['1', 'Point the app at the project', 'A folder containing <code>src/data/</code>. Nothing is copied into it.'],
  ['2', 'Run a check', 'Each check reads the catalogue, optionally writes status and ranges, and reports what changed.'],
  ['3', 'Review with git', 'Every write is a normal file change. <code>git diff</code> shows exactly what the app did.'],
  ['4', 'Publish', 'Commit and push; Cloudflare Pages rebuilds. The app never pushes for you.'],
];

function connectionsPage({ data }) {
  const hasData = data.docs.length > 0;
  const git = data.git ?? null;

  return {
    title: 'Connect & deploy',
    subtitle: 'Bring a project in, then send the fixes back out',
    body: `
    <section class="panel ${hasData ? 'panel--ok' : 'panel--warn'}">
      <div class="panel__head">
        <h2>Connected project</h2>
        <span class="badge ${hasData ? 'badge--good' : 'badge--bad'}">${hasData ? `${data.docs.length} records` : 'no catalogue'}</span>
      </div>
      <pre class="pre">${e(data.target)}</pre>
      ${hasData ? `<p class="note">Reading: ${data.sources.map((x) => `<code>${e(x)}</code>`).join(', ')}</p>` : '<p>No <code>src/data/*.json</code> here. Use one of the routes below.</p>'}
      ${data.project?.isRepo ? `<p class="note">Git: <code>${e(data.project.branch ?? '?')}</code>${data.project.remote ? ` ← ${e(data.project.remote)}` : ' (no origin)'}</p>` : '<p class="note">Not a git repository.</p>'}
    </section>

    <section class="panel">
      <div class="panel__head"><h2>Route 1 · Use a folder already on this machine</h2></div>
      <p class="panel__lead">The route that always works, with no network and no credentials. Restart with <code>--project</code>, or switch at runtime:</p>
      <pre class="pre">node bin/quiet-archive.mjs --project "/path/to/quiet-archive"</pre>
      <form class="form" data-form="use">
        <label class="field field--grow">
          <span>Absolute path to the project</span>
          <input type="text" name="dir" placeholder="/home/you/sites/quiet-archive" required />
        </label>
        <button class="btn btn--primary" type="submit">Connect this folder</button>
      </form>
      <p class="note" data-result="use"></p>
    </section>

    <section class="panel">
      <div class="panel__head">
        <h2>Route 2 · Clone a git remote</h2>
        <span class="badge ${git ? 'badge--good' : 'badge--bad'}">${git ? e(git) : 'git not found'}</span>
      </div>
      <p class="panel__lead">
        Works with <code>owner/repo</code>, <code>https://…</code> or <code>git@host:owner/repo.git</code>.
        A private remote is cloned using the credentials already configured on this machine — the app never
        asks for a token and never stores one.
      </p>
      <form class="form" data-form="clone">
        <label class="field field--grow">
          <span>Remote</span>
          <input type="text" name="url" placeholder="owner/repo or git@github.com:owner/repo.git" required />
        </label>
        <label class="field">
          <span>Folder name</span>
          <input type="text" name="name" placeholder="quiet-archive" required />
        </label>
        <button class="btn btn--primary" type="submit" ${git ? '' : 'disabled'}>Clone</button>
      </form>
      <p class="note" data-result="clone"></p>
      <details class="details">
        <summary>If the clone is refused</summary>
        <p class="note">Private remotes fail here because git cannot prompt for a password inside a server process. That is deliberate. Clone it yourself instead, then use Route 1:</p>
        <pre class="pre">git clone git@github.com:you/quiet-archive.git ~/sites/quiet-archive
node bin/quiet-archive.mjs --project ~/sites/quiet-archive</pre>
      </details>
    </section>

    ${
      data.clones?.length
        ? `<section class="panel">
            <div class="panel__head"><h2>Clones made by this app</h2></div>
            <table class="table">
              <thead><tr><th scope="col">Folder</th><th scope="col">Records</th><th scope="col">Branch</th><th scope="col">Remote</th><th scope="col"></th></tr></thead>
              <tbody>
              ${data.clones
                .map(
                  (c) => `<tr>
                <th scope="row"><code>${e(c.name)}</code></th>
                <td>${c.hasData ? `${e(c.dataFiles.length)} data file(s)` : '<span class="bad">no src/data</span>'}</td>
                <td class="tiny">${e(c.branch ?? '—')}</td>
                <td class="tiny">${e(c.remote ?? '—')}</td>
                <td><button class="btn btn--ghost" type="button" data-use-clone="${e(c.dir)}">Use</button></td>
              </tr>`,
                )
                .join('')}
              </tbody>
            </table>
          </section>`
        : ''
    }

    <section class="panel">
      <div class="panel__head"><h2>The four steps</h2></div>
      <ol class="steps">
        ${CONNECT_STEPS.map(([n, title, body]) => `<li><strong>${e(title)}.</strong> ${body}</li>`).join('')}
      </ol>
      <p class="panel__lead" style="margin-top:1rem">The publish step in full:</p>
      <pre class="pre">cd /path/to/quiet-archive
npm run build      # add: node scripts/sitemap.mjs --robots
git add -A && git commit -m "chore(data): link check"
git push</pre>
    </section>

    <section class="panel">
      <div class="panel__head"><h2>The sitemap, specifically</h2></div>
      <p class="panel__lead">You said the crash happens because no sitemap file exists. Both were true: the integration was faulting, <em>and</em> nothing else produced the file. This app generates it without the integration:</p>
      <pre class="pre">node scripts/sitemap.mjs --robots --site https://your-domain.example</pre>
      <p class="note">Make it part of the build so it cannot be forgotten:</p>
      <pre class="pre">"build": "astro build && node scripts/sitemap.mjs --robots"</pre>
      <p class="note">Then remove the broken dependency: <code>npm uninstall @astrojs/sitemap</code>.</p>
    </section>

    <section class="panel">
      <div class="panel__head"><h2>What the app will never do</h2></div>
      <ul class="plainlist">
        <li>Push, commit, or contact Cloudflare. Publishing stays yours.</li>
        <li>Ask for a password or token, or store one.</li>
        <li>Write outside the connected folder.</li>
        <li>Make any outbound request except source-URL checks and Wayback lookups.</li>
      </ul>
    </section>`,
  };
}

function recordPage({ data, doc }) {
  const written = formatCatalogueDate(doc.documentDate ?? doc.dd ?? doc.year);
  const released = formatCatalogueDate(doc.releaseDate ?? doc.rd ?? doc.ry);
  const waited = (() => {
    const a = parseCatalogueDate(doc.documentDate ?? doc.dd ?? doc.year);
    const b = parseCatalogueDate(doc.releaseDate ?? doc.rd ?? doc.ry);
    return a && b && b.year >= a.year ? b.year - a.year : null;
  })();

  return {
    title: doc.title,
    subtitle: `${e(doc.id)} · ${e(doc.issuerShort ?? doc.host ?? '')}`,
    body: `
    <section class="panel record">
      <div class="record__top">
        ${pill(doc.status)}
        ${flagChips(doc.flags)}
      </div>

      <dl class="facts">
        <div><dt>Written</dt><dd>${e(written ?? '—')}</dd></div>
        <div><dt>Released</dt><dd>${e(released ?? '—')}</dd></div>
        <div><dt>Kept from the public</dt><dd>${waited == null ? '—' : `${e(waited)} years`}</dd></div>
        <div><dt>Type</dt><dd>${e(doc.documentType ?? '—')}</dd></div>
        <div><dt>Jurisdiction</dt><dd>${e(doc.country ?? '—')}</dd></div>
        <div><dt>Host</dt><dd>${e(doc.host ?? '—')}</dd></div>
      </dl>

      ${doc.summary ? `<p class="record__summary">${e(doc.summary)}</p>` : ''}

      <div class="record__links">
        <a class="btn" href="${e(doc.sourceUrl)}" rel="noopener noreferrer" target="_blank">Official source ↗</a>
        ${doc.archive ? `<a class="btn" href="${e(doc.archive)}" rel="noopener noreferrer" target="_blank">Internet Archive copy ↗</a>` : ''}
        ${(doc.altLinks ?? [])
          .filter((l) => l && l.url && l.url !== doc.archive)
          .map(
            (l) =>
              `<a class="btn" href="${e(l.url)}" rel="noopener noreferrer" target="_blank">${e(l.label ?? 'Mirror')} ↗</a>`,
          )
          .join('')}
        <a class="btn btn--ghost" href="https://web.archive.org/save/${e(doc.sourceUrl)}" rel="noopener noreferrer" target="_blank">Save a fresh snapshot ↗</a>
      </div>
      ${
        !doc.archive
          ? `<p class="note">No archive snapshot is recorded for this record yet. The link checker fills this in on its next run when the source fails; until then the button above captures one by hand.</p>`
          : ''
      }

      <h2 class="sub">Social card</h2>
      <p class="note">Generated from this record. <a href="/og/${e(doc.slug ?? doc.id)}.png" target="_blank">Open PNG ↗</a> · <a href="/og/${e(doc.slug ?? doc.id)}.svg" target="_blank">SVG ↗</a></p>
      <img class="card" src="/og/${e(doc.slug ?? doc.id)}.png" alt="Social card for ${e(doc.title)}" width="600" height="315" loading="lazy" />

      <h2 class="sub">Cite</h2>
      <p class="record__cite">${e(toPlainCitation(doc))}</p>
      <div class="actions">
        <a class="btn" href="/doc/${e(doc.slug ?? doc.id)}/cite.bib" download>BibTeX</a>
        <a class="btn" href="/doc/${e(doc.slug ?? doc.id)}/cite.ris" download>RIS</a>
        <a class="btn" href="/doc/${e(doc.slug ?? doc.id)}/cite.json" download>CSL-JSON</a>
        <button class="btn btn--ghost" type="button" data-copy="${e(toPlainCitation(doc))}">Copy citation</button>
      </div>
      <details class="details">
        <summary>Raw BibTeX</summary>
        <pre class="pre">${e(bibtexPreview(doc))}</pre>
      </details>

      ${doc.verify?.note ? `<h2 class="sub">Verification note</h2><p class="note">${e(doc.verify.note)}${doc.verify.manual ? ` <span class="tiny">(by hand, ${e(doc.verify.manual)})</span>` : ''}</p>` : ''}

      ${(doc.tags ?? []).length ? `<h2 class="sub">Tags</h2><p class="tags">${doc.tags.map((t) => `<a class="tag" href="/records?q=${encodeURIComponent(t)}">${e(t)}</a>`).join(' ')}</p>` : ''}
    </section>`,
  };
}

function bibtexPreview(doc) {
  // Kept here to avoid a second import in the page module.
  const key = citationKey(doc);
  const writer = doc.author ?? doc.issuerLong ?? doc.issuerShort ?? doc.host ?? '';
  const year = parseCatalogueDate(doc.documentDate ?? doc.dd)?.year ?? 'n.d.';
  return `@misc{${key},
  author  = {${writer}},
  title   = {${doc.title ?? ''}},
  year    = {${year}},
  howpublished = {\\url{${doc.sourceUrl}}}
}`;
}

function aboutPage({ data }) {
  return {
    title: 'About this app',
    subtitle: 'What it does, what it refuses to do, and why it exists',
    body: `
    <section class="panel">
      <h2>What this is</h2>
      <p>A local, single-process companion for The Quiet Archive. It reads your project folder, shows you what has drifted or gone dead, and runs the fixes — using the same scripts it ships with, so there is nothing hidden between the button and the file.</p>
      <p>It exists because the site's two most visible promises could not both be true at once: <em>“Links verified 16 October 2026”</em> while the weekly job was not producing anything, and <em>1999–2023</em> on the homepage against <em>1962–2023</em> on the collections page for the same eleven records.</p>
    </section>

    <section class="panel">
      <h2>The four checks</h2>
      <ol class="steps">
        <li><strong>Collection drift.</strong> Recomputes each collection's count and date range from the catalogue and compares with the stored values. Reported on every page load, not just when a job runs.</li>
        <li><strong>Link verification.</strong> Requests every source URL once, classifies the result, records an Internet Archive fallback where one exists, and respects hand checks for three months.</li>
        <li><strong>Health data.</strong> Turns the verification run into the stamp and the numbers — the same data the published <code>/health/</code> page would show.</li>
        <li><strong>Sitemap.</strong> Writes a valid <code>sitemap-index.xml</code> and shards, with or without a site framework, then refuses to ship an empty or malformed one.</li>
      </ol>
    </section>

    <section class="panel">
      <h2>Rules it follows</h2>
      <ul class="plainlist">
        <li><strong>Nothing derived is typed by hand.</strong> Counts, ranges and the verified date are computed. If a computation fails, the app says so instead of falling back to yesterday's number.</li>
        <li><strong>Writes are reviewable.</strong> JSON only, plus reports. Run <code>git diff</code> and decide.</li>
        <li><strong>Failures are exits, not warnings.</strong> A newly dead link, a drifted collection or a missing sitemap is a non-zero exit code, so CI can stop a bad deploy.</li>
        <li><strong>No analytics, no accounts, no outbound calls except link checks.</strong></li>
      </ul>
    </section>

    <section class="panel">
      <h2>Not built (deliberately)</h2>
      <ul class="plainlist">
        <li>Custom domain and DNS — your Cloudflare account.</li>
        <li>Analytics — a policy decision about whether the archive should be tracked at all. My recommendation: Cloudflare Web Analytics, or an explicit “no analytics” paragraph.</li>
        <li>Fuzzy search and facets in <code>/explore/</code> — real work, and it belongs in your components, not in this app.</li>
        <li>Anything that pushes to your repo.</li>
      </ul>
    </section>`,
  };
}

function notfoundPage() {
  return {
    title: 'Not found',
    body: `<section class="panel"><h2>No such page</h2><p><a href="/">Back to the overview</a></p></section>`,
  };
}

/* ------------------------------------------------------------------ entry */

const PAGES = {
  dashboard,
  records,
  collections: collectionsPage,
  health: healthPage,
  jobs: jobsPage,
  connections: connectionsPage,
  record: recordPage,
  about: aboutPage,
  notfound: notfoundPage,
};

/**
 * @param {keyof typeof PAGES} kind
 * @param {object} ctx
 */
export function renderPage(kind, ctx) {
  const build = PAGES[kind] ?? notfoundPage;
  const { title, body, subtitle } = build(ctx);
  return shell({ kind, data: ctx.data, title, body, subtitle });
}
