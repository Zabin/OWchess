import { describe, expect, it } from 'vitest';
import { EffectDefinitionRegistry, loadEffectDefinitions } from '../EffectDefinitionRegistry.js';
import { TemplateRegistry } from '../../engine/TemplateRegistry.js';
import { loadContent } from '../loadContent.js';
import { EffectResolver } from '../../engine/EffectResolver.js';
import { BeliefState } from '../../engine/BeliefState.js';
import type { Asset, PlayerState } from '@owchess/shared';

const EFFECT_IDS = ['deceive', 'disrupt', 'deny', 'degrade', 'destroy'] as const;

describe('effect-definition content (IP-4011)', () => {
  it('loads and schema-validates every effect-definition file', () => {
    const registry = new EffectDefinitionRegistry();
    expect(() => loadEffectDefinitions(registry)).not.toThrow();
    for (const id of EFFECT_IDS) {
      expect(registry.get(id), `missing effect definition ${id}`).toBeDefined();
    }
  });

  it('durations match FS-105\'s pinned values exactly (3/3/4/terminal/until-cleared)', () => {
    const registry = new EffectDefinitionRegistry();
    loadEffectDefinitions(registry);
    expect(registry.get('disrupt')!.durationTurns).toBe(3);
    expect(registry.get('deny')!.durationTurns).toBe(3);
    expect(registry.get('degrade')!.durationTurns).toBe(4);
    expect(registry.get('destroy')!.durationTurns).toBe('terminal');
    expect(registry.get('deceive')!.durationTurns).toBe('until-cleared');
  });

  it('every allowedEffectorTemplateId references a real, existing asset-type template', () => {
    const templateRegistry = new TemplateRegistry();
    loadContent(templateRegistry);
    const effectRegistry = new EffectDefinitionRegistry();
    loadEffectDefinitions(effectRegistry);
    for (const def of effectRegistry.all()) {
      for (const templateId of def.allowedEffectorTemplateIds) {
        expect(
          templateRegistry.getAssetTemplate(templateId),
          `${def.effectId} references unknown asset template ${templateId}`
        ).toBeDefined();
      }
    }
  });

  it('the fixed durations exactly match EffectResolver.ts\'s live behavior (BL-0037 cross-check)', () => {
    // This test is the guard against the known duration-source-of-truth duplication (BL-0037):
    // if EffectResolver's hardcoded constants ever drift from this content, this test catches it.
    const registry = new EffectDefinitionRegistry();
    loadEffectDefinitions(registry);
    const resolver = new EffectResolver();
    const beliefState = new BeliefState();

    const effectorState: PlayerState = {
      playerId: 'alice',
      king: makeAsset('alice-king', 'alice', true),
      assets: [],
      apRemaining: 5,
      beliefOfOpponent: new Map([
        ['bob-king', { subject: 'bob-king', precision: 'target', lastUpdatedTurn: 1, sourceAssetId: 'e1', deceived: false, apparentRegime: 'LEO-EQUATORIAL' }],
      ]),
    };
    const effector = makeAsset('alice-effector', 'alice', false);
    const target = makeAsset('bob-king', 'bob', true);

    resolver.resolveEngagement(effectorState, effector, target, 'disrupt', beliefState, 1);
    expect(target.activeEffects[0].durationTurns).toBe(registry.get('disrupt')!.durationTurns);

    const target2 = makeAsset('bob-sat', 'bob', false);
    effectorState.beliefOfOpponent.set('bob-sat', { subject: 'bob-sat', precision: 'target', lastUpdatedTurn: 1, sourceAssetId: 'e1', deceived: false, apparentRegime: 'LEO-EQUATORIAL' });
    resolver.resolveEngagement(effectorState, effector, target2, 'degrade', beliefState, 1);
    expect(target2.activeEffects[0].durationTurns).toBe(registry.get('degrade')!.durationTurns);
  });
});

function makeAsset(assetId: string, ownerId: string, isKing: boolean): Asset {
  return {
    assetId,
    ownerId,
    templateId: 't1',
    basing: 'space',
    chainRoles: [],
    trueRegime: 'LEO-EQUATORIAL',
    maneuverState: null,
    deployState: null,
    activeEffects: [],
    isKing,
    missionSet: null,
    consecutiveDenialTurns: 0,
    totalDenialTurns: 0,
    destroyed: false,
  };
}
