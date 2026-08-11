// CIA App + Dossier Motor complement-path smoke test via Chrome DevTools Protocol.
// Requires:
// 1. python3 -m http.server 8787 --directory /path/to/cia-app
// 2. node tools/dossier-motor/server.mjs
// 3. chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223
// 4. node tools/qa-dossier-motor-faltam-dados-cdp.mjs

const DEBUG_BASE = 'http://127.0.0.1:9223';
const TARGET_URL = `http://127.0.0.1:8787/index.html?smoke=faltam-dados&ts=${Date.now()}`;

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
      goal_for_next_12_months: 'ainda nao sei',
      target_market_logic: 'A Alemanha faz sentido pela aderencia da minha experiencia e pelo tipo de industria que busco.',
      evidence_of_results: 'Tenho historico de resultados e lideranca com impacto mensuravel.',
      language_level_detail: 'Alemao B1 em progresso.',
      reference_opportunity: 'Vaga de Operations Manager em empresa industrial na Alemanha ja mapeada.',
      availability_for_execution: 'media',
      urgency_window: '3-6 meses',
      target_role_hypotheses: ['Operations Manager'],
      has_meaningful_tradeoffs: false,
      high_ambiguity_case: false,
      story_inconsistent: false,
      language_structural_block: false
    }
  };

  function pick(q, mode) {
    if (!q.opts || !q.opts.length) return null;
    if (q.selectQ) return q.opts[0];
    const numeric = q.opts.filter(o => typeof o.v === 'number').sort((a, b) => a.v - b.v);
    if (!numeric.length) return q.opts[0];
    if (mode === 'ready') return numeric[Math.max(0, numeric.length - 2)] || numeric[numeric.length - 1];
    return numeric[Math.floor(numeric.length / 2)] || numeric[0];
  }

  T = 'de';
  QS = getQuestions('de');
  ANS = {};
  CTR = { adultos: 1, criancas: 0, jovens: 0 };
  NPS = null;
  LEAD = { _id: 'lead_test_faltam_dados', nome: 'Teste Faltam Dados', email: 'teste@example.com', waDDI: '55', waNum: '11999999999', idade: '33-39' };
  GEO = { pais: 'br', paisLabel: 'Brasil', tempo: '' };
  QS.forEach(q => {
    if (q.familyQ) return;
    const option = pick(q, 'ready');
    if (option) ANS[q.id] = { v: option.v, l: option.l };
  });

  document.body.innerHTML = '<div id="app"></div>';
  await renderResults();

  const workspaceBtn = document.querySelector('[data-dossier-workspace-open="intake"]');
  const decision = JSON.parse(sessionStorage.getItem('ciaDossierDecision') || 'null');
  return {
    workspaceMode: workspaceBtn ? workspaceBtn.getAttribute('data-dossier-workspace-open') : null,
    workspaceLabel: workspaceBtn ? workspaceBtn.textContent : null,
    storedDecision: decision
  };
})()`;

try {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.result.exceptionDetails) {
    console.error(result.result.exceptionDetails);
    process.exit(1);
  }

  const value = result.result.result.value;
  if (value.workspaceMode !== 'intake') {
    throw new Error(`Expected intake workspace launch, got ${value.workspaceMode}`);
  }
  if (!value.storedDecision || value.storedDecision.decision?.status !== 'Faltam dados') {
    throw new Error('Stored motor decision missing or invalid for Faltam dados');
  }
  console.log(JSON.stringify(value, null, 2));
} finally {
  ws.close();
  if (page?.id) {
    await fetch(`${DEBUG_BASE}/json/close/${page.id}`).catch(() => {});
  }
}
