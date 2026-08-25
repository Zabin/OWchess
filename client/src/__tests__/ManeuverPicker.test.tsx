import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ManeuverPicker } from '../components/ManeuverPicker.js';
import type { Asset, PlayerState } from '@owchess/shared';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1', ownerId: 'alice', templateId: 't1', basing: 'space',
    chainRoles: [], trueRegime: 'GEO-EQUATORIAL', maneuverState: null, deployState: null,
    activeEffects: [], isKing: false, missionSet: null, consecutiveDenialTurns: 0,
    totalDenialTurns: 0, destroyed: false,
    ...overrides,
  };
}

function makeOwnState(assets: Asset[]): PlayerState {
  return {
    playerId: 'alice',
    king: makeAsset({ assetId: 'alice-king', isKing: true, trueRegime: 'GEO-EQUATORIAL' }),
    assets,
    apRemaining: 5,
    beliefOfOpponent: new Map(),
  };
}

describe('ManeuverPicker (IP-9062, closes part of BL-0062)', () => {
  afterEach(() => cleanup());

  it('offers only online, non-maneuvering assets (including the King)', () => {
    const online = makeAsset({ assetId: 'online-1', deployState: null, maneuverState: null });
    const stillDeploying = makeAsset({ assetId: 'deploying-1', deployState: { turnsUntilOnline: 2 } });
    const alreadyManeuvering = makeAsset({ assetId: 'maneuvering-1', maneuverState: { targetRegime: 'LEO-POLAR', turnsRemaining: 1 } });
    render(
      <ManeuverPicker
        ownState={makeOwnState([online, stillDeploying, alreadyManeuvering])}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const select = screen.getByTestId('maneuver-asset-select') as HTMLSelectElement;
    const ids = Array.from(select.options).map((o) => o.value);
    expect(ids).toContain('alice-king');
    expect(ids).toContain('online-1');
    expect(ids).not.toContain('deploying-1');
    expect(ids).not.toContain('maneuvering-1');
  });

  it('offers all nine orbital regimes as maneuver targets', () => {
    render(<ManeuverPicker ownState={makeOwnState([])} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('maneuver-regime-select') as HTMLSelectElement;
    expect(select.options.length).toBe(9);
  });

  it('submitting calls onSubmit with the selected asset and target regime', () => {
    const onSubmit = vi.fn();
    const online = makeAsset({ assetId: 'online-1' });
    render(<ManeuverPicker ownState={makeOwnState([online])} onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId('maneuver-asset-select'), { target: { value: 'online-1' } });
    fireEvent.change(screen.getByTestId('maneuver-regime-select'), { target: { value: 'MEO-POLAR' } });
    fireEvent.click(screen.getByTestId('maneuver-submit'));
    expect(onSubmit).toHaveBeenCalledWith('online-1', 'MEO-POLAR');
  });

  it('shows an empty-state message when no asset is eligible', () => {
    const stillDeploying = makeAsset({ assetId: 'deploying-1', deployState: { turnsUntilOnline: 2 } });
    render(
      <ManeuverPicker
        ownState={{ ...makeOwnState([stillDeploying]), king: makeAsset({ assetId: 'alice-king', isKing: true, deployState: { turnsUntilOnline: 1 } }) }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId('maneuver-picker-empty')).toBeDefined();
    expect(screen.queryByTestId('maneuver-submit')).toBeNull();
  });
});
