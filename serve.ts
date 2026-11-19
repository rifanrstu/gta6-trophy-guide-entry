// serve.ts — a tiny static server for trying the guide locally.
// Serves this repository's app/ folder and nothing else:
//   node serve.ts            (then open http://localhost:8917)
//   PORT=9000 node serve.ts  (a different port)
// Standard library only, no build step, and the app it serves needs no
// network beyond this server: every file it loads lives under app/.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const appDir = join(rootDir, 'app');
const port = Number(process.env.PORT ?? 8917);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const filePath = normalize(join(appDir, rel));
    if (!filePath.startsWith(appDir)) {
      res.writeHead(403).end('outside the app folder');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': TYPES[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not in the app folder');
  }
});

server.listen(port, () => {
  console.log(`Dusk Ledger is open at http://localhost:${port}`);
});
