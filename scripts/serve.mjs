/**
 * Tiny static file server for local testing. Behaves like GitHub Pages:
 * serves index.html for folders, redirects folders without a trailing
 * slash, returns 404.html for missing files, and can mount the site under
 * a sub-path (--base /toolnest-ultimate/) to test project-site URLs.
 *
 * Usage: node scripts/serve.mjs [--port 5173] [--base /]
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectRoot } from './config.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

export function parseArgs(argv) {
  const args = { port: 5173, base: '/' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') args.port = Number(argv[++i]);
    else if (argv[i] === '--base') args.base = argv[++i];
  }
  if (!args.base.startsWith('/')) args.base = `/${args.base}`;
  if (!args.base.endsWith('/')) args.base += '/';
  return args;
}

async function stat(p) {
  try { return await fs.stat(p); } catch { return null; }
}

export function serve({ root = path.join(projectRoot, 'dist'), port = 5173, base = '/' } = {}) {
  const server = http.createServer(async (req, res) => {
    const send = async (status, file, headers = {}) => {
      const body = await fs.readFile(file);
      res.writeHead(status, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', ...headers });
      res.end(body);
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith(base)) {
        if (url.pathname === '/' || url.pathname === base.slice(0, -1)) {
          res.writeHead(302, { Location: base });
          return res.end();
        }
        return await send(404, path.join(root, '404.html'));
      }
      const rel = decodeURIComponent(url.pathname.slice(base.length));
      const target = path.resolve(root, rel);
      if (target !== root && !target.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      const info = await stat(target);
      if (info && info.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
          return res.end();
        }
        const index = path.join(target, 'index.html');
        if (await stat(index)) return await send(200, index);
      } else if (info) {
        return await send(200, target);
      }
      return await send(404, path.join(root, '404.html'));
    } catch (err) {
      // Every send() is awaited, so file errors (for example while a rebuild
      // swaps dist/) land here instead of crashing the server.
      if (res.headersSent) return res.end();
      const rebuilding = err.code === 'ENOENT';
      res.writeHead(rebuilding ? 503 : 500, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '1' });
      res.end(rebuilding ? 'The site is being rebuilt. Refresh in a moment.' : `Server error: ${err.message}`);
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { port, base } = parseArgs(process.argv.slice(2));
  serve({ port, base }).then(() => console.log(`Serving dist/ at http://localhost:${port}${base}  (Ctrl+C to stop)`));
}
