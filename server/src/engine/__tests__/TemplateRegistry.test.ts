import { describe, expect, it } from 'vitest';
import { TemplateRegistry } from '../TemplateRegistry.js';

describe('TemplateRegistry', () => {
  it('accepts a well-formed AssetTemplate', () => {
    const registry = new TemplateRegistry();
    registry.registerAssetTemplate({
      templateId: 'wide-area-sda-radar',
      basing: 'ground',
      apCost: 2,
      timeToOnline: 1,
      chainRoles: ['find', 'fix'],
      regimeAffinity: ['LEO-EQUATORIAL'],
    });
    expect(registry.getAssetTemplate('wide-area-sda-radar')).toBeDefined();
  });

  it('rejects a malformed AssetTemplate', () => {
    const registry = new TemplateRegistry();
    expect(() =>
      registry.registerAssetTemplate({ templateId: 'bad', basing: 'orbit' })
    ).toThrow();
  });

  it('accepts a well-formed MissionSetTemplate', () => {
    const registry = new TemplateRegistry();
    registry.registerMissionSetTemplate({
      missionSetId: 'satcom',
      assetTypeIds: ['wide-area-sda-radar'],
      kingRegimeAffinity: ['GEO-EQUATORIAL'],
    });
    expect(registry.getMissionSetTemplate('satcom')).toBeDefined();
  });

  it('rejects a malformed MissionSetTemplate', () => {
    const registry = new TemplateRegistry();
    expect(() => registry.registerMissionSetTemplate({ missionSetId: 'bad' })).toThrow();
  });

  it('IP-9062/BL-0062: promotes an asset template\'s _effectAffinity to applicableEffects', () => {
    const registry = new TemplateRegistry();
    registry.registerAssetTemplate({
      templateId: 'ew-jamming-effector',
      basing: 'space',
      apCost: 3,
      timeToOnline: 3,
      chainRoles: ['engage'],
      regimeAffinity: ['LEO-EQUATORIAL'],
      _effectAffinity: ['disrupt', 'deny', 'degrade', 'deceive'],
    });
    expect(registry.getAssetTemplate('ew-jamming-effector')?.applicableEffects).toEqual([
      'disrupt', 'deny', 'degrade', 'deceive',
    ]);
  });

  it('IP-9062/BL-0062: leaves applicableEffects undefined for a template with no _effectAffinity', () => {
    const registry = new TemplateRegistry();
    registry.registerAssetTemplate({
      templateId: 'wide-area-sda-radar',
      basing: 'ground',
      apCost: 2,
      timeToOnline: 1,
      chainRoles: ['find', 'fix'],
      regimeAffinity: ['LEO-EQUATORIAL'],
    });
    expect(registry.getAssetTemplate('wide-area-sda-radar')?.applicableEffects).toBeUndefined();
  });
});
