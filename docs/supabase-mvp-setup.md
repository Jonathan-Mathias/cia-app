# CIA App — Supabase MVP setup

Objetivo: ligar a persistência real do CIA App para teste controlado, sem expor `service_role` no frontend.

## Decisão de arquitetura para este MVP

- frontend estático usa apenas `SUPABASE_URL` + anon public key;
- RLS fica `insert-only` para as tabelas do CIA App;
- nenhuma chave sensível entra no `index.html`;
- geração real do Dossiê continua fora do browser.

## O que Jonathan precisa criar no Supabase

1. Criar ou reaproveitar um projeto Supabase.
2. Abrir `SQL Editor`.
3. Rodar nesta ordem:
   - `supabase/migrations/2026-06-23_cia_tracking_foundation.sql`
   - `supabase/migrations/2026-07-22_dossier_persistence_foundation.sql`
4. Abrir `Project Settings -> API`.
5. Copiar:
   - `Project URL`
   - `anon public` key

## O que Yohas precisa receber

- `SUPABASE_URL`
- anon public key

Com isso, o app pode ser configurado para:

- `APP_CONFIG.integrations.supabase.enabled = true`
- persistir `lead`, `result`, `cta`, `nps`
- persistir `cia_dossier_intakes`
- persistir `cia_dossier_decisions`

## Verificações mínimas antes de chamar de pronto

- insert real em `cia_leads`
- insert real em `cia_results`
- insert real em `cia_dossier_intakes`
- insert real em `cia_dossier_decisions`
- RLS confirmada como `insert-only`
- nenhum uso de `service_role` no frontend

## Troubleshooting rápido

- Se a leitura básica do endpoint funcionar, mas a escrita devolver `401` com erro de RLS, o frontend está chegando no projeto certo e o problema tende a estar nas policies/migrations do banco.
- Nesse caso, reabra o `SQL Editor` e confirme que estes arquivos rodaram no projeto atual:
  - `supabase/migrations/2026-06-23_cia_tracking_foundation.sql`
  - `supabase/migrations/2026-07-22_dossier_persistence_foundation.sql`
- Para validação controlada no browser, abra o app com `?qa=1`. O card de QA permite testar:
  - conectividade com a API
  - escrita real de smoke test sem depender de DevTools

## Estado de escopo do MVP controlado

- Elite waitinglist fica fora deste bloco.
- Para o MVP imediato, casos Elite elegíveis seguem a mesma entrada de Dossiê dos demais casos `score >= 55`.
- O objetivo deste bloco é validar persistência e geração operacional futura, não fechar oferta premium.
