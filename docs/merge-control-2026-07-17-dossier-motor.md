# Merge Control — Dossier Motor Foundation

Date: 2026-07-17
Branch under review: `feat/dossier-motor-foundation`
Reviewer stance: CTO
Classification: `seguro so em QA/staging`

## Status update — 2026-07-18

This document was created before rechecking the remote state.

After a direct git read on 2026-07-18, the operational state is:

- local `feat/dossier-motor-foundation` HEAD: `e6d94d8`
- `origin/main`: `e6d94d8`
- local `main`: `b31c244`

Meaning:

- the dossier-motor foundation is already present in `origin/main`
- the original merge discussion is no longer the active bottleneck
- what remains locally now is follow-up work in the working tree, not the original foundation merge

Current local-only follow-up changes observed on 2026-07-18:

- `index.html`
- `tools/dossier-motor/test.mjs`
- `tools/dossier-motor/contract-test.mjs`
- `tools/dossier-motor/regression-matrix.mjs`
- `tools/qa-dossier-motor-faltam-dados-cdp.mjs`
- `docs/qa-run-2026-07-17-dossier-motor-recheck.md`
- `docs/qa-checklist.md`

Operational recommendation after this recheck:

- do not keep treating the foundation as “pending merge”
- treat the remaining local changes as a second, smaller QA-hardening package
- before any new merge conversation, either:
  - commit the follow-up on top of current `origin/main`; or
  - discard/split the follow-up if Jonathan decides it should not enter the repo

## Objective

Reduce ambiguity before any merge discussion.

This document separates:

- what belongs to the dossier-motor foundation and can move forward together;
- what is mixed into the branch but should be reviewed separately;
- what must be rechecked at merge time.

## Current read

The branch already proved a local vertical slice:

- CIA App result page
- strategic intake for dossier-eligible users
- external local motor via `/decide`
- stored decision
- CTA obeying the motor

The branch is not ready for live production.
It is acceptable as a QA/staging foundation.

## Keep now — foundation scope

These items are coherent with the current branch objective and should stay together in the merge discussion:

- `tools/dossier-motor/engine.mjs`
- `tools/dossier-motor/server.mjs`
- `tools/dossier-motor/test.mjs`
- `tools/dossier-motor/contract-test.mjs`
- `tools/dossier-motor/regression-matrix.mjs`
- `tools/dossier-motor/sample-request.json`
- `tools/qa-dossier-motor-cdp.mjs`
- `tools/qa-dossier-motor-real-intake-cdp.mjs`
- `tools/qa-dossier-motor-faltam-dados-cdp.mjs`
- `docs/dossier-motor-mvp-architecture.md`
- `docs/qa-run-2026-07-13-dossier-motor-foundation.md`
- `docs/qa-run-2026-07-14-dossier-motor-local.md`
- `docs/qa-run-2026-07-14-dossier-motor-e2e-controlled.md`
- `docs/qa-run-2026-07-15-dossier-motor-real-intake.md`
- `docs/qa-run-2026-07-17-dossier-motor-recheck.md`
- `index.html` changes directly tied to:
  - dossier motor config
  - stored motor decision/input
  - request to `/decide`
  - intake card
  - motor-driven CTA behavior
  - payload handoff to analytics/CV Builder
  - fix for `Recusa` / `Faltam dados` not falling back to score CTA

## Review separately — mixed scope

These changes are real, but they are not strictly required to prove the dossier-motor foundation:

- `index.html`: AU email route changed to enabled locally
- `index.html`: version bump to `2.5-dossier-motor-foundation`
- `index.html`: `liStep` visibility adjustments in `getSteps`
- `docs/architecture.md`: broader operational narrative updates, including AU route state
- `docs/product-brief.md`: broader product-direction update and AU email state
- `docs/qa-checklist.md`: useful, but broader than the minimum motor foundation

Recommendation:

- if Jonathan wants the safest merge path, split these items into a follow-up review or a second commit;
- if speed matters more than cleanliness, keep them but call them out explicitly in review.

## Why this matters

The branch diff against `main` is large.

A large diff is not automatically wrong.
But it increases the chance of:

- merging unrelated product decisions by accident;
- masking regressions inside `index.html`;
- blurring what was actually validated versus what merely changed nearby.

## Minimum merge decision

The only human decision still needed is:

- accept this branch as QA/staging foundation for the dossier motor; or
- stop and split the mixed-scope changes first.

CTO recommendation:

- accept as QA/staging foundation;
- do not call it production-ready;
- do not layer new sales UX on top yet;
- prefer a controlled merge review instead of a “looks fine” merge.

## Required rechecks at merge time

Run all of these again from the final merge candidate:

```bash
node tools/dossier-motor/test.mjs
node tools/dossier-motor/regression-matrix.mjs
node tools/qa-dossier-motor-real-intake-cdp.mjs
node tools/qa-dossier-motor-faltam-dados-cdp.mjs
```

Confirm these expected states:

- `Completo` -> CTA `dossier_completo_offer`
- `Faltam dados` -> CTA `dossier_request_complement`
- `Recusa` never leaks into a score-based premium/strategic CTA
- `Lite` and `Completo` still return coherent `recommended_offer`

## Merge checklist

- [ ] branch diff read end to end
- [ ] mixed-scope files explicitly accepted or split out
- [ ] `test.mjs` passes
- [ ] `regression-matrix.mjs` passes
- [ ] `qa-dossier-motor-real-intake-cdp.mjs` passes
- [ ] `qa-dossier-motor-faltam-dados-cdp.mjs` passes
- [ ] no production/live claim added
- [ ] no payment flow implied as validated
- [ ] no backend persistence implied as validated
- [ ] rollback path understood: revert branch merge or revert `index.html` + `tools/dossier-motor/*`

## Final recommendation

If merging now, the honest label is:

`merge for QA/staging foundation only`

Not:

- production ready
- commercially ready
- payment ready
- backend ready
