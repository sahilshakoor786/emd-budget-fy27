/* Minimal stand-in for the dashboard runtime: loads the JSON snapshots in /data,
   evaluates calculations and (re)draws every [data-draw] element that is visible. */
(function () {
  const DATASETS = ['budget_items', 'monthly', 'open_pos', 'open_prs', 'vendors', 'transactions'];
  const store = {};       // id -> {status, data}
  const calcs = {};       // id -> {inputs, fn, cache}
  const draws = {};       // name -> fn
  const listeners = [];

  const raw = (id) => store[id] || { status: 'loading', data: [] };

  const dash = {
    colors: ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)', 'var(--s8)'],
    data(id) {
      if (calcs[id]) {
        const c = calcs[id];
        const ins = c.inputs.map((i) => dash.data(i));
        const bad = ins.find((g) => g.status !== 'ok');
        if (bad) return { status: bad.status, data: [] };
        if (!c.cache) {
          try { c.cache = { status: 'ok', data: c.fn(...ins.map((g) => g.data)) }; }
          catch (e) { console.error('calc', id, e); c.cache = { status: 'error', data: [], message: String(e) }; }
        }
        return c.cache;
      }
      return raw(id);
    },
    calc(id, def) { calcs[id] = { inputs: def.inputs, fn: def.fn, cache: null }; },
    loader() {},
    onData(fn) { listeners.push(fn); try { fn(); } catch (e) { console.error(e); } },
    draw(name, fn) {
      if (typeof fn === 'function') { draws[name] = fn; return; }
      runDraw(name);
    },
    setLink(name) {
      try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
      drawAll();
    },
    params() { return {}; },
    setParams() { drawAll(); },
    resetParams() { drawAll(); },
    refresh() {}
  };

  function runDraw(name) {
    const fn = draws[name];
    if (!fn) return;
    document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
      if (el.closest('[hidden]')) return;
      try { fn(el); } catch (e) { console.error('draw', name, e); }
    });
  }
  function drawAll() {
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    Object.keys(draws).forEach(runDraw);
  }

  window.dash = dash;
  window.__dashStart = function () {
    drawAll();
    DATASETS.forEach((id) => {
      fetch(`data/${id}.json`, { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
        .then((rows) => { store[id] = { status: 'ok', data: rows, columns: rows.length ? Object.keys(rows[0]) : [] }; })
        .catch((e) => { console.error(id, e); store[id] = { status: 'error', data: [], message: String(e) }; })
        .finally(() => { Object.values(calcs).forEach((c) => { c.cache = null; }); drawAll(); });
    });
    let t;
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t); t = setTimeout(drawAll, 150);
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', drawAll);
  };
})();
