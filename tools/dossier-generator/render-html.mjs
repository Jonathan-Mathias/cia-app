import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--input') args.input = argv[++i];
    else if (item === '--output') args.output = argv[++i];
  }
  return args;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderParagraphs(items) {
  return (items || []).map(item => `<p>${escapeHtml(item)}</p>`).join('\n');
}

function renderDifferentials(items) {
  return (items || []).map(item => `<p><strong>${escapeHtml(item)}</strong></p>`).join('\n');
}

function renderContradictions(section) {
  if (section?.tem_contradicao) {
    return (section.contradicoes || [])
      .map(
        item => `<div class="contradicao">
  <div class="titulo">${escapeHtml(item.titulo)}</div>
  <p>${escapeHtml(item.texto)}</p>
</div>`
      )
      .join('\n');
  }
  return `<p>${escapeHtml(section?.texto_se_sem_contradicao || '')}</p>`;
}

function renderAxes(items) {
  return (items || [])
    .map(item => `<p><strong>${escapeHtml(item.nome)}:</strong> ${escapeHtml(item.texto)}</p>`)
    .join('\n');
}

function renderTracks(items) {
  return (items || [])
    .map(
      item => `<p><strong>${escapeHtml(item.nome)} · ${escapeHtml(item.prioridade)}</strong><br>${escapeHtml(item.texto)}</p>`
    )
    .join('\n');
}

function renderSalaryRows(items) {
  return (items || [])
    .map(
      item => `<tr><td>${escapeHtml(item.posicao)}</td><td>${escapeHtml(item.junior)}</td><td>${escapeHtml(item.pleno_senior)}</td><td>${escapeHtml(item.lideranca)}</td></tr>`
    )
    .join('\n');
}

function renderPaths(items) {
  return (items || [])
    .map(item => `<p><strong>${escapeHtml(item.titulo)}</strong><br>${escapeHtml(item.texto)}</p>`)
    .join('\n');
}

function renderSteps(items) {
  return (items || [])
    .map(
      item => `<li><span class="numero">${escapeHtml(item.numero)}</span><span>${escapeHtml(item.texto)}</span></li>`
    )
    .join('\n');
}

function getTemplateStyle(templateHtml) {
  const match = templateHtml.match(/<style>([\s\S]*?)<\/style>/i);
  if (!match) throw new Error('template style block not found');
  return match[1];
}

function renderDocument(data, style) {
  const countries = Array.isArray(data?.cliente?.paises_alvo) ? data.cliente.paises_alvo.join(', ') : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dossie Elite Migration</title>
<style>
${style}
</style>
</head>
<body>
<div class="page capa">
  <div class="eyebrow">Elite Migration · Dossie Estrategico</div>
  <h1>${escapeHtml(data?.cliente?.nome)}</h1>
  <div class="subtitulo">${escapeHtml(data?.cliente?.area)} · Leitura de posicionamento para ${escapeHtml(countries)}</div>
  <div class="rodape-capa">Preparado por Jonathan Mathias · Confidencial</div>
</div>

<div class="page">
  <div class="secao-header"><span>Diagnostico do Perfil</span><span>01/06</span></div>
  <blockquote>${escapeHtml(data?.secao_01_diagnostico?.citacao_abertura)}</blockquote>
  ${renderParagraphs(data?.secao_01_diagnostico?.paragrafos)}
  ${renderDifferentials(data?.secao_01_diagnostico?.diferenciais)}
  <div class="rodape-secao">Elite Migration · Reposicionamento de Carreira Internacional</div>
</div>

<div class="page">
  <div class="secao-header"><span>O Ponto Cego</span><span>02/06</span></div>
  ${renderContradictions(data?.secao_02_ponto_cego)}
  <div class="rodape-secao">Elite Migration · Reposicionamento de Carreira Internacional</div>
</div>

<div class="page">
  <div class="secao-header"><span>Identidade de Valor</span><span>03/06</span></div>
  <blockquote>${escapeHtml(data?.secao_03_identidade_valor?.proposta_central)}</blockquote>
  ${renderAxes(data?.secao_03_identidade_valor?.eixos)}
  <div class="rodape-secao">Elite Migration · Reposicionamento de Carreira Internacional</div>
</div>

<div class="page">
  <div class="secao-header"><span>Posicionamento de Mercado</span><span>04/06</span></div>
  ${renderTracks(data?.secao_04_posicionamento_mercado?.trilhas)}
  <table class="salarial">
    <tr><th>Posicao</th><th>Junior</th><th>Pleno/Senior</th><th>Lideranca</th></tr>
    ${renderSalaryRows(data?.secao_04_posicionamento_mercado?.tabela_salarial)}
  </table>
  <p class="fonte-salarial">${escapeHtml(data?.secao_04_posicionamento_mercado?.fonte_salarial)}</p>
  <div class="rodape-secao">Elite Migration · Reposicionamento de Carreira Internacional</div>
</div>

<div class="page">
  <div class="secao-header"><span>Rota de Visto e Entrada</span><span>05/06</span></div>
  ${renderPaths(data?.secao_05_rota_visto?.caminhos)}
  <p class="fonte-salarial">${escapeHtml(data?.secao_05_rota_visto?.aviso_legal)}</p>
  <div class="rodape-secao">Elite Migration · Reposicionamento de Carreira Internacional</div>
</div>

<div class="page">
  <div class="secao-header"><span>Arquitetura de Candidatura</span><span>06/06</span></div>
  <ol class="passos">
    ${renderSteps(data?.secao_06_arquitetura_candidatura?.passos)}
  </ol>
  <div class="rodape-secao">Trabalhar fora nao deveria ser um salto no escuro. Deveria ser uma decisao estrategica.</div>
</div>
</body>
</html>`;
}

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.output) {
  console.error('usage: node render-html.mjs --input /abs/path/output.json --output /abs/path/dossie.html');
  process.exit(1);
}

const data = JSON.parse(readFileSync(args.input, 'utf8'));
const templatePath = new URL('./dossie-template.html', import.meta.url);
const style = getTemplateStyle(readFileSync(templatePath, 'utf8'));
const html = renderDocument(data, style);
mkdirSync(path.dirname(args.output), { recursive: true });
writeFileSync(args.output, html, 'utf8');
console.log(`html generated at ${args.output}`);
