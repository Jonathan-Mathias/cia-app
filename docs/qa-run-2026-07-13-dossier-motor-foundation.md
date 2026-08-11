# CIA App — QA run — 2026-07-13 — dossier motor foundation

Branch: `feat/dossier-motor-foundation`
Scope: foundation for future external dossier-motor decision without breaking current CTA routing

## What changed

- Added `APP_CONFIG.integrations.dossierMotor`
- Added empty product slots for `dossieLite` and `dossieCompleto`
- Added safe parsing and retrieval of stored motor decision
- Added optional motor-driven CTA resolution with fallback to current score-based CTA
- Added motor decision fields to result payload and CV Builder handoff payload
- Updated architecture/product docs to clarify routing boundary

## Checks executed

### 1. JavaScript syntax

Command:

```bash
awk 'NR>296 && NR<2707' index.html > /tmp/cia-app-inline.js
node --check /tmp/cia-app-inline.js
```

Result:

- passed

### 2. Functional smoke test

Commands:

```bash
python3 -m http.server 8787 --directory /data/.openclaw/workspace/projects/elite-migration/github/cia-app
chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9223 http://127.0.0.1:8787/index.html
node tools/qa-cdp.mjs
```

Result:

- passed

Synthetic routing observed:

- DE low → `community_foundation`
- DE mid → `cv_builder`
- DE ready → `strategic_application`
- DE elite → `premium_waitlist`
- AU low → `community_foundation`
- AU mid → `strategic_application`
- AU ready → `strategic_application`
- AU elite → `premium_waitlist`

## Known limits after this branch

- No remote motor fetch exists yet
- No product URLs exist yet for `Dossiê Lite` or `Dossiê Completo`
- CTA override only activates if a valid stored decision exists and a product URL is configured
- Repo already had local modifications before this QA run; treat this report as evidence for this branch scope only

## CTO read

This branch does not put the dossier motor live.
It only prepares the CIA App to consume a future motor decision without creating a second routing truth in the frontend.
