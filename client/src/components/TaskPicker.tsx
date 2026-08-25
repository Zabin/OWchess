/**
 * TaskPicker (IP-9062, closes part of BL-0062) — the previously-missing source-asset +
 * target-regime selector for Task, per FS-103 §W1 ("the player selects one of their online
 * sensors and a target: a regime..."). Eligible sources are the player's own online assets with
 * at least one find/fix/track/target chain role. All nine regimes are offered — `applyTasking`
 * searches whatever the opponent actually has present there, so a search can legitimately find
 * nothing.
 */
import { useState } from 'react';
import type { Asset, ChainRole, OrbitalRegimeLabel, PlayerState } from '@owchess/shared';

const ALL_REGIMES: OrbitalRegimeLabel[] = [
  'LEO-EQUATORIAL', 'LEO-PROGRADE', 'LEO-POLAR',
  'MEO-EQUATORIAL', 'MEO-PROGRADE', 'MEO-POLAR',
  'GEO-EQUATORIAL', 'GEO-PROGRADE', 'GEO-POLAR',
];

const SENSOR_ROLES = new Set<ChainRole>(['find', 'fix', 'track', 'target']);

function hasSensorRole(a: Asset): boolean {
  return a.chainRoles.some((r) => SENSOR_ROLES.has(r));
}

function isEligible(a: Asset): boolean {
  return a.deployState === null && !a.destroyed && hasSensorRole(a);
}

export interface TaskPickerProps {
  ownState: PlayerState;
  onSubmit: (sourceAssetId: string, targetRegime: OrbitalRegimeLabel) => void;
  onCancel: () => void;
}

export function TaskPicker({ ownState, onSubmit, onCancel }: TaskPickerProps) {
  const eligible = [ownState.king, ...ownState.assets].filter(isEligible);
  const [sourceAssetId, setSourceAssetId] = useState(eligible[0]?.assetId ?? '');
  const [targetRegime, setTargetRegime] = useState<OrbitalRegimeLabel | ''>(ALL_REGIMES[0]);

  return (
    <div data-testid="task-picker">
      <h3>Task Sensor</h3>
      {eligible.length === 0 ? (
        <div data-testid="task-picker-empty">No eligible online sensor asset.</div>
      ) : (
        <>
          <select
            data-testid="task-source-select"
            value={sourceAssetId}
            onChange={(e) => setSourceAssetId(e.target.value)}
          >
            {eligible.map((a) => (
              <option key={a.assetId} value={a.assetId}>
                {a.assetId}
              </option>
            ))}
          </select>
          <select
            data-testid="task-regime-select"
            value={targetRegime}
            onChange={(e) => setTargetRegime(e.target.value as OrbitalRegimeLabel)}
          >
            {ALL_REGIMES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            data-testid="task-submit"
            disabled={!sourceAssetId || !targetRegime}
            onClick={() => sourceAssetId && targetRegime && onSubmit(sourceAssetId, targetRegime)}
          >
            Confirm Task
          </button>
        </>
      )}
      <button type="button" data-testid="task-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
