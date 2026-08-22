/**
 * Module contracts, transcribed from GDS-09 (docs/architecture/09-interface-specification.md).
 * Interfaces only — no implementations (those belong to their own IP-#### packages).
 */

import type {
  Asset,
  AssetId,
  OrbitalRegimeLabel,
  PlayerId,
  PlayerState,
  OpponentView,
  SessionId,
} from './types.js';

export interface Propagator {
  /** Advances every tracked asset's true orbital state by one turn-tick. */
  advance(assets: Asset[]): void;

  /** Discrete presentation (FR-5002) — never exposes raw elements past this call's return. */
  currentRegime(asset: Asset): OrbitalRegimeLabel;

  /**
   * Begins a maneuver; returns the turn-count (OQ-11: counted in the asset owner's own turns)
   * until it completes, and the fuel-analog cost (FS-104's Maneuver Cost Table).
   */
  planManeuver(
    asset: Asset,
    targetRegime: OrbitalRegimeLabel
  ): { turnsRequired: number; fuelCost: number };

  /** True if an in-progress maneuver has completed this owner-turn-advance. */
  maneuverComplete(asset: Asset): boolean;
}

export interface BeliefState {
  /** The ONLY function permitted to construct client-bound opponent data (GDS-07/08). */
  computeOpponentView(
    observer: PlayerId,
    trueOpponentState: PlayerState,
    turnNumber: number
  ): OpponentView;

  /** Advances precision per the F2T2E chain, gated by the tasking asset's chainRoles ceiling. */
  applyTasking(
    observer: PlayerId,
    sourceAsset: Asset,
    targetRegime: OrbitalRegimeLabel,
    turnNumber: number
  ): void;

  /** Degrades stale entries (FR-2300: 5-turn window; 'find'-level entries removed, not floored). */
  decayStaleEntries(observer: PlayerId, currentTurn: number): void;

  /** Records a Deceive effect's corruption of a specific belief entry (GDS-04/07). */
  applyDeception(observer: PlayerId, subject: AssetId, falseRegime: OrbitalRegimeLabel): void;
}

export type FiveDsEffect = 'deceive' | 'disrupt' | 'deny' | 'degrade' | 'destroy';

export interface EngagementResult {
  effect: FiveDsEffect;
  success: boolean;
  reason?: string;
}

export interface EffectResolver {
  /** Requires targeting-quality data (FR-4002); Destroy removes the asset; Deceive calls
   * BeliefState.applyDeception instead of mutating the target's own true state. */
  resolveEngagement(
    effector: Asset,
    target: Asset,
    effect: FiveDsEffect,
    beliefState: BeliefState
  ): EngagementResult;

  /** Ticks active-effect durations; tracks King denial-streak (FR-4005); handles Degrade stacking. */
  tickActiveEffects(asset: Asset, currentTurn: number): void;
}

export type ActionType = 'deploy' | 'maneuver' | 'task' | 'engage' | 'pass' | 'resign';

export interface Action {
  type: ActionType;
  payload: Record<string, unknown>;
}

export interface TurnManager {
  activePlayer(): PlayerId;
  apRemaining(): number;
  /** Rejects (returns false) any call where actingPlayer !== activePlayer() (FR-1009). */
  submitAction(actingPlayer: PlayerId, action: Action): { accepted: boolean; reason?: string };
  advanceTurn(): void;
}

export type WinReason = 'destruction' | 'denial' | 'resignation' | 'timeout-tiebreak';

export interface WinResult {
  winner: PlayerId | null;
  reason: WinReason;
}

export interface ActionResult {
  accepted: boolean;
  reason?: string;
}

export interface GameEngine {
  /** The single entry point for "an action arrived." */
  handleAction(sessionId: SessionId, actingPlayer: PlayerId, action: Action): ActionResult;

  /** BL-0012: destruction is checked (and returned) before timeout/tiebreak. */
  checkWinConditions(sessionId: SessionId): WinResult | null;
}
