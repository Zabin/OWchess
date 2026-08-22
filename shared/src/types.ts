/**
 * Core entity shapes, transcribed from GDS-07 (docs/architecture/07-data-model.md).
 * In-memory, per-session only — nothing here persists past a session (GDS-02).
 */

export type PlayerId = string;
export type SessionId = string;
export type AssetId = string;
export type MissionSetId = string;
export type TemplateId = string;

/** R-203's 9-value recommended taxonomy (3 altitude bands x 3 plane classes). */
export type OrbitalRegimeLabel =
  | 'LEO-EQUATORIAL'
  | 'LEO-PROGRADE'
  | 'LEO-POLAR'
  | 'MEO-EQUATORIAL'
  | 'MEO-PROGRADE'
  | 'MEO-POLAR'
  | 'GEO-EQUATORIAL'
  | 'GEO-PROGRADE'
  | 'GEO-POLAR';

/** Find-Fix-Track-Target-Engage chain steps an asset's sensor/effector role can perform. */
export type ChainRole = 'find' | 'fix' | 'track' | 'target' | 'engage';

export type BeliefPrecision = 'find' | 'fix' | 'track' | 'target';

export interface ManeuverState {
  targetRegime: OrbitalRegimeLabel;
  turnsRemaining: number;
}

export interface DeployState {
  turnsUntilOnline: number;
}

export type EffectKind = 'disrupt' | 'deny' | 'degrade';

export interface EffectStateEntry {
  kind: EffectKind;
  appliedTurn: number;
  durationTurns: number | 'until-cleared';
  /** Only meaningful for 'degrade' (FR-4004); always 1 for disrupt/deny. */
  stackCount: number;
  sourceEffectorAssetId: AssetId;
}

export interface Asset {
  assetId: AssetId;
  ownerId: PlayerId;
  templateId: TemplateId;
  basing: 'ground' | 'space';
  chainRoles: ChainRole[];
  trueRegime: OrbitalRegimeLabel;
  maneuverState: ManeuverState | null;
  deployState: DeployState | null;
  activeEffects: EffectStateEntry[];
  isKing: boolean;
  missionSet: MissionSetId | null;
  /** BL-0015: stored, not recomputed from activeEffects — King-only, meaningful iff isKing. */
  consecutiveDenialTurns: number;
  /**
   * Lifetime cumulative denial-turns, for FR-1420's timeout/tiebreak rule — distinct from
   * consecutiveDenialTurns (which resets on a clean turn). King-only. Added during IP-1010
   * (win-condition checks needed it; not in GDS-07's original text — see IP-1010's Documentation
   * Updates note and BL-0021).
   */
  totalDenialTurns: number;
  /** Destroy removes the asset from play (GDS-07 §Asset: "or marks it destroyed"). */
  destroyed: boolean;
}

export interface BeliefStateEntry {
  subject: AssetId | `unknown-contact-${number}`;
  precision: BeliefPrecision;
  lastUpdatedTurn: number;
  sourceAssetId: AssetId;
  deceived: boolean;
  /** Present once precision reaches at least 'fix'; null at 'find'. */
  apparentRegime: OrbitalRegimeLabel | null;
}

export interface PlayerState {
  playerId: PlayerId;
  king: Asset;
  assets: Asset[];
  apRemaining: number;
  /** Derived/recomputed by BeliefState, never independently authoritative (GDS-04). */
  beliefOfOpponent: Map<AssetId | 'unknown', BeliefStateEntry>;
}

/** The structurally distinct, client-bound shape — never PlayerState (GDS-06/07). */
export interface OpponentView {
  playerId: PlayerId;
  beliefEntries: BeliefStateEntry[];
}

export interface EventRecord {
  turnNumber: number;
  actingPlayerId: PlayerId;
  actionType: string;
  payload: Record<string, unknown>;
  stateDeltaSummary: string;
}

export type SessionPhase = 'deploying' | 'active' | 'ended';

export interface SessionState {
  sessionId: SessionId;
  players: [PlayerState, PlayerState];
  activeTurn: PlayerId;
  turnNumber: number;
  eventLog: EventRecord[];
  phase: SessionPhase;
}
