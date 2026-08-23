/**
 * WebSocket message schema, transcribed from GDS-09 (docs/architecture/09-interface-specification.md),
 * extended 2026-08-22 by FS-107 with DisconnectNotification/DisconnectResponse.
 */

import type { Action, ActionResult, AssetTemplate, MissionSetTemplate } from './interfaces.js';
import type {
  EventRecord,
  MissionSetId,
  OpponentView,
  OrbitalRegimeLabel,
  PlayerId,
  PlayerState,
  SessionId,
} from './types.js';

// client -> server
export interface ActionMessage {
  type: 'action';
  sessionId: SessionId;
  action: Action;
}

// server -> client (always filtered through BeliefState per-recipient)
export interface StateDeltaMessage {
  type: 'state-delta';
  ownState: PlayerState;
  opponentView: OpponentView;
  activeTurn: PlayerId;
  eventLogEntry?: EventRecord;
}

export interface RejectedActionMessage {
  type: 'action-rejected';
  reason: string;
}

export interface DisconnectNotification {
  type: 'disconnect-notification';
}

export interface DisconnectResponse {
  type: 'disconnect-response';
  choice: 'wait' | 'cancel';
}

/** IP-9056/BL-0056: submits a secret King selection (FR-1210). */
export interface DeployKingMessage {
  type: 'deploy-king';
  sessionId: SessionId;
  missionSetId: MissionSetId;
  regime: OrbitalRegimeLabel;
}

/**
 * IP-9056/BL-0056: sent instead of a StateDeltaMessage while a joined session hasn't reached
 * 'active' yet — never carries either player's actual selection (FR-1210 secrecy), only whether
 * each side has submitted.
 */
export interface DeploymentStatusMessage {
  type: 'deployment-status';
  phase: 'deploying' | 'active';
  ownDeployed: boolean;
  opponentDeployed: boolean;
}

/**
 * BL-0048 (VR-8010 remediation): sent once per connection (not on every StateDeltaMessage) —
 * template data is static and identical for both players, so there's no per-recipient
 * computation, just a one-shot delivery of what AssetTray needs to render cost/time-to-online.
 */
export interface TemplateCatalogMessage {
  type: 'template-catalog';
  templates: AssetTemplate[];
  /** IP-9056/BL-0056: added so KingDeploymentPicker can render real mission-set options. */
  missionSets: MissionSetTemplate[];
}

export type ClientToServerMessage = ActionMessage | DisconnectResponse | DeployKingMessage;
export type ServerToClientMessage =
  | StateDeltaMessage
  | RejectedActionMessage
  | DisconnectNotification
  | TemplateCatalogMessage
  | DeploymentStatusMessage;

export type { ActionResult };
