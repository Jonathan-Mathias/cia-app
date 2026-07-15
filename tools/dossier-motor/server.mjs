import http from 'node:http';
import { decideDossier } from './engine.mjs';

const PORT = Number(process.env.DOSSIER_MOTOR_PORT || 8788);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'dossier-motor', version: 'mvp-local-v1' });
  }

  if (req.method !== 'POST' || req.url !== '/decide') {
    return sendJson(res, 404, { ok: false, error: 'Not found' });
  }

  let raw = '';
  req.on('data', chunk => {
    raw += chunk;
    if (raw.length > 1024 * 1024) {
      req.destroy(new Error('Payload too large'));
    }
  });

  req.on('end', () => {
    try {
      const input = raw ? JSON.parse(raw) : {};
      const decision = decideDossier(input);
      sendJson(res, 200, decision);
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message || 'Invalid JSON payload' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`dossier-motor listening on http://127.0.0.1:${PORT}`);
});
