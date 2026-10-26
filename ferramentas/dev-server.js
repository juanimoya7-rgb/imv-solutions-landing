/**
 * Servidor local que aplica os cabeçalhos reais do vercel.json.
 *
 *   node ferramentas/dev-server.js        → http://localhost:8100
 *
 * Existe por causa da CSP: servir a pasta com um http.server qualquer não
 * manda cabeçalho nenhum, então uma política quebrada só apareceria depois
 * do deploy. Aqui ela aparece antes.
 *
 * upgrade-insecure-requests sai da política em localhost — em http:// ele
 * só geraria ruído. O resto vai igual ao que o Vercel manda.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = Number(process.env.PORT) || 8100;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

function cabecalhosGlobais() {
  const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8'));
  const bloco = (cfg.headers || []).find((b) => b.source === '/(.*)');
  if (!bloco) return [];
  return bloco.headers.map(({ key, value }) => {
    if (key !== 'Content-Security-Policy') return [key, value];
    const limpa = value.split('; ').filter((d) => d !== 'upgrade-insecure-requests');
    return [key, limpa.join('; ')];
  });
}

http.createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';

  // nada de subir para fora da raiz
  const arquivo = path.join(RAIZ, path.normalize(caminho));
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(arquivo, (erro, dados) => {
    // relê o vercel.json a cada request: editar a política não exige reiniciar
    for (const [k, v] of cabecalhosGlobais()) res.setHeader(k, v);

    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado: ' + caminho);
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });
}).listen(PORTA, () => {
  console.log('IMV landing com os cabeçalhos do vercel.json: http://localhost:' + PORTA);
});
