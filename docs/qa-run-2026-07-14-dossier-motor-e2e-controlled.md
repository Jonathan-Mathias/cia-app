# Dossier Motor — QA run — 2026-07-14 — controlled end-to-end

Branch: `feat/dossier-motor-foundation`
Scope: CIA App consuming the external dossier-motor decision in a controlled local environment

## What was validated

- the frontend can assemble a controlled external input
- the frontend can call the local `/decide` endpoint
- the returned decision is persisted
- the primary CTA obeys the motor instead of fallback score routing when a valid motor decision exists

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

### 4. End-to-end smoke test

```bash
node tools/qa-dossier-motor-cdp.mjs
```

## Result

- passed

Observed integration result:

- score generated in browser scenario: `68`
- motor endpoint used: `http://127.0.0.1:8788/decide`
- stored decision status: `Completo`
- CTA rendered by app: `dossier_completo_offer`
- CTA URL rendered by app: `https://example.com/completo`

## CTO read

This is still not production.

But the critical MVP proof now exists:

- browser
- frontend
- local HTTP motor
- stored decision
- CTA override

All working together in a controlled environment.
