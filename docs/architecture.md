# CIA App — Arquitetura técnica

Status: em desenvolvimento
Versão base: `index.html` estático no GitHub Pages
Última atualização operacional: 2026-07-07

## Objetivo

Manter o CIA App como HTML estático por enquanto, mas organizado para virar módulo da Plataforma EM sem reescrever tudo.

## Camadas atuais

1. **UI/Quiz**
   - Seleção de rota: Alemanha (`de`) ou Austrália (`au`).
   - Perguntas, respostas, cálculo de score, dimensões e bandas no frontend.
   - Lead gate depois do quiz e antes do resultado.

2. **Configuração central**
   - `APP_CONFIG` no topo do `index.html` concentra:
     - versão do app;
     - Google Apps Script proxy;
     - flags Supabase;
     - links de produtos;
     - links de partners;
     - links próprios;
     - status dos plugins de email por rota.

3. **Tracking e dados**
   - `logEvent(type, data)` continua enviando para o Google Apps Script.
   - A função já está preparada para enviar eventos ao Supabase quando `APP_CONFIG.integrations.supabase.enabled = true`.
   - `session_id` é gerado no navegador e salvo em `sessionStorage` para conectar eventos anônimos antes do lead gate.
   - `lead_id` público é gerado no navegador para conectar lead, resultado, eventos, NPS e cliques.
   - Em 2026-07-22, a fundação foi estendida para persistir também:
     - intake curto do Dossiê (`cia_dossier_intakes`);
     - decisão devolvida pelo motor (`cia_dossier_decisions`).
   - Taxonomia de eventos: `docs/tracking/events-taxonomy.md`.
   - Migrations Supabase:
     - `supabase/migrations/2026-06-23_cia_tracking_foundation.sql`;
     - `supabase/migrations/2026-07-22_dossier_persistence_foundation.sql`.

4. **Fronteira com o motor do Dossiê**
   - O CIA App continua calculando score, banda e CTA fallback no frontend.
   - Quando a Plataforma EM começar a devolver uma decisão externa do motor, o app deve consumi-la sem criar uma segunda verdade de roteamento.
   - A fundação atual aceita uma decisão externa via `window.__CIA_DOSSIER_DECISION__` ou `sessionStorage/localStorage` com a chave configurada em `APP_CONFIG.integrations.dossierMotor.storageKey`.
   - Em ambiente controlado, o app também pode:
     - chamar um endpoint de decisão configurado em `window.__CIA_DOSSIER_CONFIG__`;
     - persistir a decisão retornada para o CTA principal obedecer o motor;
     - montar o payload do motor por dois caminhos:
       - `window.__CIA_DOSSIER_INPUT__` para QA/controlado;
       - triagem estratégica curta no próprio resultado do app para um fluxo mais real.
   - O novo fluxo real usa:
     - base já existente do quiz (`route`, `score`, `band`, `lead_id`, área);
     - triagem curta só para elegíveis (`score >= 55`);
     - campos mínimos de decisão: senioridade, disponibilidade, prazo, CV, LinkedIn, objetivo, lógica do mercado, evidência de resultado e hipótese de cargo-alvo.
   - O contrato canônico dessa triagem curta agora vive em:
     - `tools/dossier-motor/schema-questionario-estrategico-complementar.json`
     - `tools/dossier-motor/questionnaire-contract.mjs`
   - Se existir decisão válida e houver URL configurada para o produto correspondente, o CTA principal pode ser dirigido pelo motor.
   - Se não houver decisão válida ou link de produto pronto, o app preserva o fallback atual por score.
   - Para MVP controlado, o intake submetido e a decisão retornada também devem ser persistidos fora do navegador; `sessionStorage/localStorage` sozinho não é suficiente para geração real do Dossiê.
   - A primeira versão local do juiz externo foi iniciada em `tools/dossier-motor/`, com:
     - `engine.mjs` para a lógica pura;
     - `server.mjs` para a fronteira HTTP `/decide`;
     - `test.mjs` para regras mínimas automatizadas.
     - `qa-dossier-motor-cdp.mjs` para smoke test ponta a ponta com browser.
     - `qa-dossier-motor-real-intake-cdp.mjs` para smoke test do fluxo real sem depender do stub global.
   - No MVP atual, `requires_human_review` existe apenas como flag interna de auditoria.
     - não abre rota `manual_review`;
     - não cria CTA própria;
     - não substitui `Lite`, `Completo`, `Recusa` ou `Faltam dados`.

5. **Emails**
   - Alemanha: rota habilitada para disparo.
   - Austrália: Jonathan indicou em 2026-07-07 que a rota já estava aprovada. No `index.html` local, AU foi habilitada como `approved_local_needs_qa_before_publish`. Antes de publicar, ainda precisa de teste controlado de disparo, checagem de links e validação de que CTAs ausentes não aparecem.

6. **Produtos e partners**
   - Links atuais vivem em `APP_CONFIG.links`.
   - Placeholders vazios não devem renderizar CTA futuro como se já existisse produto.

## Caminho futuro para Plataforma EM

Quando migrar para Next.js/Supabase/Vercel:

- mover `APP_CONFIG` para variáveis de ambiente públicas e/ou tabela `app_config`;
- mover scoring para função compartilhada (`lib/cia/scoring.ts`);
- mover textos/insights para CMS ou tabela versionada;
- manter `lead_id` como chave pública e criar `user_id` apenas quando houver conta;
- criar módulos conectados: CV Builder, Carta, LinkedIn, Entrevista;
- manter eventos agregados para inteligência de produto sem expor PII.

## Guardrails técnicos

- Nunca expor chave Brevo ou Supabase service role no frontend.
- Supabase só com anon key + RLS.
- O motor do dossiê não deve nascer dentro do `index.html`; o app só consome a decisão quando ela existir.
- Não prometer emprego, visto, assessoria jurídica/imigratória ou mentoria paga pré-PR.
- Não chamar dados identificáveis de anônimos.
- Para análises agregadas, remover nome, email, telefone e links pessoais.
