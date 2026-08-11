# CIA App — QA checklist

## Gate mínimo antes de publicar

### 1. Sanidade técnica
- [ ] `node --check` do JavaScript extraído passa sem erro.
- [ ] App abre localmente sem erro no console.
- [ ] Rota Alemanha completa até resultado.
- [ ] Rota Austrália completa até resultado.
- [ ] Lead gate exige nome completo, email válido, WhatsApp e aceite legal.
- [ ] Refazer avaliação preserva lead sem quebrar score.

### 2. Score e roteamento
- [ ] Score fica sempre entre 0 e 100.
- [ ] Bandas: 0–40 Explorador, 41–65 Em Rota, 66–85 Pronto para Embarcar, 86–100 Elite.
- [ ] Pontuação por dimensão aparece coerente.
- [ ] Alertas não contradizem rota/país.
- [ ] CTA exibido faz sentido para banda e rota.

### 2B. Dossier motor
- [ ] `node tools/dossier-motor/test.mjs` passa.
- [ ] `node tools/dossier-motor/regression-matrix.mjs` passa.
- [ ] Triagem curta respeita `tools/dossier-motor/schema-questionario-estrategico-complementar.json`.
- [ ] `Recusa` bloqueia pagamento nos casos críticos.
- [ ] `Faltam dados` pede complemento uma única vez.
- [ ] `Lite` e `Completo` devolvem `recommended_offer` coerente.
- [ ] `requires_human_review` continua flag passiva, sem abrir rota `manual_review` no MVP.
- [ ] CTA do app obedece a decisão do motor quando houver payload válido.

### 3. Emails
- [ ] Alemanha dispara contato + sequência conforme banda.
- [ ] Austrália NÃO dispara sequência enquanto `APP_CONFIG.email.routes.au.enabled=false`.
- [ ] Austrália registra `email_plugin_pending` para revisão posterior.
- [ ] Nenhum email expõe chave Brevo no frontend.
- [ ] Links vazios de parceiros/produtos não aparecem como CTA ativo.

### 4. Dados e Supabase
- [ ] `session_id` é gerado no carregamento para conectar eventos pré-lead.
- [ ] `lead_id` é gerado antes de salvar lead/resultado.
- [ ] Payload de lead contém `session_id`, nome, email, WhatsApp, rota, score, banda e dimensões.
- [ ] Payload de resultado contém `session_id`, answers/counters/alerts/insights.
- [ ] Payload de intake do Dossiê contém `lead_id`, `route`, `score`, `band` e respostas da triagem curta.
- [ ] Payload de decisão do motor registra `decision_status`, `recommended_offer`, `decision_source` e `lead_id`.
- [ ] Supabase desligado não quebra fluxo.
- [ ] Migration `supabase/migrations/2026-06-23_cia_tracking_foundation.sql` roda sem erro em projeto novo.
- [ ] Migration `supabase/migrations/2026-07-22_dossier_persistence_foundation.sql` roda sem erro em projeto novo.
- [ ] Com Supabase ligado, inserts usam anon key + RLS insert-only e não exigem service role.
- [ ] Pelo menos um insert real foi validado para `cia_dossier_intakes` e `cia_dossier_decisions`.

### 5. Privacidade e segurança
- [ ] Copy não chama dados identificáveis de anônimos.
- [ ] Aviso educacional aparece antes do resultado e no resultado.
- [ ] Inputs reaproveitados no DOM são escapados.
- [ ] Nenhum token secreto está no `index.html`.
- [ ] Política de privacidade aponta para email real de suporte/remoção de dados.
- [ ] Sem promessa de emprego, visto, migração, PR ou mentoria paga antes do PR.

### 6. Responsivo e UX
- [ ] Mobile 360px funciona sem overflow crítico.
- [ ] Desktop/tablet mantém leitura boa.
- [ ] Botões são tocáveis no mobile.
- [ ] Estados de erro são visíveis.
- [ ] Compartilhar/copiar não quebra quando clipboard falha.

### 7. Regressão de conteúdo
- [ ] Alemanha-first continua clara.
- [ ] Austrália aparece como segunda rota/expansão, não como foco principal.
- [ ] Tom continua direto, sério e premium.
- [ ] Não há linguagem de quiz motivacional barato.

## QA automation helper

A repeatable smoke test exists at `tools/qa-cdp.mjs`.

It validates synthetic DE/AU scenarios through the loaded browser page and checks score range, band routing and primary CTA URL presence.

## Gate de teste real controlado

Antes de colocar pessoas reais no fluxo, este pacote mínimo precisa estar fechado:

- [ ] CTA principal do app obedece a regra de produto em todos os casos elegíveis (`score >= 55` => Dossiê como próximo passo principal até decisão final do motor).
- [ ] Supabase está configurado com URL + anon key pública válidos e `APP_CONFIG.integrations.supabase.enabled = true`.
- [ ] Inserts reais de lead, resultado, intake e decisão foram verificados fora do navegador.
- [ ] Política/consentimento apontam para canal real de suporte/privacidade.
- [ ] Waitinglist Elite está implementada ou explicitamente removida do escopo do teste.
- [ ] Se a waitinglist Elite ficar fora do MVP, perfis Elite elegíveis seguem a mesma entrada de Dossiê dos demais casos `score >= 55`.
- [ ] QA manual dos 4 perfis DE e 4 AU foi registrado com evidência.

Se qualquer item acima estiver aberto, o estado correto é `QA/staging forte`, não `MVP pronto para teste real`.
