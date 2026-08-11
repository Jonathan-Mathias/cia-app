# Dossier Motor — MVP Architecture

Status: draft implementado localmente
Branch: `feat/dossier-motor-foundation`

## Objetivo

Criar o menor "juiz externo" viável para o CIA App sem jogar a lógica do dossiê dentro do `index.html`.

## Ideia simples

Hoje:

- o CIA App calcula score
- o CIA App decide o CTA

MVP do motor:

- o CIA App continua sendo a porta de entrada
- um serviço separado recebe os dados relevantes
- esse serviço devolve uma decisão padronizada
- o CIA App obedece essa decisão quando ela existir

## Arquitetura mínima recomendada

### 1. Frontend atual

Arquivo: `index.html`

Responsabilidade:

- coletar respostas
- calcular score/banda
- capturar lead
- renderizar resultado
- usar fallback por score quando não houver decisão externa

### 2. Motor puro

Arquivo:

- `tools/dossier-motor/engine.mjs`
- `tools/dossier-motor/schema-questionario-estrategico-complementar.json`
- `tools/dossier-motor/questionnaire-contract.mjs`

Responsabilidade:

- receber payload normalizado
- validar o contrato estrutural do questionário complementar quando ele existir
- aplicar regras
- devolver `Lite`, `Completo`, `Recusa` ou `Faltam dados`

Vantagem:

- testável sem browser
- reaproveitável em CLI, worker ou backend real

### 3. Adaptador HTTP mínimo

Arquivo:

- `tools/dossier-motor/server.mjs`

Responsabilidade:

- expor endpoint local `/decide`
- receber JSON via `POST`
- chamar o motor
- devolver payload de decisão

Vantagem:

- prova a fronteira app ↔ motor
- permite teste real por HTTP

### 4. Testes

Arquivo:

- `tools/dossier-motor/test.mjs`

Responsabilidade:

- validar regras principais
- evitar regressão silenciosa

## Fluxo do MVP

1. pessoa faz o CIA App
2. app calcula score e coleta dados básicos
3. app ou etapa seguinte envia payload para `/decide`
4. motor responde:
   - `status`
   - `recommended_offer`
   - `payment_eligibility`
   - `next_step`
   - listas de `required`, `warning`, `blocking`
5. app usa essa decisão para mostrar o próximo passo correto

## Regra operacional do MVP atual

`requires_human_review` não abre um fluxo separado nesta fase.

No MVP atual ele serve apenas para:

- auditoria;
- leitura de risco;
- futura revisão humana quando isso realmente virar operação.

Ou seja:

- o motor continua devolvendo `Lite`, `Completo`, `Recusa` ou `Faltam dados`;
- o app continua obedecendo `next_step` normal;
- não existe rota `manual_review` ativa no release candidate atual.

## O que não entra nesta versão

- autenticação
- banco
- deploy cloud
- upload real de CV
- fetch ligado no frontend em produção
- preço
- pagamento

## Por que esta é a ordem certa

Porque ela cria:

- uma verdade única para a decisão do dossiê
- uma base testável
- uma fronteira limpa entre app e lógica
- um caminho de crescimento sem refazer o MVP todo depois

## Próximo passo depois desta fundação

1. ligar o app a esse endpoint local ou ambiente controlado
2. definir o payload real de entrada com score + questionário + CV/processamento
3. testar cenários reais
4. só depois pensar em deploy
