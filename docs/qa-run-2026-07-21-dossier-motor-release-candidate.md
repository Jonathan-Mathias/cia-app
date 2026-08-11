# CIA App — QA recheck for dossier-motor MVP release candidate

Date: 2026-07-21
Branch: `feat/dossier-motor-foundation`
Reviewer stance: CTO / release-candidate triage
Status: `candidate_for_controlled_real_user_testing`

## Objective

Recheck whether the remaining local changes are helping close a real MVP candidate or merely adding noise.

Scope reviewed:

- `index.html`
- `docs/qa-checklist.md`
- `tools/qa-dossier-motor-cdp.mjs`

## Working-tree read before recheck

Local changes present at start:

- `index.html`
- `docs/qa-checklist.md`

Interpretation:

- this is not broad feature creep;
- this is release-candidate hardening around dossier-motor routing and QA coverage.

## What the `index.html` diff actually does

Two behaviors were added to the motor-driven primary CTA layer:

1. `request_complement`
   - sends the user to `#dossier-intake-card`
   - avoids premature commercial routing
   - keeps the next step coherent with `Faltam dados`

2. `route_to_basic`
   - sends the user to the base-strengthening CTA
   - avoids showing a dossier-commercial next step when the case should not advance

CTO read:

- this is blocker-level correctness, not polish;
- without this, the app can leak the wrong commercial suggestion in protected cases.

## What the `docs/qa-checklist.md` diff does

Added a dedicated `2B. Dossier motor` section with checks for:

- logic tests;
- regression matrix;
- `Recusa`;
- `Faltam dados`;
- `Lite` / `Completo`;
- CTA obedience to the motor.

CTO read:

- this is good MVP discipline;
- it turns implicit QA expectations into explicit release criteria.

## Validation executed on 2026-07-21

Passed:

- `node tools/dossier-motor/test.mjs`
- `node tools/dossier-motor/regression-matrix.mjs`
- `node tools/qa-dossier-motor-faltam-dados-cdp.mjs`
- `node tools/qa-dossier-motor-real-intake-cdp.mjs`
- `node tools/qa-dossier-motor-route-to-basic-cdp.mjs`
- `node tools/qa-dossier-motor-cdp.mjs` after hardening the helper to create an isolated Chromium page and wait for app load

Observed outputs:

- `Faltam dados` -> `dossier_request_complement` -> `#dossier-intake-card`
- `Recusa` -> `dossier_route_to_basic` -> base-strengthening CTA
- real intake happy path -> `Completo` -> `dossier_completo_offer`
- generic dossier-motor integration smoke -> `Completo` -> `dossier_completo_offer`
- regression matrix still blocks payment for `Recusa`

## Release-candidate triage

### Keep for MVP candidate

- `index.html` CTA protections for `request_complement`
- `index.html` CTA protections for `route_to_basic`
- `docs/qa-checklist.md` dossier-motor section
- hardened `tools/qa-dossier-motor-cdp.mjs`

### Not proven yet in this recheck

- production email behavior end to end
- final commercial URLs
- production backend/tracking activation
- real-user completion rate
- real-user CTA acceptance

### Open product mismatch observed

The broader `qa-cdp` smoke still shows `Elite` falling back to `strategic_application`.

Current technical reason:

- `APP_CONFIG.links.owned.premiumWaitlist` is empty
- the app therefore keeps the strategic fallback instead of a premium-waitlist CTA

This is not a dossier-motor regression.
It is a product/config mismatch that should be decided explicitly before broader traffic.

## Decision

These local changes should be treated as part of the MVP release candidate, not as optional polish.

Reason:

- they reduce the risk of wrong next-step routing;
- they tighten QA around the exact behavior that will shape the first real-user tests.

## Recommended next move

1. freeze the release candidate around the current working tree;
2. do one final read of `index.html` only for user-facing clarity and legal/copy contradictions;
3. publish for controlled real-user testing, not broad traffic.
