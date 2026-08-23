import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { KingDeploymentPicker } from '../components/KingDeploymentPicker.js';
import type { MissionSetTemplate } from '@owchess/shared';

const missionSets: MissionSetTemplate[] = [
  { missionSetId: 'satcom', assetTypeIds: [], kingRegimeAffinity: ['GEO-EQUATORIAL'] },
  { missionSetId: 'isr', assetTypeIds: [], kingRegimeAffinity: ['LEO-POLAR'] },
];

describe('KingDeploymentPicker (IP-9056, closes BL-0056)', () => {
  afterEach(() => cleanup());

  it('renders real mission-set options from the server catalog, not hardcoded values', () => {
    render(<KingDeploymentPicker missionSets={missionSets} status={null} onDeploy={vi.fn()} />);
    const select = screen.getByTestId('mission-set-select') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['satcom', 'isr']);
  });

  it('selecting a mission set updates the regime options to that mission set\'s own kingRegimeAffinity', () => {
    render(<KingDeploymentPicker missionSets={missionSets} status={null} onDeploy={vi.fn()} />);
    fireEvent.change(screen.getByTestId('mission-set-select'), { target: { value: 'isr' } });
    const regimeSelect = screen.getByTestId('regime-select') as HTMLSelectElement;
    expect(Array.from(regimeSelect.options).map((o) => o.value)).toEqual(['LEO-POLAR']);
  });

  it('submitting calls onDeploy with the selected mission set and regime', () => {
    const onDeploy = vi.fn();
    render(<KingDeploymentPicker missionSets={missionSets} status={null} onDeploy={onDeploy} />);
    fireEvent.click(screen.getByTestId('deploy-king-submit'));
    expect(onDeploy).toHaveBeenCalledWith('satcom', 'GEO-EQUATORIAL');
  });

  it('shows the waiting message instead of the form once ownDeployed is true', () => {
    render(
      <KingDeploymentPicker
        missionSets={missionSets}
        status={{ phase: 'deploying', ownDeployed: true, opponentDeployed: false }}
        onDeploy={vi.fn()}
      />
    );
    expect(screen.getByTestId('king-deployment-waiting')).toBeDefined();
    expect(screen.queryByTestId('king-deployment-picker')).toBeNull();
  });
});
