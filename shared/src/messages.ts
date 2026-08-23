/**
 * WebSocket message schema, transcribed from GDS-09 (docs/architecture/09-interface-specification.md),
 * extended 2026-08-22 by FS-107 with DisconnectNotification/DisconnectResponse.
 */

import type { Action, ActionResult, AssetTemplate } from './interfaces.js';
import type { EventRecord, OpponentView, PlayerId, PlayerState, SessionId } from './types.js';

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

/**
 * BL-0048 (VR-8010 remediation): sent once per connection (not on every StateDeltaMessage) —
 * template data is static and identical for both players, so there's no per-recipient
 * computation, just a one-shot delivery of what AssetTray needs to render cost/time-to-online.
 */
export interface TemplateCatalogMessage {
  type: 'template-catalog';
  templates: AssetTemplate[];
}

export type ClientToServerMessage = ActionMessage | DisconnectResponse;
export type ServerToClientMessage =
  | StateDeltaMessage
  | RejectedActionMessage
  | DisconnectNotification
  | TemplateCatalogMessage;

export type { ActionResult };
