/**
 * ManeuverPicker (IP-9062, closes part of BL-0062) — the previously-missing asset + target-regime
 * selector for Maneuver. Eligible assets are the player's own online (deployState === null),
 * not-already-maneuvering assets (including the King, per maneuverAction.ts's own eligibility
 * check) — server-side `Propagator.planManeuver` accepts any target regime, so all nine values
 * are offered.
 */
import { useState } from 'react';
import type { Asset, OrbitalRegimeLabel, PlayerState } from '@owchess/shared';

const ALL_REGIMES: OrbitalRegimeLabel[] = [
  'LEO-EQUATORIAL', 'LEO-PROGRADE', 'LEO-POLAR',
  'MEO-EQUATORIAL', 'MEO-PROGRADE', 'MEO-POLAR',
  'GEO-EQUATORIAL', 'GEO-PROGRADE', 'GEO-POLAR',
];

function isEligible(a: Asset): boolean {
  return a.deployState === null && a.maneuverState === null && !a.destroyed;
}

export interface ManeuverPickerProps {
  ownState: PlayerState;
  onSubmit: (assetId: string, targetRegime: OrbitalRegimeLabel) => void;
  onCancel: () => void;
}

export function ManeuverPicker({ ownState, onSubmit, onCancel }: ManeuverPickerProps) {
  const eligible = [ownState.king, ...ownState.assets].filter(isEligible);
  const [assetId, setAssetId] = useState(eligible[0]?.assetId ?? '');
  const [targetRegime, setTargetRegime] = useState<OrbitalRegimeLabel | ''>(ALL_REGIMES[0]);

  return (
    <div data-testid="maneuver-picker">
      <h3>Maneuver</h3>
      {eligible.length === 0 ? (
        <div data-testid="maneuver-picker-empty">No eligible online asset to maneuver.</div>
      ) : (
        <>
          <select
            data-testid="maneuver-asset-select"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            {eligible.map((a) => (
              <option key={a.assetId} value={a.assetId}>
                {a.assetId} ({a.trueRegime})
              </option>
            ))}
          </select>
          <select
            data-testid="maneuver-regime-select"
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
            data-testid="maneuver-submit"
            disabled={!assetId || !targetRegime}
            onClick={() => assetId && targetRegime && onSubmit(assetId, targetRegime)}
          >
            Confirm Maneuver
          </button>
        </>
      )}
      <button type="button" data-testid="maneuver-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
