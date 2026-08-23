/**
 * Client entry point (IP-8010, extended by IP-9038 closing BL-0038/BL-0055). Shows Landing until
 * a sessionId+playerId are known (from the URL, or from creating/joining a game), then connects a
 * real browser WebSocket and renders App.
 */
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { Landing } from './components/Landing.js';
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

function initialParams(): { sessionId: string; playerId: string } | null {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  const playerId = params.get('playerId');
  return sessionId && playerId ? { sessionId, playerId } : null;
}

function Root() {
  const [entered, setEntered] = useState(initialParams);

  const client = useMemo(() => {
    if (!entered) return null;
    const socket = new WebSocket(
      `ws://${window.location.host}/ws?sessionId=${entered.sessionId}&playerId=${entered.playerId}`
    );
    return new GameClient(adaptWebSocket(socket));
  }, [entered]);

  if (!entered || !client) {
    return (
      <Landing
        onEnter={(sessionId, playerId) => {
          const url = new URL(window.location.href);
          url.searchParams.set('sessionId', sessionId);
          url.searchParams.set('playerId', playerId);
          window.history.pushState({}, '', url);
          setEntered({ sessionId, playerId });
        }}
      />
    );
  }

  return <App client={client} sessionId={entered.sessionId} />;
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<Root />);
}
