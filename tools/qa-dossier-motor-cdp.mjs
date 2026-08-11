// CIA App + Dossier Motor integration smoke test via Chrome DevTools Protocol.
// Requires:
// 1. python3 -m http.server 8787 --directory /path/to/cia-app
// 2. node tools/dossier-motor/server.mjs
// 3. chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223
// 4. node tools/qa-dossier-motor-cdp.mjs

const DEBUG_BASE = 'http://127.0.0.1:9223';
const TARGET_URL = `http://127.0.0.1:8787/index.html?smoke=dossier-motor&ts=${Date.now()}`;

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
      expression: `typeof getQuestions === 'function' && typeof renderResults === 'function'`,
      returnByValue: true
    });
    if (probe?.result?.result?.value === true) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('CIA App script did not finish loading inside Chromium target');
}

await waitForAppReady();

const expression = `(async () => {
  window.__CIA_DOSSIER_CONFIG__ = {
    enabled: true,
    decisionUrl: 'http://127.0.0.1:8788/decide',
    timeoutMs: 2000
  };
  window.__CIA_DOSSIER_LINKS__ = {
    dossieLite: 'https://example.com/lite',
    dossieCompleto: 'https://example.com/completo'
  };
  window.__CIA_DOSSIER_INPUT__ = {
    profile: { seniority_level: 'Senior' },
    materials: { cv: true, linkedin: true, portfolio: false, github: false },
    questionnaire: {
      goal_for_next_12_months: 'Quero me reposicionar para o mercado alemao com candidatura mais legivel.',
      target_market_logic: 'A Alemanha faz sentido pela aderencia da minha experiencia e pelo tipo de industria que busco.',
      evidence_of_results: 'Tenho historico de resultados e lideranca com impacto mensuravel.',
      language_level_detail: 'Alemao B2 em contexto profissional.',
      reference_opportunity: 'Vaga de Operations Manager em empresa industrial na Alemanha ja mapeada.',
      availability_for_execution: 'media',
      urgency_window: '3-6 meses',
      target_role_hypotheses: ['Operations Manager', 'Project Manager'],
      has_meaningful_tradeoffs: true,
      high_ambiguity_case: false,
      story_inconsistent: false,
      language_structural_block: false
    }
  };

  function pick(q, mode, route) {
    if (!q.opts || !q.opts.length) return null;
    if (q.selectQ) {
      const preferred = route === 'de' ? ['eng', 'ti', 'gestao', 'outro'] : ['eng', 'ti', 'gestao', 'outro'];
      return q.opts.find(o => preferred.includes(o.v)) || q.opts[0];
    }
    const numeric = q.opts.filter(o => typeof o.v === 'number').sort((a, b) => a.v - b.v);
    if (!numeric.length) return q.opts[0];
    if (mode === 'elite') return numeric[numeric.length - 1];
    if (mode === 'ready') return numeric[Math.max(0, numeric.length - 2)] || numeric[numeric.length - 1];
    return numeric[Math.floor(numeric.length / 2)] || numeric[0];
  }

  T = 'de';
  QS = getQuestions('de');
  ANS = {};
  CTR = { adultos: 1, criancas: 0, jovens: 0 };
  NPS = null;
  LEAD = { _id: 'lead_test_e2e', nome: 'Teste Integracao', email: 'teste@example.com', waDDI: '55', waNum: '11999999999', idade: '33-39' };
  GEO = { pais: 'br', paisLabel: 'Brasil', tempo: '' };
  QS.forEach(q => {
    if (q.familyQ) return;
    const option = pick(q, 'ready', 'de');
    if (option) ANS[q.id] = { v: option.v, l: option.l };
  });

  document.body.innerHTML = '<div id="app"></div>';
  await renderResults();
  const ctaEl = document.querySelector('[data-primary-cta]');
  return {
    ctaId: ctaEl ? ctaEl.getAttribute('data-primary-cta') : null,
    ctaHref: ctaEl ? ctaEl.getAttribute('href') : null,
    storedDecision: JSON.parse(sessionStorage.getItem('ciaDossierDecision') || 'null'),
    source: window.__CIA_DOSSIER_CONFIG__.decisionUrl
  };
})()`;

try {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.result.exceptionDetails) {
    console.error(result.result.exceptionDetails);
    process.exit(1);
  }

  const value = result.result.result.value;
  if (value.ctaId !== 'dossier_completo_offer') {
    throw new Error(`Expected dossier_completo_offer, got ${value.ctaId}`);
  }
  if (value.ctaHref !== 'https://example.com/completo') {
    throw new Error(`Expected completo URL, got ${value.ctaHref}`);
  }
  if (!value.storedDecision || value.storedDecision.decision?.status !== 'Completo') {
    throw new Error('Stored motor decision missing or invalid');
  }
  console.log(JSON.stringify(value, null, 2));
} finally {
  ws.close();
  if (page?.id) {
    await fetch(`${DEBUG_BASE}/json/close/${page.id}`).catch(() => {});
  }
}
