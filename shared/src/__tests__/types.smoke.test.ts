import { describe, expect, it } from 'vitest';
import type {
  Asset,
  OrbitalRegimeLabel,
  PlayerState,
  SessionState,
} from '../types.js';
import type { GameEngine, Propagator } from '../interfaces.js';
import type { StateDeltaMessage } from '../messages.js';

describe('shared package scaffold', () => {
  it('exposes every GDS-07 entity and GDS-09 interface/message type as real, importable types', () => {
    // Type-only usage — this test's job is to prove the build/import wiring, not runtime logic.
    const regime: OrbitalRegimeLabel = 'LEO-EQUATORIAL';
    const asset: Pick<Asset, 'trueRegime'> = { trueRegime: regime };
    const _player: Pick<PlayerState, 'playerId'> = { playerId: 'p1' };
    const _session: Pick<SessionState, 'phase'> = { phase: 'deploying' };
    const _msgShape: Pick<StateDeltaMessage, 'type'> = { type: 'state-delta' };
    const _propagatorShape: keyof Propagator = 'advance';
    const _engineShape: keyof GameEngine = 'handleAction';

    expect(asset.trueRegime).toBe('LEO-EQUATORIAL');
    expect(_player.playerId).toBe('p1');
    expect(_session.phase).toBe('deploying');
    expect(_msgShape.type).toBe('state-delta');
    expect(_propagatorShape).toBe('advance');
    expect(_engineShape).toBe('handleAction');
  });
});
