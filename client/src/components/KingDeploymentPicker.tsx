/**
 * KingDeploymentPicker (IP-9056, closes BL-0056) — the previously-missing client UI for FR-1210's
 * secret King selection. Shown once a session is joined but hasn't reached 'active' phase yet.
 * Never renders the opponent's selection — only whether they've submitted (ownDeployed/
 * opponentDeployed booleans, per FR-1210's secrecy requirement).
 */
import { useState } from 'react';
import type { MissionSetTemplate, OrbitalRegimeLabel } from '@owchess/shared';

export interface DeploymentStatus {
  phase: 'deploying' | 'active';
  ownDeployed: boolean;
  opponentDeployed: boolean;
}

export interface KingDeploymentPickerProps {
  missionSets: MissionSetTemplate[];
  status: DeploymentStatus | null;
  onDeploy: (missionSetId: string, regime: OrbitalRegimeLabel) => void;
}

export function KingDeploymentPicker({ missionSets, status, onDeploy }: KingDeploymentPickerProps) {
  const [selectedMissionSetId, setSelectedMissionSetId] = useState(missionSets[0]?.missionSetId ?? '');
  const selectedMissionSet = missionSets.find((m) => m.missionSetId === selectedMissionSetId);
  const [selectedRegime, setSelectedRegime] = useState<OrbitalRegimeLabel | ''>(
    selectedMissionSet?.kingRegimeAffinity[0] ?? ''
  );

  if (status?.ownDeployed) {
    return (
      <div data-testid="king-deployment-waiting">
        Waiting for your opponent to deploy their King…
      </div>
    );
  }

  function handleMissionSetChange(missionSetId: string) {
    setSelectedMissionSetId(missionSetId);
    const ms = missionSets.find((m) => m.missionSetId === missionSetId);
    setSelectedRegime(ms?.kingRegimeAffinity[0] ?? '');
  }

  return (
    <div data-testid="king-deployment-picker">
      <h2>Deploy Your King</h2>
      <select
        data-testid="mission-set-select"
        value={selectedMissionSetId}
        onChange={(e) => handleMissionSetChange(e.target.value)}
      >
        {missionSets.map((m) => (
          <option key={m.missionSetId} value={m.missionSetId}>
            {m.missionSetId}
          </option>
        ))}
      </select>
      <select
        data-testid="regime-select"
        value={selectedRegime}
        onChange={(e) => setSelectedRegime(e.target.value as OrbitalRegimeLabel)}
      >
        {(selectedMissionSet?.kingRegimeAffinity ?? []).map((regime) => (
          <option key={regime} value={regime}>
            {regime}
          </option>
        ))}
      </select>
      <button
        type="button"
        data-testid="deploy-king-submit"
        disabled={!selectedMissionSetId || !selectedRegime}
        onClick={() => selectedRegime && onDeploy(selectedMissionSetId, selectedRegime)}
      >
        Deploy King
      </button>
    </div>
  );
}
