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

### 3. Emails
- [ ] Alemanha dispara contato + sequência conforme banda.
- [ ] Austrália NÃO dispara sequência enquanto `APP_CONFIG.email.routes.au.enabled=false`.
- [ ] Austrália registra `email_plugin_pending` para revisão posterior.
- [ ] Nenhum email expõe chave Brevo no frontend.
- [ ] Links vazios de parceiros/produtos não aparecem como CTA ativo.

### 4. Dados e Supabase
- [ ] `lead_id` é gerado antes de salvar lead/resultado.
- [ ] Payload de lead contém nome, email, WhatsApp, rota, score, banda e dimensões.
- [ ] Payload de resultado contém answers/counters/alerts/insights.
- [ ] Supabase desligado não quebra fluxo.
- [ ] Com Supabase ligado, inserts usam anon key + RLS e não exigem service role.

### 5. Privacidade e segurança
- [ ] Copy não chama dados identificáveis de anônimos.
- [ ] Aviso educacional aparece antes do resultado e no resultado.
- [ ] Inputs reaproveitados no DOM são escapados.
- [ ] Nenhum token secreto está no `index.html`.
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
