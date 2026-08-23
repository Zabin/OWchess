/**
 * App (IP-8010) — composes all six GDS-08 panels from GameClient's state. Initial render and
 * reconnect use the same code path: both arrive as a full StateDeltaMessage GameClient turns into
 * this same `state`, so there is no separate "resume" branch (FS-108 W1's stated contract).
 */
import { useEffect, useState } from 'react';
import type { GameClient, GameClientState } from './state/gameClient.js';
import type { ActionKind } from './legality/legalityPreFilter.js';
import { OrbitalBoard } from './components/OrbitalBoard.js';
import { ActionMenu } from './components/ActionMenu.js';
import { AssetTray } from './components/AssetTray.js';
import { MissionKingStatus } from './components/MissionKingStatus.js';
import { IntelPanel } from './components/IntelPanel.js';
import { EventLog } from './components/EventLog.js';

export interface AppProps {
  client: GameClient;
  sessionId: string;
}

export function App({ client, sessionId }: AppProps) {
  const [state, setState] = useState<GameClientState>(client.getState());

  useEffect(() => client.subscribe(setState), [client]);

  if (state.connectivity === 'self-disconnected') {
    return <div data-testid="connectivity-lost">Connection lost — reconnecting…</div>;
  }

  if (!state.ownState || !state.opponentView || !state.activeTurn) {
    return <div data-testid="waiting-for-session">Waiting for session…</div>;
  }

  const { ownState, opponentView, activeTurn, deployableTemplates } = state;

  function handleAction(kind: ActionKind) {
    client.sendAction(sessionId, { type: kind, payload: {} });
  }

  return (
    <div className="app" data-testid="app">
      {state.connectivity === 'opponent-disconnected' && (
        <div className="disconnect-banner" data-testid="disconnect-banner">
          Your opponent disconnected.
          <button type="button" onClick={() => client.respondToDisconnect('wait')}>Wait</button>
          <button type="button" onClick={() => client.respondToDisconnect('cancel')}>Cancel</button>
        </div>
      )}
      {state.lastRejection && (
        <div className="rejection-banner" data-testid="rejection-banner">{state.lastRejection}</div>
      )}
      <OrbitalBoard ownState={ownState} opponentView={opponentView} />
      <ActionMenu ownState={ownState} activeTurn={activeTurn} onSelectAction={handleAction} />
      <AssetTray ownState={ownState} templates={deployableTemplates} onDeploy={(templateId) =>
        client.sendAction(sessionId, { type: 'deploy', payload: { templateId } })
      } />
      <MissionKingStatus ownState={ownState} activeTurn={activeTurn} />
      <IntelPanel opponentView={opponentView} />
      <EventLog eventLog={state.eventLog} />
    </div>
  );
}
