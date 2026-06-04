# CIA App — Arquitetura técnica

Status: em desenvolvimento
Versão base: `index.html` estático no GitHub Pages

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
   - `lead_id` público é gerado no navegador para conectar lead, resultado, eventos, NPS e cliques.

4. **Emails**
   - Alemanha: rota habilitada para disparo.
   - Austrália: rota mantida como plugin pendente de revisão (`plugin_pending_review`). O lead ainda é salvo/adicionado ao contato, mas a sequência de emails AU não dispara até aprovação.

5. **Produtos e partners**
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
- Não prometer emprego, visto, assessoria jurídica/imigratória ou mentoria paga pré-PR.
- Não chamar dados identificáveis de anônimos.
- Para análises agregadas, remover nome, email, telefone e links pessoais.
