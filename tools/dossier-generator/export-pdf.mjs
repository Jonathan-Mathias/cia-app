import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--input') args.input = argv[++i];
    else if (item === '--output') args.output = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.output) {
  console.error('usage: node export-pdf.mjs --input /abs/path/dossie.html --output /abs/path/dossie.pdf');
  process.exit(1);
}

const chromiumPath = '/usr/bin/chromium';
if (!existsSync(chromiumPath)) {
  console.error('chromium not found at /usr/bin/chromium');
  process.exit(1);
}

mkdirSync(path.dirname(args.output), { recursive: true });
const url = pathToFileURL(path.resolve(args.input)).href;
const result = spawnSync(
  chromiumPath,
  [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${path.resolve(args.output)}`,
    '--no-pdf-header-footer',
    url
  ],
  { stdio: 'pipe', encoding: 'utf8' }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'failed to export pdf');
  process.exit(result.status || 1);
}

console.log(`pdf generated at ${args.output}`);
