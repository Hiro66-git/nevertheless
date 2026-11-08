/*
 * Client script. No framework, no dependencies.
 *
 * Responsibilities:
 *   - run jobs via POST /api/jobs and stream their output over SSE
 *   - confirm before a job that writes files
 *   - copy citations (the only clipboard use)
 *
 * The job console is progressive enhancement: without JS the buttons are inert
 * but every job is also runnable from a terminal, and the app prints the exact
 * command on the "Checks & fixes" page.
 */
(() => {
  'use strict';

  const logPanel = document.getElementById('logpanel');
  const logEl = document.getElementById('log');
  const logTitle = document.getElementById('logtitle');
  const historyBody = document.querySelector('#history tbody');

  let currentJobId = null;

  /* ------------------------------------------------------------- helpers */

  const setBusy = (btn, busy, label) => {
    if (!btn) return;
    if (busy) {
      btn.dataset.original = btn.textContent;
      btn.disabled = true;
      btn.textContent = label ?? 'Running…';
    } else {
      btn.disabled = false;
      if (btn.dataset.original) btn.textContent = btn.dataset.original;
    }
  };

  const appendLine = (text, stream) => {
    if (!logEl) return;
    const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 24;
    const span = document.createElement('span');
    span.textContent = `${text}\n`;
    if (stream === 'err') span.className = 'log-err';
    logEl.appendChild(span);
    if (atBottom) logEl.scrollTop = logEl.scrollHeight;
  };

  const showLog = (title) => {
    if (!logPanel) return;
    logPanel.hidden = false;
    if (logTitle) logTitle.textContent = title;
    logEl.textContent = '';
  };

  const addHistoryRow = (job) => {
    if (!historyBody) return;
    const empty = historyBody.querySelector('td[colspan]');
    if (empty) empty.closest('tr').remove();

    let row = historyBody.querySelector(`tr[data-job-id="${job.jobId}"]`);
    if (!row) {
      row = document.createElement('tr');
      row.dataset.jobId = job.jobId;
      row.innerHTML = '<th scope="row"></th><td class="status"></td><td class="started tiny"></td><td class="num took tiny"></td>';
      historyBody.prepend(row);
    }
    row.querySelector('th').textContent = job.label;
    row.querySelector('.status').textContent = job.status;
    row.querySelector('.status').className =
      'status ' + (job.status === 'failed' ? 'bad' : job.status === 'warning' ? 'warn' : '');
    row.querySelector('.started').textContent = new Date(job.startedAt).toLocaleTimeString();
    row.querySelector('.took').textContent = job.durationMs == null ? '' : `${(job.durationMs / 1000).toFixed(1)}s`;
  };

  /* ---------------------------------------------------------------- start */

  async function startJob(btn) {
    const id = btn.dataset.job;
    const label = btn.dataset.label || id;
    const writes = btn.dataset.writes === '1';

    if (writes) {
      const ok = window.confirm(
        `${label}\n\nThis modifies files inside your project folder.\n` +
          'It only touches catalogue JSON and generated reports — never your pages.\n\n' +
          'Review the changes with "git diff" before committing.\n\nRun it?',
      );
      if (!ok) return;
    }

    setBusy(btn, true);
    showLog(label);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) {
        appendLine(`Could not start: ${body.error || res.status}`, 'err');
        setBusy(btn, false);
        return;
      }
      currentJobId = body.job.jobId;
      appendLine(`$ ${body.job.label}`, 'out');
      addHistoryRow(body.job);
      btn.dataset.jobId = currentJobId;
      connect(currentJobId);
    } catch (err) {
      appendLine(`Network error: ${err.message}`, 'err');
      setBusy(btn, false);
    }
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-job]');
    if (btn) {
      startJob(btn);
      return;
    }

    const copy = event.target.closest('[data-copy]');
    if (copy) {
      const text = copy.dataset.copy;
      const done = () => {
        const original = copy.textContent;
        copy.textContent = 'Copied';
        setTimeout(() => {
          copy.textContent = original;
        }, 1600);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(() => window.prompt('Copy the citation:', text));
      } else {
        window.prompt('Copy the citation:', text);
      }
      return;
    }

    if (event.target.closest('[data-close-log]') && logPanel) {
      logPanel.hidden = true;
    }
  });

  /* --------------------------------------------------------- live updates */

  /*
   * Only connect when a job is actually running. An always-open SSE stream is the
   * classic way to make a page look dead behind a buffering proxy: the response
   * never ends, the proxy waits, and the browser shows a spinner.
   *
   * So: on page load we do nothing. When the user starts a job we open the stream;
   * if it does not open within 4s we fall back to polling /api/jobs/:id, which
   * works through any proxy.
   */

  let source = null;
  let pollTimer = null;

  const setLiveIndicator = (state) => {
    const el = document.querySelector('[data-live]');
    if (!el) return;
    el.dataset.state = state;
    el.textContent =
      state === 'live' ? 'output: streaming' : state === 'polling' ? 'output: polling' : '';
    el.hidden = state === 'off';
  };

  function stopStream() {
    if (source) {
      source.close();
      source = null;
    }
  }

  function startPolling(jobId) {
    stopStream();
    setLiveIndicator('polling');
    let seen = 0;
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const body = await res.json();
        const lines = !body.log ? [] : body.log.split('\n');
        for (let i = seen; i < lines.length; i += 1) appendLine(lines[i]);
        seen = lines.length;
        if (body.job && body.job.finishedAt) {
          clearInterval(pollTimer);
          finishJob(body.job);
        }
      } catch {
        /* keep trying; the SSE attempt may recover */
      }
    }, 1500);
  }

  function connect(jobId) {
    if (!window.EventSource) return startPolling(jobId);
    stopStream();
    source = new EventSource('/api/events');
    let opened = false;

    // Give the stream a short window. If it never opens, poll instead.
    const guard = setTimeout(() => {
      if (!opened) startPolling(jobId);
    }, 4000);

    source.onopen = () => {
      opened = true;
      clearTimeout(guard);
      clearInterval(pollTimer);
      setLiveIndicator('live');
    };

    source.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type === 'job-line') {
        if (payload.jobId === currentJobId || !currentJobId) appendLine(payload.text, payload.stream);
        return;
      }

      if (payload.type === 'job-started') {
        addHistoryRow(payload.job);
        return;
      }

      if (payload.type === 'job-finished') {
        finishJob(payload.job);
        return;
      }
    };

    source.onerror = () => {
      clearTimeout(guard);
      if (!opened) {
        startPolling(jobId);
        return;
      }
      stopStream();
      // A dropped stream mid-job: switch to polling rather than dying quietly.
      if (jobId) startPolling(jobId);
    };
  }

  /** Shared cleanup + messaging for both the stream and the poller. */
  function finishJob(finished) {
    addHistoryRow(finished);

    const verb =
      finished.status === 'ok'
        ? 'done'
        : finished.status === 'warning'
          ? 'finished with warnings'
          : finished.status;

    appendLine(
      `\n— ${verb} (exit ${finished.exitCode}) in ${((finished.durationMs || 0) / 1000).toFixed(1)}s`,
      finished.status === 'ok' ? 'out' : 'err',
    );

    for (const b of document.querySelectorAll('[data-job]')) {
      if (b.dataset.jobId === finished.jobId || b.dataset.job === finished.id) setBusy(b, false);
    }

    // Data-changing jobs should be reflected in the page immediately.
    if (['verify', 'health', 'collections-fix'].includes(finished.id) && finished.status === 'ok') {
      appendLine('Reloading to show the new numbers…', 'out');
      setTimeout(() => window.location.reload(), 1200);
    }

    clearInterval(pollTimer);
    stopStream();
    setLiveIndicator('off');
  }

  /* ----------------------------------------------------------- connections */

  async function postJson(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
  }

  const showResult = (name, text, bad) => {
    const el = document.querySelector(`[data-result="${name}"]`);
    if (!el) return;
    el.textContent = text;
    el.className = bad ? 'note bad' : 'note';
  };

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-form]');
    if (!form) return;
    event.preventDefault();

    const kind = form.dataset.form;
    const data = Object.fromEntries(new FormData(form).entries());
    const submit = form.querySelector('button[type="submit"]');
    const original = submit.textContent;
    submit.disabled = true;
    submit.textContent = kind === 'clone' ? 'Cloning…' : 'Connecting…';
    showResult(kind, '');

    try {
      if (kind === 'use') {
        const { ok, body } = await postJson('/api/connect/use', { dir: data.dir });
        if (!ok) throw new Error(body.error || 'could not connect');
        showResult(kind, `Connected. Reloading…`);
        setTimeout(() => window.location.reload(), 700);
      } else if (kind === 'clone') {
        const { ok, body } = await postJson('/api/connect/clone', { url: data.url, name: data.name });
        if (!ok) throw new Error(`${body.message || 'clone failed'}${body.log ? `\n\n${body.log}` : ''}`);
        showResult(kind, `Cloned. Connector: ${body.project?.dataFiles?.join(', ') || 'no src/data found'}`);
        if (body.project?.hasData) {
          const use = await postJson('/api/connect/use', { dir: body.project.dir });
          if (use.ok) {
            showResult(kind, 'Cloned and connected. Reloading…');
            setTimeout(() => window.location.reload(), 700);
          }
        }
      }
    } catch (err) {
      showResult(kind, err.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-use-clone]');
    if (!btn) return;
    btn.disabled = true;
    const { ok, body } = await postJson('/api/connect/use', { dir: btn.dataset.useClone });
    if (ok) window.location.reload();
    else {
      btn.disabled = false;
      window.alert(body.error || 'could not connect');
    }
  });

  if (window.EventSource) connect();
})();
