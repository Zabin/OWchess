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
});
