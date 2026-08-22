import { describe, expect, it } from 'vitest';
import { TemplateRegistry } from '../../engine/TemplateRegistry.js';
import { loadContent } from '../loadContent.js';

const ASSET_TYPE_IDS = [
  'wide-area-sda-radar',
  'ground-tracking-array',
  'space-based-sda-sensor',
  'optical-imaging-sensor-ground',
  'optical-imaging-sensor-space',
  'kinetic-rpo-effector',
  'ew-jamming-effector',
];

const MISSION_SET_IDS = ['satcom', 'isr', 'pnt-lite'];

describe('v1 content templates (IP-3011)', () => {
  it('loads and schema-validates every asset-type and mission-set template', () => {
    const registry = new TemplateRegistry();
    expect(() => loadContent(registry)).not.toThrow();
    for (const id of ASSET_TYPE_IDS) {
      expect(registry.getAssetTemplate(id), `missing asset template ${id}`).toBeDefined();
    }
    for (const id of MISSION_SET_IDS) {
      expect(registry.getMissionSetTemplate(id), `missing mission set ${id}`).toBeDefined();
    }
  });

  it('every mission set references only asset types that actually exist', () => {
    const registry = new TemplateRegistry();
    loadContent(registry);
    for (const missionId of MISSION_SET_IDS) {
      const mission = registry.getMissionSetTemplate(missionId)!;
      for (const assetId of mission.assetTypeIds) {
        expect(
          registry.getAssetTemplate(assetId),
          `${missionId} references unknown asset type ${assetId}`
        ).toBeDefined();
      }
    }
  });

  it('has no duplicate template IDs', () => {
    const registry = new TemplateRegistry();
    loadContent(registry);
    expect(new Set(ASSET_TYPE_IDS).size).toBe(ASSET_TYPE_IDS.length);
    expect(new Set(MISSION_SET_IDS).size).toBe(MISSION_SET_IDS.length);
  });

  it('reflects the ground/space cost-time asymmetry across the roster (FR-3300)', () => {
    const registry = new TemplateRegistry();
    loadContent(registry);
    for (const id of ASSET_TYPE_IDS) {
      const t = registry.getAssetTemplate(id)!;
      if (t.basing === 'ground') {
        expect(t.timeToOnline).toBeLessThanOrEqual(1);
      } else {
        expect(t.timeToOnline).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
