import { beforeEach, describe, expect, it } from 'vitest';
import type { Asset, PlayerState } from '@owchess/shared';
import { EffectResolver } from '../EffectResolver.js';
import { BeliefState } from '../BeliefState.js';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1',
    ownerId: 'bob',
    templateId: 't1',
    basing: 'space',
    chainRoles: [],
    trueRegime: 'LEO-EQUATORIAL',
    maneuverState: null,
    deployState: null,
    activeEffects: [],
    isKing: false,
    missionSet: null,
    consecutiveDenialTurns: 0,
    totalDenialTurns: 0,
    destroyed: false,
    ...overrides,
  };
}

function makePlayerState(overrides: Partial<PlayerState>): PlayerState {
  return {
    playerId: 'alice',
    king: makeAsset({ assetId: 'alice-king', ownerId: 'alice', isKing: true }),
    assets: [],
    apRemaining: 5,
    beliefOfOpponent: new Map(),
    ...overrides,
  };
}

describe('EffectResolver.resolveEngagement (IP-4010)', () => {
  let resolver: EffectResolver;
  let beliefState: BeliefState;
  let effectorState: PlayerState;
  let effector: Asset;
  let target: Asset;

  beforeEach(() => {
    resolver = new EffectResolver();
    beliefState = new BeliefState();
    effectorState = makePlayerState({ playerId: 'alice' });
    effector = makeAsset({ assetId: 'alice-effector', ownerId: 'alice', chainRoles: ['engage'] });
    target = makeAsset({ assetId: 'bob-king', ownerId: 'bob', isKing: true });
  });

  it('rejects engagement below target-level precision (FR-4002)', () => {
    effectorState.beliefOfOpponent.set('bob-king', {
      subject: 'bob-king',
      precision: 'track',
      lastUpdatedTurn: 1,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-EQUATORIAL',
    });
    const result = resolver.resolveEngagement(effectorState, effector, target, 'destroy', beliefState, 1);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/insufficient targeting-quality/);
    expect(target.destroyed).toBe(false);
  });

  function withTargetPrecision() {
    effectorState.beliefOfOpponent.set('bob-king', {
      subject: 'bob-king',
      precision: 'target',
      lastUpdatedTurn: 1,
      sourceAssetId: 'alice-sensor',
      deceived: false,
      apparentRegime: 'LEO-EQUATORIAL',
    });
  }

  it('Destroy flags the target destroyed', () => {
    withTargetPrecision();
    const result = resolver.resolveEngagement(effectorState, effector, target, 'destroy', beliefState, 2);
    expect(result.success).toBe(true);
    expect(target.destroyed).toBe(true);
  });

  it('Deceive corrupts the effector\'s belief entry, never the target\'s true state', () => {
    withTargetPrecision();
    const result = resolver.resolveEngagement(
      effectorState, effector, target, 'deceive', beliefState, 2, 'GEO-POLAR'
    );
    expect(result.success).toBe(true);
    expect(target.trueRegime).toBe('LEO-EQUATORIAL'); // unchanged
    expect(target.destroyed).toBe(false);
    const entry = effectorState.beliefOfOpponent.get('bob-king')!;
    expect(entry.deceived).toBe(true);
    expect(entry.apparentRegime).toBe('GEO-POLAR');
  });

  it('Disrupt/Deny add a 3-turn EffectStateEntry', () => {
    withTargetPrecision();
    resolver.resolveEngagement(effectorState, effector, target, 'disrupt', beliefState, 2);
    expect(target.activeEffects).toHaveLength(1);
    expect(target.activeEffects[0]).toMatchObject({ kind: 'disrupt', durationTurns: 3, appliedTurn: 2 });
  });

  it('Degrade stacks cumulatively — two applications produce two independent entries', () => {
    withTargetPrecision();
    resolver.resolveEngagement(effectorState, effector, target, 'degrade', beliefState, 2);
    resolver.resolveEngagement(effectorState, effector, target, 'degrade', beliefState, 3);
    const degrades = target.activeEffects.filter((e) => e.kind === 'degrade');
    expect(degrades).toHaveLength(2);
    expect(degrades[0].durationTurns).toBe(4);
  });
});

describe('EffectResolver.tickActiveEffects — denial-streak tracker (IP-4010, BL-0015)', () => {
  let resolver: EffectResolver;
  let king: Asset;

  beforeEach(() => {
    resolver = new EffectResolver();
    king = makeAsset({ assetId: 'bob-king', isKing: true });
  });

  it('increments consecutiveDenialTurns and totalDenialTurns while >=1 qualifying effect is active', () => {
    king.activeEffects.push({
      kind: 'disrupt', appliedTurn: 1, durationTurns: 3, stackCount: 1, sourceEffectorAssetId: 'a1',
    });
    resolver.tickActiveEffects(king, 2);
    expect(king.consecutiveDenialTurns).toBe(1);
    expect(king.totalDenialTurns).toBe(1);
    resolver.tickActiveEffects(king, 3);
    expect(king.consecutiveDenialTurns).toBe(2);
    expect(king.totalDenialTurns).toBe(2);
  });

  it('expires an effect once its duration elapses and removes it from activeEffects', () => {
    king.activeEffects.push({
      kind: 'disrupt', appliedTurn: 1, durationTurns: 3, stackCount: 1, sourceEffectorAssetId: 'a1',
    });
    resolver.tickActiveEffects(king, 4); // 4 - 1 = 3 elapsed, >= durationTurns -> expired
    expect(king.activeEffects).toHaveLength(0);
  });

  it('resets consecutiveDenialTurns to 0 the moment no qualifying effect remains', () => {
    king.activeEffects.push({
      kind: 'deny', appliedTurn: 1, durationTurns: 3, stackCount: 1, sourceEffectorAssetId: 'a1',
    });
    resolver.tickActiveEffects(king, 2);
    expect(king.consecutiveDenialTurns).toBe(1);
    resolver.tickActiveEffects(king, 4); // effect expires this tick
    expect(king.activeEffects).toHaveLength(0);
    expect(king.consecutiveDenialTurns).toBe(0);
  });

  it('totalDenialTurns never resets, unlike consecutiveDenialTurns', () => {
    king.activeEffects.push({
      kind: 'deny', appliedTurn: 1, durationTurns: 3, stackCount: 1, sourceEffectorAssetId: 'a1',
    });
    resolver.tickActiveEffects(king, 2); // denied: consecutive=1, total=1
    resolver.tickActiveEffects(king, 4); // expires: consecutive resets to 0, total stays 1
    expect(king.consecutiveDenialTurns).toBe(0);
    expect(king.totalDenialTurns).toBe(1);
  });
});
