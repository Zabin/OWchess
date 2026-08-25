/**
 * DeployRegimePicker (IP-9062, closes part of BL-0062) — the previously-missing regime selector
 * for Deploy. Shown after a player picks a template from the Asset Tray; constrains its choices
 * to that template's own `regimeAffinity`, mirroring KingDeploymentPicker's affinity-constrained
 * pattern.
 */
import { useState } from 'react';
import type { OrbitalRegimeLabel } from '@owchess/shared';

export interface DeployRegimePickerProps {
  template: { templateId: string; regimeAffinity: OrbitalRegimeLabel[] };
  onSubmit: (regime: OrbitalRegimeLabel) => void;
  onCancel: () => void;
}

export function DeployRegimePicker({ template, onSubmit, onCancel }: DeployRegimePickerProps) {
  const [regime, setRegime] = useState<OrbitalRegimeLabel | ''>(template.regimeAffinity[0] ?? '');

  return (
    <div data-testid="deploy-regime-picker">
      <div>Choose a starting orbital regime for {template.templateId}:</div>
      <select
        data-testid="deploy-regime-select"
        value={regime}
        onChange={(e) => setRegime(e.target.value as OrbitalRegimeLabel)}
      >
        {template.regimeAffinity.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="button"
        data-testid="deploy-regime-submit"
        disabled={!regime}
        onClick={() => regime && onSubmit(regime)}
      >
        Confirm Deploy
      </button>
      <button type="button" data-testid="deploy-regime-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
