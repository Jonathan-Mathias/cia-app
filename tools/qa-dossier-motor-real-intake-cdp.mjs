// CIA App real intake -> dossier motor smoke test via Chrome DevTools Protocol.
// Requires:
// 1. python3 -m http.server 8787 --directory /path/to/cia-app
// 2. node tools/dossier-motor/server.mjs
// 3. chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223
// 4. node tools/qa-dossier-motor-real-intake-cdp.mjs

const DEBUG_BASE = 'http://127.0.0.1:9223';
const TARGET_URL = `http://127.0.0.1:8787/index.html?smoke=real-intake&qa=1&ts=${Date.now()}`;

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
  delete window.__CIA_DOSSIER_INPUT__;
  delete window.__CIA_DOSSIER_DECISION__;
  try {
    sessionStorage.removeItem('ciaDossierDecision');
    localStorage.removeItem('ciaDossierDecision');
    sessionStorage.removeItem('ciaDossierInput');
    localStorage.removeItem('ciaDossierInput');
  } catch (e) {}

  function pick(q, mode) {
    if (!q.opts || !q.opts.length) return null;
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
  LEAD = { _id: 'lead_test_real_intake', nome: 'Teste Real Intake', email: 'teste@example.com', waDDI: '55', waNum: '11999999999', idade: '33-39' };
  GEO = { pais: 'br', paisLabel: 'Brasil', tempo: '' };
  QS.forEach(q => {
    if (q.familyQ) return;
    const option = pick(q, 'ready');
    if (option) ANS[q.id] = { v: option.v, l: option.l };
  });

  document.body.innerHTML = '<div id="app"></div>';
  await renderResults();

  const intakeBefore = !!document.getElementById('dossier-intake-card');
  if (!intakeBefore) {
    const currentResult = calcScore();
    const currentBand = getBand(currentResult.final);
    const currentDecision = getStoredMotorDecision();
    storeDossierWorkspaceContext(buildDossierWorkspaceContext(currentResult, currentBand, currentDecision, 'workspace'));
    replaceHashSilently('#dossier-intake');
    renderDossierWorkspace('intake');
  }
  const toggle = document.getElementById('dossier-intake-toggle');
  if (!toggle) throw new Error('Dossier intake toggle not found after opening workspace');
  toggle.click();

  const setIfPresent = (id, value, type = 'value') => {
    const el = document.getElementById(id);
    if (!el) return false;
    if (type === 'checked') el.checked = !!value;
    else el.value = value;
    return true;
  };

  document.getElementById('dossier-seniority').value = 'Senior';
  document.getElementById('dossier-availability').value = 'media';
  document.getElementById('dossier-urgency').value = '3-6 meses';
  document.getElementById('dossier-cv').checked = true;
  document.getElementById('dossier-linkedin').checked = true;
  setIfPresent('dossier-goal', 'Quero me reposicionar para o mercado alemao com candidatura mais legivel e foco em vaga alvo.');
  setIfPresent('dossier-market-logic', 'A Alemanha faz sentido pela aderencia da minha experiencia e pelo tipo de industria que quero atacar.');
  setIfPresent('dossier-results-evidence', 'Tenho historico de resultados com impacto operacional e financeiro em projetos e lideranca.');
  setIfPresent('dossier-target-roles', 'Operations Manager, Project Manager');
  setIfPresent('dossier-reference-opportunity', 'Vaga de Operations Manager em empresa industrial na Alemanha ja mapeada.');
  setIfPresent('dossier-tradeoffs', true, 'checked');

  document.getElementById('dossier-intake-submit').click();

  const waitForCta = () => new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const decision = JSON.parse(sessionStorage.getItem('ciaDossierDecision') || 'null');
      const unlockBtn = document.getElementById('dossier-fulfillment-unlock');
      if (decision && decision.decision && decision.decision.status === 'Completo' && window.location.hash === '#dossier-interview' && unlockBtn) {
        return resolve({
          hash: window.location.hash,
          unlockLabel: unlockBtn.textContent,
          storedDecision: decision,
          intakeVisibleBefore: intakeBefore,
          intakeVisibleAfter: !!document.getElementById('dossier-intake-card'),
          interviewVisibleAfter: !!document.getElementById('dossier-interview-card')
        });
      }
      if (Date.now() - started > 4000) {
        return reject(new Error('Timed out waiting for real intake interview transition'));
      }
      setTimeout(tick, 100);
    };
    tick();
  });

  return await waitForCta();
})()`;

try {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.result.exceptionDetails) {
    console.error(result.result.exceptionDetails);
    process.exit(1);
  }

  const value = result.result.result.value;
  if (value.hash !== '#dossier-interview') {
    throw new Error(`Expected #dossier-interview, got ${value.hash}`);
  }
  if (!value.unlockLabel) {
    throw new Error('Expected QA unlock button in interview stage');
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
