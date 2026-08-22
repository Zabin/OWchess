/**
 * TemplateRegistry (IP-3010) — schema for the data-driven asset/mission-set templates IP-3011
 * populates. Schema only, no content (FR-3100).
 */
import type { ChainRole, MissionSetId, OrbitalRegimeLabel, TemplateId } from '@owchess/shared';

export interface AssetTemplate {
  templateId: TemplateId;
  basing: 'ground' | 'space';
  apCost: number;
  /** FR-3300: ground assets come online faster/cheaper than space assets. */
  timeToOnline: number;
  chainRoles: ChainRole[];
  regimeAffinity: OrbitalRegimeLabel[];
}

export interface MissionSetTemplate {
  missionSetId: MissionSetId;
  assetTypeIds: TemplateId[];
  kingRegimeAffinity: OrbitalRegimeLabel[];
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function validateAssetTemplate(t: unknown): t is AssetTemplate {
  if (typeof t !== 'object' || t === null) return false;
  const a = t as Record<string, unknown>;
  return (
    isNonEmptyString(a.templateId) &&
    (a.basing === 'ground' || a.basing === 'space') &&
    typeof a.apCost === 'number' &&
    a.apCost >= 0 &&
    typeof a.timeToOnline === 'number' &&
    a.timeToOnline >= 0 &&
    Array.isArray(a.chainRoles) &&
    Array.isArray(a.regimeAffinity)
  );
}

function validateMissionSetTemplate(t: unknown): t is MissionSetTemplate {
  if (typeof t !== 'object' || t === null) return false;
  const m = t as Record<string, unknown>;
  return (
    isNonEmptyString(m.missionSetId) &&
    Array.isArray(m.assetTypeIds) &&
    Array.isArray(m.kingRegimeAffinity)
  );
}

export class TemplateRegistry {
  private assetTemplates = new Map<TemplateId, AssetTemplate>();
  private missionSetTemplates = new Map<MissionSetId, MissionSetTemplate>();

  registerAssetTemplate(template: unknown): void {
    if (!validateAssetTemplate(template)) {
      throw new Error(`invalid AssetTemplate: ${JSON.stringify(template)}`);
    }
    this.assetTemplates.set(template.templateId, template);
  }

  registerMissionSetTemplate(template: unknown): void {
    if (!validateMissionSetTemplate(template)) {
      throw new Error(`invalid MissionSetTemplate: ${JSON.stringify(template)}`);
    }
    this.missionSetTemplates.set(template.missionSetId, template);
  }

  getAssetTemplate(templateId: TemplateId): AssetTemplate | undefined {
    return this.assetTemplates.get(templateId);
  }

  getMissionSetTemplate(missionSetId: MissionSetId): MissionSetTemplate | undefined {
    return this.missionSetTemplates.get(missionSetId);
  }
}
