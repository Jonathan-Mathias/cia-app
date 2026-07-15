# Dossier Motor — QA run — 2026-07-15 — real intake flow

Branch: `feat/dossier-motor-foundation`
Scope: CIA App mounting the dossier-motor payload from a real result-page intake instead of only `window.__CIA_DOSSIER_INPUT__`

## What was validated

- the result page shows the strategic intake only when the dossier motor is enabled
- the intake can collect the minimum extra fields without changing the quiz flow
- the app stores the real intake payload in browser storage
- the app calls the local `/decide` endpoint after intake submission
- the primary CTA updates from fallback to the motor-driven dossier offer

## Commands executed

### 1. Local static app

```bash
python3 -m http.server 8787 --directory /data/.openclaw/workspace/projects/elite-migration/github/cia-app
```

### 2. Local dossier motor

```bash
node tools/dossier-motor/server.mjs
```

### 3. Headless browser

```bash
chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223 http://127.0.0.1:8787/index.html
```

### 4. Motor unit tests

```bash
node tools/dossier-motor/test.mjs
```

### 5. Real-intake end-to-end smoke test

```bash
node tools/qa-dossier-motor-real-intake-cdp.mjs
```

## Result

- passed

Observed integration result:

- intake visible before decision: `true`
- intake visible after successful decision: `false`
- score generated in browser scenario: `68`
- motor endpoint used: `http://127.0.0.1:8788/decide`
- stored decision status: `Completo`
- CTA rendered by app: `dossier_completo_offer`
- CTA URL rendered by app: `https://example.com/completo`

## CTO read

This is still not production.

But the product path is now cleaner than before:

- quiz stays fast
- extra friction appears only for users who might qualify for a dossier path
- the app no longer depends only on a controlled global stub to feed the motor
- the CTA can change based on a real intake captured inside the app
