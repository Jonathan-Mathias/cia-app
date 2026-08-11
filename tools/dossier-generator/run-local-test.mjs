import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const shouldExportPdf = process.argv.includes('--pdf');
const root = path.resolve(new URL('.', import.meta.url).pathname);
const outDir = path.resolve(root, '../../tmp/dossier-generator-test');
const input = path.join(root, 'sample-output.json');
const html = path.join(outDir, 'dossie.html');
const pdf = path.join(outDir, 'dossie.pdf');

mkdirSync(outDir, { recursive: true });

const render = spawnSync('node', [path.join(root, 'render-html.mjs'), '--input', input, '--output', html], {
  stdio: 'inherit'
});

if (render.status !== 0) process.exit(render.status || 1);

if (shouldExportPdf) {
  const exportPdf = spawnSync('node', [path.join(root, 'export-pdf.mjs'), '--input', html, '--output', pdf], {
    stdio: 'inherit'
  });
  if (exportPdf.status !== 0) process.exit(exportPdf.status || 1);
}

console.log(`test output directory: ${outDir}`);
