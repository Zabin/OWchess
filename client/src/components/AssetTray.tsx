/**
 * AssetTray (IP-8010; extended by IP-9062/BL-0062) — lists deployable templates with
 * cost/time-to-online; an unaffordable template is shown disabled-with-reason, never hidden
 * (FR-1320's rule extended to the tray). Clicking an affordable template now opens
 * DeployRegimePicker instead of deploying immediately — the previously-missing step that lets the
 * player supply the new asset's starting orbital regime (`targetRegime`), which the server
 * requires (`deployAction.ts`) but nothing on the client ever collected before this package.
 */
import { useState } from 'react';
import type { OrbitalRegimeLabel, PlayerState } from '@owchess/shared';
import { DeployRegimePicker } from './DeployRegimePicker.js';

export interface DeployableTemplate {
  templateId: string;
  apCost: number;
  timeToOnline: number;
  regimeAffinity: OrbitalRegimeLabel[];
}

export interface AssetTrayProps {
  ownState: PlayerState;
  templates: DeployableTemplate[];
  onDeploy: (templateId: string, targetRegime: OrbitalRegimeLabel) => void;
}

export function AssetTray({ ownState, templates, onDeploy }: AssetTrayProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const selectedTemplate = templates.find((t) => t.templateId === selectedTemplateId) ?? null;

  return (
    <div className="asset-tray" data-testid="asset-tray">
      {templates.map((t) => {
        const affordable = ownState.apRemaining >= t.apCost;
        return (
          <button
            key={t.templateId}
            type="button"
            disabled={!affordable}
            title={affordable ? undefined : `insufficient AP (needs ${t.apCost}, have ${ownState.apRemaining})`}
            data-testid={`deploy-${t.templateId}`}
            onClick={() => setSelectedTemplateId(t.templateId)}
          >
            {t.templateId} — {t.apCost} AP, {t.timeToOnline} turn(s) to online
            {!affordable ? ' (insufficient AP)' : ''}
          </button>
        );
      })}
      {selectedTemplate && (
        <DeployRegimePicker
          template={selectedTemplate}
          onSubmit={(regime) => {
            onDeploy(selectedTemplate.templateId, regime);
            setSelectedTemplateId(null);
          }}
          onCancel={() => setSelectedTemplateId(null)}
        />
      )}
    </div>
  );
}
