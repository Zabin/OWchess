import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TaskPicker } from '../components/TaskPicker.js';
import type { Asset, PlayerState } from '@owchess/shared';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1', ownerId: 'alice', templateId: 't1', basing: 'ground',
    chainRoles: [], trueRegime: 'LEO-EQUATORIAL', maneuverState: null, deployState: null,
    activeEffects: [], isKing: false, missionSet: null, consecutiveDenialTurns: 0,
    totalDenialTurns: 0, destroyed: false,
    ...overrides,
  };
}

function makeOwnState(assets: Asset[]): PlayerState {
  return {
    playerId: 'alice',
    king: makeAsset({ assetId: 'alice-king', isKing: true, chainRoles: [] }),
    assets,
    apRemaining: 5,
    beliefOfOpponent: new Map(),
  };
}

describe('TaskPicker (IP-9062, closes part of BL-0062)', () => {
  afterEach(() => cleanup());

  it('offers only online assets with at least one find/fix/track/target chain role', () => {
    const sensor = makeAsset({ assetId: 'sensor-1', chainRoles: ['find', 'fix'] });
    const effectorOnly = makeAsset({ assetId: 'effector-1', chainRoles: ['engage'] });
    const notOnline = makeAsset({ assetId: 'sensor-2', chainRoles: ['track'], deployState: { turnsUntilOnline: 1 } });
    render(<TaskPicker ownState={makeOwnState([sensor, effectorOnly, notOnline])} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('task-source-select') as HTMLSelectElement;
    const ids = Array.from(select.options).map((o) => o.value);
    expect(ids).toContain('sensor-1');
    expect(ids).not.toContain('effector-1');
    expect(ids).not.toContain('sensor-2');
  });

  it('offers all nine orbital regimes as tasking targets', () => {
    const sensor = makeAsset({ assetId: 'sensor-1', chainRoles: ['find'] });
    render(<TaskPicker ownState={makeOwnState([sensor])} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('task-regime-select') as HTMLSelectElement;
    expect(select.options.length).toBe(9);
  });

  it('submitting calls onSubmit with the selected source asset and target regime', () => {
    const onSubmit = vi.fn();
    const sensor = makeAsset({ assetId: 'sensor-1', chainRoles: ['find'] });
    render(<TaskPicker ownState={makeOwnState([sensor])} onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId('task-source-select'), { target: { value: 'sensor-1' } });
    fireEvent.change(screen.getByTestId('task-regime-select'), { target: { value: 'GEO-POLAR' } });
    fireEvent.click(screen.getByTestId('task-submit'));
    expect(onSubmit).toHaveBeenCalledWith('sensor-1', 'GEO-POLAR');
  });

  it('shows an empty-state message when no sensor asset is eligible', () => {
    const effectorOnly = makeAsset({ assetId: 'effector-1', chainRoles: ['engage'] });
    render(<TaskPicker ownState={makeOwnState([effectorOnly])} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('task-picker-empty')).toBeDefined();
    expect(screen.queryByTestId('task-submit')).toBeNull();
  });
});
