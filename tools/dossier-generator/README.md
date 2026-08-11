## Dossier Generator Test Kit

Este kit pluga o pacote recebido do Jonathan na esteira atual do CIA App sem misturar etapas.

Ele cobre a parte final da automacao:

1. intake estruturado do dossie
2. prompt portavel para gerar JSON estruturado
3. template visual do dossie
4. render HTML
5. export PDF local via Chromium

Nao cobre:

- decisao Lite/Completo/Recusa do motor
- pagamento
- upload real de CV
- chamada real de API
- entrega automatica para o lead

## Como isso entra na arquitetura atual

Fluxo certo:

1. CIA App calcula score e coleta lead
2. Dossier Motor decide `Lite`, `Completo`, `Recusa` ou `Faltam dados`
3. Se a decisao permitir avancar, o usuario preenche o intake deste kit
4. O CV entra como parse estruturado
5. Um modelo gera JSON final do dossie
6. Este kit renderiza HTML/PDF para teste ou entrega controlada

Importante:

- o `schema-questionario-estrategico-complementar.json` atual continua sendo a triagem curta antes da decisao do motor
- o `intake-schema.json` deste diretório pertence a etapa posterior de geracao do dossie

## Arquivos

- `intake-schema.json` -> schema do intake aprofundado
- `system-prompt.md` -> prompt portavel para gerar o JSON do dossie
- `dossie-template.html` -> template visual base
- `sample-intake.json` -> fixture de intake para teste
- `sample-output.json` -> fixture do JSON final do dossie
- `render-html.mjs` -> transforma JSON final em HTML
- `export-pdf.mjs` -> transforma HTML em PDF via Chromium
- `run-local-test.mjs` -> pipeline local de teste

## Teste rapido

Gerar HTML:

```bash
node tools/dossier-generator/run-local-test.mjs
```

Gerar HTML e PDF:

```bash
node tools/dossier-generator/run-local-test.mjs --pdf
```

Arquivos de saida:

- `tmp/dossier-generator-test/dossie.html`
- `tmp/dossier-generator-test/dossie.pdf` quando `--pdf` for usado

## Como rodar com output real do modelo

1. Monte um JSON de intake seguindo `intake-schema.json`
2. Parseie o CV para JSON separado
3. Envie para o modelo usando o prompt em `system-prompt.md`
4. Salve o output do modelo como `output.json`
5. Rode:

```bash
node tools/dossier-generator/render-html.mjs \
  --input /abs/path/output.json \
  --output /abs/path/dossie.html
```

6. Se quiser PDF:

```bash
node tools/dossier-generator/export-pdf.mjs \
  --input /abs/path/dossie.html \
  --output /abs/path/dossie.pdf
```

## Implementacao recomendada no produto

Menor caminho util:

1. manter o motor atual como gate comercial
2. usar este intake so depois de `Lite` ou `Completo`
3. primeiro entregar `HTML -> PDF` com revisao manual sua
4. so depois automatizar envio por email/WhatsApp
