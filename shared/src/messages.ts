/**
 * WebSocket message schema, transcribed from GDS-09 (docs/architecture/09-interface-specification.md),
 * extended 2026-08-22 by FS-107 with DisconnectNotification/DisconnectResponse.
 */

import type { Action, ActionResult } from './interfaces.js';
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

export type ClientToServerMessage = ActionMessage | DisconnectResponse;
export type ServerToClientMessage =
  | StateDeltaMessage
  | RejectedActionMessage
  | DisconnectNotification;

export type { ActionResult };
