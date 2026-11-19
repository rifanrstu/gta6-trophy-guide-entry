// Leonida Ledger — tiny local preview server.
// Serves the app/ folder that sits beside this file so the guide can be
// opened in a desktop browser exactly as a reader would see it. It
// answers files only: no route writes anything, and any path that tries
// to climb out of app/ is refused.

import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "app");
const port = Number(process.env.PORT ?? "8080");

const MIME_BY_EXTENSION: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function resolveInsideApp(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const wanted = decoded === "/" ? "/index.html" : decoded;
  const candidate = normalize(join(appRoot, `.${wanted}`));
  if (!candidate.startsWith(appRoot)) return null;
  return candidate;
}

const server = createServer((request, response) => {
  const filePath = resolveInsideApp(request.url ?? "/");
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not in the ledger\n");
    return;
  }
  const type =
    MIME_BY_EXTENSION[extname(filePath).toLowerCase()] ??
    "application/octet-stream";
  response.writeHead(200, { "content-type": type });
  response.end(readFileSync(filePath));
});

server.listen(port, () => {
  console.log(`Leonida Ledger preview at http://localhost:${port}/`);
});
