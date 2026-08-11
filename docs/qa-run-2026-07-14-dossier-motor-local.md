# Dossier Motor — QA run — 2026-07-14 — local worker MVP

Branch: `feat/dossier-motor-foundation`
Scope: first executable local version of the external dossier-motor worker

## What was added

- `tools/dossier-motor/engine.mjs`
- `tools/dossier-motor/server.mjs`
- `tools/dossier-motor/test.mjs`
- `tools/dossier-motor/sample-request.json`
- `docs/dossier-motor-mvp-architecture.md`

## Checks executed

### 1. Syntax

Commands:

```bash
node --check tools/dossier-motor/engine.mjs
node --check tools/dossier-motor/server.mjs
```

Result:

- passed

### 2. Rule tests

Command:

```bash
node tools/dossier-motor/test.mjs
```

Result:

- passed

Covered cases:

- missing CV → `Recusa`
- score below 55 → `Recusa`
- missing questionnaire → `Faltam dados`
- eligible lower-density case → `Lite`
- eligible higher-density case → `Completo`

### 3. HTTP boundary smoke test

Commands:

```bash
node tools/dossier-motor/server.mjs
curl -X POST http://127.0.0.1:8788/decide \\
  -H 'Content-Type: application/json' \\
  --data @tools/dossier-motor/sample-request.json
```

Result:

- passed

Observed decision for sample payload:

- `status: Completo`
- `recommended_offer: Completo`
- `payment_eligibility: allowed`
- `next_step: offer_completo`

## CTO read

The external judge now exists locally.

It is not deployed.
It is not connected to the frontend by live fetch yet.
But the core engine, the HTTP boundary and the rule tests already exist and work in local controlled execution.
