/**
 * TemplateRegistry (IP-3010) — schema for the data-driven asset/mission-set templates IP-3011
 * populates. Schema only, no content (FR-3100).
 */
import type { AssetTemplate, MissionSetId, MissionSetTemplate, TemplateId } from '@owchess/shared';

export type { AssetTemplate, MissionSetTemplate };

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

  /** BL-0048 (VR-8010 remediation): the "list all" accessor the transport layer needs to build a
   *  TemplateCatalogMessage — getAssetTemplate alone can't serve that (no "list every id" caller). */
  listAssetTemplates(): AssetTemplate[] {
    return Array.from(this.assetTemplates.values());
  }

  getMissionSetTemplate(missionSetId: MissionSetId): MissionSetTemplate | undefined {
    return this.missionSetTemplates.get(missionSetId);
  }
}
