/**
 * AssetTray (IP-8010) — lists deployable templates with cost/time-to-online; an unaffordable
 * template is shown disabled-with-reason, never hidden (FR-1320's rule extended to the tray).
 */
import type { PlayerState } from '@owchess/shared';

export interface DeployableTemplate {
  templateId: string;
  apCost: number;
  timeToOnline: number;
}

export interface AssetTrayProps {
  ownState: PlayerState;
  templates: DeployableTemplate[];
  onDeploy: (templateId: string) => void;
}

export function AssetTray({ ownState, templates, onDeploy }: AssetTrayProps) {
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
            onClick={() => onDeploy(t.templateId)}
          >
            {t.templateId} — {t.apCost} AP, {t.timeToOnline} turn(s) to online
            {!affordable ? ' (insufficient AP)' : ''}
          </button>
        );
      })}
    </div>
  );
}
