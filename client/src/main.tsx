/**
 * Client entry point (IP-8010). Connects a real browser WebSocket (which already satisfies
 * GameClient's SocketLike interface) to the server -- but no package yet bootstraps a real
 * WebSocketServer to connect to (BL-0038), so this path is exercised in tests via a fake
 * connection, not yet end-to-end in a browser against a running server.
 */
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { GameClient, type SocketLike } from './state/gameClient.js';

/** Adapts a native browser WebSocket to GameClient's SocketLike interface via addEventListener,
 *  since WebSocket's own onmessage/onclose setter types are wider than SocketLike's. */
function adaptWebSocket(ws: WebSocket): SocketLike {
  let messageCb: ((ev: { data: string }) => void) | null = null;
  let closeCb: (() => void) | null = null;
  ws.addEventListener('message', (ev) => messageCb?.({ data: String(ev.data) }));
  ws.addEventListener('close', () => closeCb?.());
  return {
    send: (data: string) => ws.send(data),
    set onmessage(cb: ((ev: { data: string }) => void) | null) { messageCb = cb; },
    set onclose(cb: (() => void) | null) { closeCb = cb; },
  };
}

const container = document.getElementById('root');
if (container) {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId') ?? '';
  const socket = new WebSocket(`ws://${window.location.host}/ws?sessionId=${sessionId}`);
  const client = new GameClient(adaptWebSocket(socket));
  createRoot(container).render(<App client={client} sessionId={sessionId} />);
}
