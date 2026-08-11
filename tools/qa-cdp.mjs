// CIA App functional smoke test via Chrome DevTools Protocol.
// Usage:
// 1. python3 -m http.server 8787 --directory /path/to/cia-app
// 2. chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223
// 3. node tools/qa-cdp.mjs

const DEBUG_BASE = 'http://127.0.0.1:9223';
const TARGET_URL = `http://127.0.0.1:8787/index.html?smoke=qa-cdp&ts=${Date.now()}`;

const page = await fetch(`${DEBUG_BASE}/json/new?${encodeURIComponent(TARGET_URL)}`, {
  method: 'PUT'
}).then(async (r) => {
  if (!r.ok) throw new Error(`Failed to create isolated Chromium page: HTTP ${r.status}`);
  return r.json();
});
if (!page?.webSocketDebuggerUrl) throw new Error('Chromium did not return a debuggable page target');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const msg = { id: ++id, method, params };
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === msg.id) {
        ws.removeEventListener('message', onMessage);
        resolve(data);
      }
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify(msg));
  });
}

await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
await send('Runtime.enable');

async function waitForAppReady(timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const probe = await send('Runtime.evaluate', {
      expression: `typeof getQuestions === 'function' && typeof calcScore === 'function' && typeof getPrimaryCta === 'function'`,
      returnByValue: true
    });
    if (probe?.result?.result?.value === true) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('CIA App script did not finish loading inside Chromium target');
}

await waitForAppReady();

const expression = `(() => {
  function pick(q, mode, route) {
    if (!q.opts || !q.opts.length) return null;
    if (q.selectQ) {
      const preferred = route === 'de' ? ['eng', 'ti', 'gestao', 'outro'] : ['eng', 'ti', 'gestao', 'outro'];
      return q.opts.find(o => preferred.includes(o.v)) || q.opts[0];
    }
    const numeric = q.opts.filter(o => typeof o.v === 'number').sort((a, b) => a.v - b.v);
    if (!numeric.length) return q.opts[0];
    if (mode === 'low') return numeric[0];
    if (mode === 'elite') return numeric[numeric.length - 1];
    if (mode === 'ready') return numeric[Math.max(0, numeric.length - 2)] || numeric[numeric.length - 1];
    return numeric[Math.floor(numeric.length / 2)] || numeric[0];
  }

  function run(route, mode) {
    T = route;
    QS = getQuestions(route);
    ANS = {};
    CTR = { adultos: 0, criancas: 0, jovens: 0 };
    NPS = null;
    LEAD = { nome: 'Teste Produto', email: 'teste@example.com', waDDI: '55', waNum: '11999999999', idade: '33-39' };
    GEO = { pais: 'br', paisLabel: 'Brasil', tempo: '' };
    if (mode === 'ready') CTR = { adultos: 1, criancas: 0, jovens: 0 };
    if (mode === 'elite') GEO = { pais: route, paisLabel: route === 'de' ? 'Alemanha' : 'Austrália', tempo: '2y5y', tempoLabel: 'Entre 2 e 5 anos' };
    QS.forEach(q => {
      if (q.familyQ) return;
      const option = pick(q, mode, route);
      if (option) ANS[q.id] = { v: option.v, l: option.l };
    });
    const result = calcScore();
    const band = getBand(result.final);
    const cta = getPrimaryCta(result, band);
    return { route, mode, score: result.final, band: band.lb, dims: result.dims, cta: cta.id, label: cta.label, hasUrl: !!cta.url };
  }

  return [
    run('de', 'low'), run('de', 'mid'), run('de', 'ready'), run('de', 'elite'),
    run('au', 'low'), run('au', 'mid'), run('au', 'ready'), run('au', 'elite')
  ];
})()`;

const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
if (result.result.exceptionDetails) {
  console.error(result.result.exceptionDetails);
  process.exit(1);
}

const rows = result.result.result.value;
try {
  for (const row of rows) {
    if (!row.hasUrl) throw new Error(`CTA without URL: ${row.route} ${row.mode} ${row.cta}`);
    if (row.score < 0 || row.score > 100) throw new Error(`Score out of range: ${JSON.stringify(row)}`);
  }
  console.log(JSON.stringify(rows, null, 2));
} finally {
  ws.close();
  if (page?.id) {
    await fetch(`${DEBUG_BASE}/json/close/${page.id}`).catch(() => {});
  }
}
