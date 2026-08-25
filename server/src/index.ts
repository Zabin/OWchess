/**
 * Server entry point (IP-9038, closes BL-0038) — the real bootstrap: an HTTP server exposing the
 * session create/join API, static serving of the built client, and a WebSocket upgrade handler
 * wired to the already-VERIFIED transport (IP-7010). One process, one shared createGameEngine()
 * context for its lifetime (NFR-6100: no database, in-memory per-session state).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createGameEngine } from './engine/createGameEngine.js';
import { createTransport } from './transport/websocketServer.js';
import type { Connection } from './transport/connectionRegistry.js';
import { handleCreateSession, handleJoinSession } from './http/sessionApi.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIST = join(__dirname, '..', '..', 'client', 'dist');
const PORT = Number(process.env.PORT ?? 3000);

const ctx = createGameEngine();
const transport = createTransport(ctx.store, ctx.engine, ctx.beliefState, ctx.registry);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

async function serveStatic(urlPath: string): Promise<{ status: number; contentType: string; body: Buffer | string }> {
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(CLIENT_DIST, safePath === '/' ? 'index.html' : safePath);
  const filePath = existsSync(candidate) && candidate.startsWith(CLIENT_DIST)
    ? candidate
    : join(CLIENT_DIST, 'index.html'); // SPA fallback for any non-file path
  try {
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';
    return { status: 200, contentType, body };
  } catch {
    return { status: 404, contentType: 'text/plain', body: 'Not found' };
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/sessions') {
    const result = handleCreateSession(ctx.store);
    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
    return;
  }

  const joinMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/join$/);
  if (req.method === 'POST' && joinMatch) {
    const result = handleJoinSession(ctx.store, joinMatch[1]);
    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
    return;
  }

  if (req.method === 'GET') {
    serveStatic(url.pathname).then(({ status, contentType, body }) => {
      res.writeHead(status, { 'Content-Type': contentType });
      res.end(body);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  const sessionId = url.searchParams.get('sessionId');
  const playerId = url.searchParams.get('playerId');
  if (!sessionId || !playerId) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\nmissing sessionId/playerId');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    const conn: Connection = {
      send: (data: string) => ws.send(data),
      onMessage: (cb: (data: string) => void) => ws.on('message', (raw) => cb(raw.toString())),
      onClose: (cb: () => void) => ws.on('close', cb),
    };
    transport.handleConnection(sessionId, playerId, conn);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`OW Chess server listening on http://localhost:${PORT}`);
});
