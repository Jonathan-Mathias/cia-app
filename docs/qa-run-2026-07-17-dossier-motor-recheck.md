# Dossier Motor — QA recheck — 2026-07-17

Branch: `feat/dossier-motor-foundation`
Scope: revalidar a fundacao local do motor e registrar o estado real antes de abrir a proxima camada

## What was validated

- unit tests still pass after re-reading the current local branch
- the motor payload shape now has an explicit contract assertion in test coverage
- the real-intake browser smoke test still reaches a motor-driven CTA
- the app keeps the intake hidden after a successful decision is stored

## Commands executed

### 1. Unit tests

```bash
node tools/dossier-motor/test.mjs
```

### 1B. Regression matrix

```bash
node tools/dossier-motor/regression-matrix.mjs
```

### 2. Local static app

```bash
python3 -m http.server 8787 --directory /data/.openclaw/workspace/projects/elite-migration/github/cia-app
```

### 3. Local dossier motor

```bash
node tools/dossier-motor/server.mjs
```

### 4. Headless browser

```bash
chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223 http://127.0.0.1:8787/index.html
```

### 5. Real-intake end-to-end smoke test

```bash
node tools/qa-dossier-motor-real-intake-cdp.mjs
```

### 6. Complement-path smoke test

```bash
node tools/qa-dossier-motor-faltam-dados-cdp.mjs
```

## Result

- passed

Observed integration result:

- score generated in browser scenario: `68`
- stored decision status: `Completo`
- CTA rendered by app: `dossier_completo_offer`
- CTA URL rendered by app: `https://example.com/completo`
- intake visible before decision: `true`
- intake visible after successful decision: `false`

Observed complement-path result:

- stored decision status: `Faltam dados`
- CTA rendered by app: `dossier_request_complement`
- CTA URL rendered by app: `#dossier-intake-card`

Observed regression matrix coverage:

- `recusa_missing_cv`
- `recusa_language_block`
- `faltam_dados_missing_questionnaire`
- `faltam_dados_goal_unclear`
- `lite_clear_lower_density`
- `completo_high_density`

## CTO read

The foundation is alive locally.

What this does mean:

- the vertical slice exists end-to-end in local QA
- the decision payload is no longer validated only by human reading
- the app can already switch from fallback CTA to motor-driven dossier CTA

What this still does not mean:

- no production readiness
- no pricing validation
- no payment flow validation
- no persistent backend truth yet
- no reviewed merge gate yet

## Next gate

1. freeze the local payload contract as the working interface
2. keep the regression matrix executable and expand only when a new rule is added
3. review the branch diff before any merge or deploy discussion
