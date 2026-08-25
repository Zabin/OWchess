/**
 * GameClient (IP-8010) — WebSocket connection + client-local UI state. Never computes game truth
 * or belief-state itself (GDS-02's client-architecture constraint): every field here is either
 * directly what the server sent, or a client-local UI convenience (connectivity banner state).
 */
import type {
  Action,
  AssetTemplate,
  DeploymentStatusMessage,
  DisconnectResponse,
  EventRecord,
  MissionSetId,
  MissionSetTemplate,
  OpponentView,
  OrbitalRegimeLabel,
  PlayerId,
  PlayerState,
  RejectedActionMessage,
  StateDeltaMessage,
  TemplateCatalogMessage,
} from '@owchess/shared';

/** Minimal surface both a real browser WebSocket and a test double satisfy. */
export interface SocketLike {
  send(data: string): void;
  set onmessage(cb: ((ev: { data: string }) => void) | null);
  set onclose(cb: (() => void) | null);
}

export type Connectivity = 'connected' | 'self-disconnected' | 'opponent-disconnected';

export interface GameClientState {
  ownState: PlayerState | null;
  opponentView: OpponentView | null;
  activeTurn: PlayerId | null;
  eventLog: EventRecord[];
  connectivity: Connectivity;
  /** Shown distinctly from a client-pre-filtered "not available" case (FS-108 §Error Handling). */
  lastRejection: string | null;
  /** BL-0048 (VR-8010 remediation): populated once from a TemplateCatalogMessage, persists across
   *  ordinary state-delta pushes (it's static, not per-turn state). */
  deployableTemplates: AssetTemplate[];
  /** IP-9056/BL-0056: populated once from a TemplateCatalogMessage, same lifetime as
   *  deployableTemplates. */
  missionSets: MissionSetTemplate[];
  /** IP-9056/BL-0056: null until a connection is made; never carries either player's actual
   *  selection (FR-1210 secrecy) — only whether each side has submitted. */
  deploymentStatus: { phase: 'deploying' | 'active'; ownDeployed: boolean; opponentDeployed: boolean } | null;
}

type Listener = (state: GameClientState) => void;

export class GameClient {
  private state: GameClientState = {
    ownState: null,
    opponentView: null,
    activeTurn: null,
    eventLog: [],
    connectivity: 'connected',
    lastRejection: null,
    deployableTemplates: [],
    missionSets: [],
    deploymentStatus: null,
  };
  private listeners = new Set<Listener>();

  constructor(private readonly socket: SocketLike) {
    this.socket.onmessage = (ev) => this.handleMessage(ev.data);
    this.socket.onclose = () => this.handleClose();
  }

  getState(): GameClientState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }

  private handleMessage(raw: string): void {
    const msg = JSON.parse(raw) as
      | StateDeltaMessage
      | RejectedActionMessage
      | TemplateCatalogMessage
      | DeploymentStatusMessage
      | { type: 'disconnect-notification' };

    if (msg.type === 'template-catalog') {
      this.state = { ...this.state, deployableTemplates: msg.templates, missionSets: msg.missionSets };
    } else if (msg.type === 'deployment-status') {
      this.state = {
        ...this.state,
        deploymentStatus: { phase: msg.phase, ownDeployed: msg.ownDeployed, opponentDeployed: msg.opponentDeployed },
      };
    } else if (msg.type === 'state-delta') {
      this.state = {
        ...this.state,
        ownState: msg.ownState,
        opponentView: msg.opponentView,
        activeTurn: msg.activeTurn,
        eventLog: msg.eventLogEntry ? [...this.state.eventLog, msg.eventLogEntry] : this.state.eventLog,
        connectivity: 'connected', // a state-delta implies the session is live again
        lastRejection: null,
      };
    } else if (msg.type === 'action-rejected') {
      this.state = { ...this.state, lastRejection: msg.reason };
    } else if (msg.type === 'disconnect-notification') {
      this.state = { ...this.state, connectivity: 'opponent-disconnected' };
    }
    this.emit();
  }

  private handleClose(): void {
    this.state = { ...this.state, connectivity: 'self-disconnected' };
    this.emit();
  }

  sendAction(sessionId: string, action: Action): void {
    this.socket.send(JSON.stringify({ type: 'action', sessionId, action }));
  }

  respondToDisconnect(choice: DisconnectResponse['choice']): void {
    this.socket.send(JSON.stringify({ type: 'disconnect-response', choice }));
  }

  /** IP-9056/BL-0056: submits a secret King selection (FR-1210). */
  deployKing(sessionId: string, missionSetId: MissionSetId, regime: OrbitalRegimeLabel): void {
    this.socket.send(JSON.stringify({ type: 'deploy-king', sessionId, missionSetId, regime }));
  }
}
