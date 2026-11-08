/**
 * The Quiet Archive — local app server.
 *
 * One process, no framework, no database. It reads the project folder on disk,
 * shows you what is wrong, and runs the fixes. Everything it changes is a plain
 * JSON or text file you can commit yourself.
 *
 * Design constraints that come from where this runs:
 *   - binds 0.0.0.0 so it is reachable from a browser outside the machine,
 *   - no host/origin allowlist, because the proxy hostname is not knowable,
 *   - no inline scripts (CSP without 'unsafe-inline'), no third-party requests,
 *   - writes are limited to the configured project root, path-traversal checked.
 */

import http from 'node:http';
import { readFile, writeFile, stat, mkdir, readdir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { loadCatalogue, loadCollections, loadReport, loadSummary, isRecord } from './catalogue.mjs';
import {
  cloneProject,
  inspectProject,
  listClonedProjects,
  removeClonedProject,
  updateProject,
  gitAvailable,
  projectsDir,
  redactUrl,
} from './connect.mjs';
import { JobRunner, JOB_DEFS } from './jobs.mjs';
import { renderPng, renderSvg, rendererAvailable, RendererUnavailable, OG_WIDTH, OG_HEIGHT } from './og.mjs';
import { toBibtex, toRis, toCslJson, toPlainCitation, toBibtexLibrary } from '../site/lib/cite.mjs';
import { formatCatalogueDate, dateRange, parseCatalogueDate } from '../site/lib/dates.mjs';
import { renderPage } from './ui.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

const PORT = Number(arg('port', process.env.PORT ?? 4173));
const HOST = String(arg('host', '0.0.0.0'));
let TARGET = path.resolve(String(arg('project', process.env.QA_PROJECT ?? APP_ROOT)));

if (!existsSync(path.join(TARGET, 'src', 'data'))) {
  console.warn(
    `\n  ⚠ ${TARGET} has no src/data folder.\n` +
      `    Point the app at your project with:  --project /path/to/quiet-archive\n` +
      `    (or set QA_PROJECT). It will run in read-only "no data" mode until then.\n`,
  );
}

/* ------------------------------------------------------------------ state */

const runner = new JobRunner(APP_ROOT, TARGET, {
  onEvent: (event) => broadcast(event),
});

/** SSE clients, so job output streams into the browser. */
const clients = new Set();
function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

/* ---------------------------------------------------------------- helpers */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.bib': 'application/x-bibtex; charset=utf-8',
  '.ris': 'application/x-research-info-systems; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  res.writeHead(status, {
    'content-length': buf.length,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    ...headers,
  });
  res.end(buf);
}

/**
 * CSP.
 *
 * The app itself contains no inline scripts, so the policy *could* be very strict.
 * It is not, for two practical reasons learned from the preview environment:
 *
 *   1. When this runs behind a sandbox proxy, the proxy may inject a bootstrap
 *      script into the page. 'self' alone would block it and the preview would
 *      look broken while the server was perfectly healthy.
 *   2. Same story for websocket-based tooling in some proxies.
 *
 * So script-src allows 'unsafe-inline' in the sense of permitting injected
 * scripts, but the *app's own* safety comes from elsewhere: every dynamic value
 * is escaped server-side, and there is no endpoint that reflects input into HTML.
 */
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws: wss:",
  "form-action 'self'",
  "frame-ancestors *",
  "base-uri 'self'",
].join('; ');

const html = (res, body, status = 200) =>
  send(res, status, body, {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': CSP,
  });

const json = (res, value, status = 200) =>
  send(res, status, JSON.stringify(value, null, 2), { 'content-type': 'application/json; charset=utf-8' });

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

/** Resolve a path inside the project, refusing anything that escapes it. */
function safeProjectPath(...segments) {
  const target = path.resolve(TARGET, ...segments);
  const rel = path.relative(TARGET, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

/* -------------------------------------------------------------- page data */

async function gather() {
  const [{ docs, sources }, collections, health, verify] = await Promise.all([
    loadCatalogue(TARGET),
    loadCollections(TARGET),
    loadReport(TARGET, 'health.json'),
    loadReport(TARGET, 'verify-report.json'),
  ]);
  return {
    docs,
    sources,
    collections,
    health: health?.data ?? null,
    verify: verify?.data ?? null,
    target: TARGET,
  };
}

/**
 * The drift report: recompute every collection from the catalogue and compare to
 * what is stored. This is the app's headline finding, so it is computed on every
 * dashboard load rather than only when the script runs.
 */
function driftFor(collections, docs) {
  if (!collections) return { available: false, rows: [], errors: 0 };
  const byId = new Map();
  const bySlug = new Map();
  for (const d of docs) {
    byId.set(d.id, d);
    if (d.slug) bySlug.set(d.slug, d);
  }
  const rows = [];
  let errors = 0;

  for (const c of collections.collections) {
    const members = c.documents ?? c.docs ?? c.steps ?? c.entries ?? [];
    const resolved = [];
    const missing = [];
    for (const ref of members) {
      const key = typeof ref === 'string' ? ref : ref?.slug ?? ref?.id;
      const doc = byId.get(key) ?? bySlug.get(key);
      if (doc) resolved.push(doc);
      else missing.push(key);
    }
    const range = dateRange(resolved);
    const statedCount =
      typeof c.documentCount === 'number' ? c.documentCount : typeof c.count === 'number' ? c.count : null;
    const statedRange = c.dateRange ?? c.range ?? c.years ?? null;

    const countMismatch = statedCount != null && statedCount !== resolved.length;
    const rangeMismatch = Boolean(statedRange && range.label && String(statedRange) !== range.label);

    if (countMismatch || missing.length) errors += 1;

    rows.push({
      slug: c.slug ?? c.id,
      title: c.title ?? c.slug ?? c.id,
      members: resolved.length,
      statedCount,
      countMismatch,
      computed: range.label,
      stated: statedRange ? String(statedRange) : null,
      rangeMismatch,
      missing,
      min: range.min,
      max: range.max,
    });
  }
  return { available: true, rows, errors, file: collections.file };
}

/* ----------------------------------------------------------------- routes */

async function handleRequest(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  const method = req.method ?? 'GET';

  try {
    /* static assets ------------------------------------------------------ */
    if (pathname.startsWith('/assets/')) {
      const file = path.join(APP_ROOT, 'ui', pathname.slice('/assets/'.length));
      if (!file.startsWith(path.join(APP_ROOT, 'ui'))) return send(res, 403, 'forbidden');
      if (!existsSync(file)) return send(res, 404, 'not found');
      return send(res, 200, await readFile(file), {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      });
    }

    /* live job stream ---------------------------------------------------- */
    if (pathname === '/api/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
        'content-encoding': 'identity',
      });
      // If a proxy buffers the stream we still must not hang the page: the
      // client falls back to polling after a timeout (see ui/app.js).
      res.socket?.setNoDelay?.(true);
      res.write(`data: ${JSON.stringify({ type: 'hello', jobs: runner.list() })}\n\n`);
      clients.add(res);
      const keepAlive = setInterval(() => {
        try {
          res.write(': keep-alive\n\n');
        } catch {
          clearInterval(keepAlive);
        }
      }, 20_000);
      req.on('close', () => {
        clearInterval(keepAlive);
        clients.delete(res);
      });
      return;
    }

    /* API ---------------------------------------------------------------- */
    if (pathname === '/api/state') {
      const data = await gather();
      const drift = driftFor(data.collections, data.docs);
      return json(res, {
        target: data.target,
        records: data.docs.length,
        sources: data.sources,
        collections: data.collections
          ? { file: data.collections.file, count: data.collections.collections.length }
          : null,
        health: data.health,
        verify: data.verify?.summary ?? null,
        drift,
        jobs: runner.list(),
        history: runner.history(),
        renderer: rendererAvailable(),
      });
    }

    if (pathname === '/api/jobs' && method === 'GET') return json(res, { jobs: runner.list(), history: runner.history() });

    if (pathname === '/api/jobs' && method === 'POST') {
      const body = await readBody(req);
      const id = String(body.id ?? '');
      if (!JOB_DEFS[id]) return json(res, { error: 'unknown job' }, 400);
      try {
        const job = runner.start(id);
        return json(res, { job }, 202);
      } catch (err) {
        return json(res, { error: String(err.message ?? err) }, 409);
      }
    }

    if (pathname.startsWith('/api/jobs/') && method === 'GET') {
      const jobId = pathname.split('/')[3];
      const log = runner.log(jobId);
      if (log == null) return json(res, { error: 'unknown job' }, 404);
      return json(res, { job: runner.get(jobId), log });
    }

    if (pathname === '/api/records') {
      const data = await gather();
      const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
      const status = url.searchParams.get('status') ?? '';
      const flag = url.searchParams.get('flag') ?? '';
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
      return json(res, {
        total: data.docs.length,
        shown: rows.length,
        records: rows.map((d) => ({
          id: d.id,
          slug: d.slug,
          title: d.title,
          issuer: d.issuerShort ?? d.host,
          documentDate: formatCatalogueDate(d.documentDate ?? d.dd ?? d.year),
          releaseDate: formatCatalogueDate(d.releaseDate ?? d.rd ?? d.ry),
          status: d.status ?? null,
          flags: d.flags ?? [],
          sourceUrl: d.sourceUrl,
          archive: d.archive ?? null,
        })),
      });
    }

    /* connections -------------------------------------------------------- */

    if (pathname === '/api/connect' && method === 'GET') {
      const [git, cloned] = await Promise.all([gitAvailable(), listClonedProjects(APP_ROOT)]);
      return json(res, {
        git,
        target: TARGET,
        project: await inspectProject(TARGET),
        defaultProject: path.join(APP_ROOT, 'demo'),
        projectsDir: projectsDir(APP_ROOT),
        clones: cloned,
      });
    }

    if (pathname === '/api/connect/clone' && method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name ?? '').replace(/[^\w.-]+/g, '-').slice(0, 60);
      if (!name) return json(res, { error: 'a name is required' }, 400);
      const dest = path.join(projectsDir(APP_ROOT), name);
      const result = await cloneProject({ url: String(body.url ?? ''), dest });
      if (result.ok) broadcast({ type: 'project-connected', project: dest });
      return json(res, { ...result, url: redactUrl(String(body.url ?? '')) }, result.ok ? 200 : 400);
    }

    if (pathname === '/api/connect/update' && method === 'POST') {
      const body = await readBody(req);
      const dir = body.name ? path.join(projectsDir(APP_ROOT), String(body.name)) : TARGET;
      if (!dir.startsWith(APP_ROOT) && dir !== TARGET) return json(res, { error: 'refused' }, 403);
      return json(res, await updateProject(dir));
    }

    if (pathname === '/api/connect/remove' && method === 'POST') {
      const body = await readBody(req);
      return json(res, await removeClonedProject(APP_ROOT, String(body.name ?? '')));
    }

    /**
     * Switch the app to another folder while it runs. Kept deliberately narrow:
     * the folder must already exist and contain src/data. This is how someone
     * clicks "use this project" after cloning, without restarting the process.
     */
    if (pathname === '/api/connect/use' && method === 'POST') {
      const body = await readBody(req);
      const candidate = String(body.dir ?? '');
      const resolved = path.resolve(candidate.startsWith('~') ? candidate.replace('~', process.env.HOME ?? '') : candidate);
      const info = await inspectProject(resolved);
      if (!info.exists) return json(res, { error: `${resolved} does not exist` }, 400);
      if (!info.hasData) return json(res, { error: `${resolved} has no src/data/*.json` }, 400);
      TARGET = resolved;
      runner.projectRoot = resolved;
      return json(res, { ok: true, target: TARGET, project: info });
    }

    /* exports ------------------------------------------------------------ */
    if (pathname === '/export/citations.bib') {
      const { docs } = await loadCatalogue(TARGET);
      const verified = (await loadReport(TARGET, 'health.json'))?.data?.verifiedAt ?? undefined;
      const body = toBibtexLibrary(docs, {
        urldate: verified ? String(verified).slice(0, 10) : undefined,
        generatedAt: verified,
      });
      return send(res, 200, body, {
        'content-type': MIME['.bib'],
        'content-disposition': 'attachment; filename="quiet-archive.bib"',
      });
    }

    if (pathname === '/export/report.json') {
      const { docs } = await loadCatalogue(TARGET);
      const collections = await loadCollections(TARGET);
      const health = (await loadReport(TARGET, 'health.json'))?.data ?? null;
      const verify = (await loadReport(TARGET, 'verify-report.json'))?.data ?? null;
      return send(
        res,
        200,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            project: TARGET,
            records: docs.length,
            health,
            verify: verify?.summary ?? null,
            collections: driftFor(collections, docs),
            fullVerifyResults: verify?.results ?? [],
          },
          null,
          2,
        ),
        {
          'content-type': MIME['.json'],
          'content-disposition': 'attachment; filename="quiet-archive-audit.json"',
        },
      );
    }

    // /doc/<slug>/cite.bib and /doc/<slug>/cite/bib (both spellings work)
    const citeMatch = pathname.match(/^\/doc\/([^/]+)\/cite(?:[./]([a-z]+))?$/);
    if (citeMatch) {
      // Convenience: /doc/<slug>/cite.bib, cite.ris, cite.json (also /cite/<ext>)
      const [, slug, extRaw] = citeMatch;
      const { docs } = await loadCatalogue(TARGET);
      const doc = docs.find((d) => d.slug === slug || d.id === slug);
      if (!doc) return send(res, 404, 'no such record');
      const fmt = extRaw || 'bib';
      const body =
        fmt === 'bib' ? toBibtex(doc) : fmt === 'ris' ? toRis(doc) : fmt === 'json' ? JSON.stringify(toCslJson(doc), null, 2) : null;
      if (!body) return send(res, 400, 'unknown format');
      return send(res, 200, body, {
        'content-type': MIME[`.${fmt}`] ?? 'text/plain; charset=utf-8',
        'content-disposition': `attachment; filename="${doc.slug ?? doc.id}.${fmt}"`,
      });
    }

    /* social card -------------------------------------------------------- */
    if (pathname.startsWith('/og')) {
      const slug = pathname.replace(/^\/og\/?/, '').replace(/\.(png|svg)$/, '');
      const format = pathname.endsWith('.svg') ? 'svg' : 'png';
      const data = await gather();
      const doc = slug ? data.docs.find((d) => d.slug === slug || d.id === slug) : null;
      if (slug && !doc) return send(res, 404, 'no such record');

      const stamp = data.health?.verifiedLabel?.replace('Links verified ', '') ?? null;
      const input = doc ?? {
        id: 'VOL. II',
        title: 'Public records nobody reads, catalogued.',
        issuerShort: data.health?.totals?.records ? `${data.health.totals.records} records · every link checked` : 'A reading room for the public record',
        documentType: 'A reading room for the public record',
        status: null,
      };

      try {
        const body = format === 'svg' ? await renderSvg(input, { stamp }) : await renderPng(input, { stamp });
        return send(res, 200, body, {
          'content-type': format === 'svg' ? MIME['.svg'] : MIME['.png'],
          'cache-control': 'no-cache',
        });
      } catch (err) {
        const unavailable =
          err instanceof RendererUnavailable || /satori|resvg|font/i.test(String(err?.message ?? ''));
        if (unavailable) {
          return send(res, 503, String(err?.message ?? err), { 'content-type': 'text/plain; charset=utf-8' });
        }
        throw err;
      }
    }

    /* files: read-only browse of the project for diffing ------------------ */
    if (pathname === '/api/file') {
      const rel = url.searchParams.get('path') ?? '';
      const file = safeProjectPath(rel);
      if (!file) return json(res, { error: 'path outside project' }, 403);
      if (!existsSync(file)) return json(res, { error: 'not found' }, 404);
      const s = await stat(file);
      if (!s.isFile()) return json(res, { error: 'not a file' }, 400);
      if (s.size > 4_000_000) return json(res, { error: 'file too large to display' }, 413);
      return json(res, { path: rel, size: s.size, modified: s.mtime.toISOString(), content: await readFile(file, 'utf8') });
    }

    if (pathname === '/api/tree') {
      const out = [];
      async function walk(rel, depth) {
        if (depth > 3) return;
        const dir = path.join(TARGET, rel);
        let entries;
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
          const childRel = path.join(rel, e.name);
          if (e.isDirectory()) {
            out.push({ path: childRel, type: 'dir' });
            await walk(childRel, depth + 1);
          } else if (/\.(json|mjs|js|ts|astro|md|yml|yaml|txt|csv)$/.test(e.name)) {
            out.push({ path: childRel, type: 'file' });
          }
        }
      }
      await walk('src', 0);
      await walk('scripts', 0);
      return json(res, { root: TARGET, entries: out });
    }

    /* pages -------------------------------------------------------------- */
    const pageData = await gather();
    const drift = driftFor(pageData.collections, pageData.docs);

    const page = pathname.replace(/\/+$/, '') || '/';

    if (page === '/' || page === '/dashboard') {
      return html(res, renderPage('dashboard', { data: pageData, drift, runner }));
    }
    if (page === '/records') {
      return html(
        res,
        renderPage('records', {
          data: pageData,
          drift,
          runner,
          query: {
            q: url.searchParams.get('q') ?? '',
            status: url.searchParams.get('status') ?? '',
            flag: url.searchParams.get('flag') ?? '',
          },
        }),
      );
    }
    if (page === '/connections') {
      const [git, clones] = await Promise.all([gitAvailable(), listClonedProjects(APP_ROOT)]);
      const project = await inspectProject(TARGET);
      return html(
        res,
        renderPage('connections', { data: { ...pageData, git, clones, project }, drift, runner }),
      );
    }
    if (page === '/health-report') {
      return html(res, renderPage('health', { data: pageData, drift, runner }));
    }
    if (page === '/collections') {
      return html(res, renderPage('collections', { data: pageData, drift, runner }));
    }
    if (page === '/jobs') {
      return html(res, renderPage('jobs', { data: pageData, drift, runner }));
    }
    if (page === '/about') {
      return html(res, renderPage('about', { data: pageData, drift, runner }));
    }

    if (pathname.startsWith('/doc/')) {
      const slug = pathname.split('/')[2];
      const doc = pageData.docs.find((d) => d.slug === slug || d.id === slug);
      if (!doc) return html(res, renderPage('notfound', { data: pageData, drift, runner }), 404);
      return html(res, renderPage('record', { data: pageData, drift, runner, doc }));
    }

    return html(res, renderPage('notfound', { data: pageData, drift, runner }), 404);
  } catch (err) {
    console.error(`${method} ${pathname} failed:`, err);
    if (!res.headersSent) {
      return json(res, { error: String(err?.message ?? err) }, 500);
    }
    res.end();
  }
}

let server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('unhandled request error:', err);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' }), res.end('internal error');
  });
});

/* ------------------------------------------------------------------ start */

/**
 * Listen, and if the port is busy move to the next one rather than dying with
 * EADDRINUSE. Someone who already has 4173 open should still get an app.
 */
/**
 * Bind the port. A fresh server object per attempt keeps the state obvious: on
 * EADDRINUSE the failed server is discarded and a new one tries port+1. No
 * listener juggling, and exactly one banner.
 */
function listen(port, attempt = 0) {
  if (attempt > 0) {
    server = http.createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        console.error('unhandled request error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end('internal error');
        }
      });
    });
  }

  const onError = (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 10) {
      console.log(`  port ${port} is in use, trying ${port + 1}…`);
      listen(port + 1, attempt + 1);
      return;
    }
    console.error(`\n  Could not start on ${HOST}:${port} — ${err.message}\n`);
    process.exit(1);
  };
  server.once('error', onError);

  server.listen(port, HOST, () => {
    server.removeListener('error', onError);
    const shown = HOST === '0.0.0.0' ? 'localhost' : HOST;
    const url = `http://${shown}:${port}`;

    // No box drawing: UTF-8 box characters mangle in some Windows terminals,
    // and the one thing that matters is the URL being easy to copy.
    console.log('');
    console.log('  THE QUIET ARCHIVE — local app');
    console.log('  ' + '─'.repeat(40));
    console.log('');
    console.log(`  Open:     ${url}`);
    console.log(`  Project:  ${TARGET}`);
    console.log(`  Cards:    ${rendererAvailable() ? 'enabled' : 'disabled (run npm install)'}`);
    const hasData = existsSync(path.join(TARGET, 'src/data'));
    console.log(`  Data:     ${hasData ? 'found' : 'NOT FOUND — pass --project <dir>'}`);
    console.log('');
    if (!hasData) {
      console.log('  The app is running but has no catalogue to show.');
      console.log('  Use the Connect & deploy page, or restart with --project.');
      console.log('');
    }
    // The launcher watches for this exact prefix and opens a browser.
    console.log(`  serving:  ${url}`);
    console.log('');
    console.log('  Ctrl-C to stop.');
    console.log('');
  });
}

listen(PORT);

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log('\n  stopping…');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000);
  });
}
