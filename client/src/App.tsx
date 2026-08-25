/**
 * App (IP-8010; extended by IP-9062/BL-0062) — composes all six GDS-08 panels from GameClient's
 * state. Initial render and reconnect use the same code path: both arrive as a full
 * StateDeltaMessage GameClient turns into this same `state`, so there is no separate "resume"
 * branch (FS-108 W1's stated contract).
 *
 * IP-9062 closes BL-0062: Maneuver/Task/Engage previously sent an empty `payload` (structurally
 * unable to succeed, since the server requires specific targeting fields) — clicking one of
 * those three Action Menu buttons now opens the matching picker instead of submitting directly;
 * the action is only sent once the picker's selection is complete. Deploy already has its own
 * dedicated selection flow via the Asset Tray (which now also collects a target regime, per
 * AssetTray's own IP-9062 update) — the Action Menu's Deploy button intentionally does not
 * duplicate that flow, so it is a deliberate no-op here rather than another empty-payload send.
 */
import { useEffect, useState } from 'react';
import type { FiveDsEffect, OrbitalRegimeLabel } from '@owchess/shared';
import type { GameClient, GameClientState } from './state/gameClient.js';
import type { ActionKind } from './legality/legalityPreFilter.js';
import { OrbitalBoard } from './components/OrbitalBoard.js';
import { ActionMenu } from './components/ActionMenu.js';
import { AssetTray } from './components/AssetTray.js';
import { MissionKingStatus } from './components/MissionKingStatus.js';
import { IntelPanel } from './components/IntelPanel.js';
import { EventLog } from './components/EventLog.js';
import { ManeuverPicker } from './components/ManeuverPicker.js';
import { TaskPicker } from './components/TaskPicker.js';
import { EngagePicker } from './components/EngagePicker.js';

export interface AppProps {
  client: GameClient;
  sessionId: string;
}

type TargetingPicker = 'maneuver' | 'task' | 'engage';

export function App({ client, sessionId }: AppProps) {
  const [state, setState] = useState<GameClientState>(client.getState());
  const [openPicker, setOpenPicker] = useState<TargetingPicker | null>(null);

  useEffect(() => client.subscribe(setState), [client]);

  if (state.connectivity === 'self-disconnected') {
    return <div data-testid="connectivity-lost">Connection lost — reconnecting…</div>;
  }

  if (!state.ownState || !state.opponentView || !state.activeTurn) {
    return <div data-testid="waiting-for-session">Waiting for session…</div>;
  }

  const { ownState, opponentView, activeTurn, deployableTemplates } = state;

  function handleAction(kind: ActionKind) {
    if (kind === 'pass') {
      client.sendAction(sessionId, { type: 'pass', payload: {} });
    } else if (kind === 'deploy') {
      // Deploy is driven entirely through the Asset Tray below (per-template AP cost/online-time
      // context it already shows) — nothing to open here.
    } else {
      setOpenPicker(kind);
    }
  }

  function closePicker() {
    setOpenPicker(null);
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
      {openPicker === 'maneuver' && (
        <ManeuverPicker
          ownState={ownState}
          onSubmit={(assetId: string, targetRegime: OrbitalRegimeLabel) => {
            client.sendAction(sessionId, { type: 'maneuver', payload: { assetId, targetRegime } });
            closePicker();
          }}
          onCancel={closePicker}
        />
      )}
      {openPicker === 'task' && (
        <TaskPicker
          ownState={ownState}
          onSubmit={(sourceAssetId: string, targetRegime: OrbitalRegimeLabel) => {
            client.sendAction(sessionId, { type: 'task', payload: { sourceAssetId, targetRegime } });
            closePicker();
          }}
          onCancel={closePicker}
        />
      )}
      {openPicker === 'engage' && (
        <EngagePicker
          ownState={ownState}
          opponentView={opponentView}
          templates={deployableTemplates}
          onSubmit={(effectorAssetId: string, targetAssetId: string, effect: FiveDsEffect) => {
            client.sendAction(sessionId, { type: 'engage', payload: { effectorAssetId, targetAssetId, effect } });
            closePicker();
          }}
          onCancel={closePicker}
        />
      )}
      <AssetTray
        ownState={ownState}
        templates={deployableTemplates}
        onDeploy={(templateId, targetRegime) =>
          client.sendAction(sessionId, { type: 'deploy', payload: { templateId, targetRegime } })
        }
      />
      <MissionKingStatus ownState={ownState} activeTurn={activeTurn} />
      <IntelPanel opponentView={opponentView} />
      <EventLog eventLog={state.eventLog} />
    </div>
  );
}
