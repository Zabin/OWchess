import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { EngagePicker } from '../components/EngagePicker.js';
import type { Asset, AssetTemplate, OpponentView, PlayerState } from '@owchess/shared';

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
    king: makeAsset({ assetId: 'alice-king', isKing: true, chainRoles: [] }),
    assets,
    apRemaining: 5,
    beliefOfOpponent: new Map(),
  };
}

const opponentView: OpponentView = {
  playerId: 'bob',
  beliefEntries: [
    { subject: 'bob-asset-1', precision: 'track', lastUpdatedTurn: 1, sourceAssetId: 'alice-sensor', deceived: false, apparentRegime: 'LEO-POLAR' },
  ],
};

describe('EngagePicker (IP-9062, closes part of BL-0062)', () => {
  afterEach(() => cleanup());

  it('offers only online, engage-role assets as effectors', () => {
    const effector = makeAsset({ assetId: 'effector-1', chainRoles: ['engage'] });
    const sensorOnly = makeAsset({ assetId: 'sensor-1', chainRoles: ['find'] });
    render(<EngagePicker ownState={makeOwnState([effector, sensorOnly])} opponentView={opponentView} templates={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('engage-effector-select') as HTMLSelectElement;
    const ids = Array.from(select.options).map((o) => o.value);
    expect(ids).toContain('effector-1');
    expect(ids).not.toContain('sensor-1');
  });

  it('offers only already-known opponent contacts as targets', () => {
    const effector = makeAsset({ assetId: 'effector-1', chainRoles: ['engage'] });
    render(<EngagePicker ownState={makeOwnState([effector])} opponentView={opponentView} templates={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('engage-target-select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['bob-asset-1']);
  });

  it('constrains effect choices to the chosen effector template\'s applicableEffects', () => {
    const effector = makeAsset({ assetId: 'jammer-1', templateId: 'ew-jamming-effector', chainRoles: ['engage'] });
    const templates: AssetTemplate[] = [
      { templateId: 'ew-jamming-effector', basing: 'space', apCost: 3, timeToOnline: 3, chainRoles: ['engage'], regimeAffinity: [], applicableEffects: ['disrupt', 'deny', 'degrade', 'deceive'] },
    ];
    render(<EngagePicker ownState={makeOwnState([effector])} opponentView={opponentView} templates={templates} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('engage-effect-select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['disrupt', 'deny', 'degrade', 'deceive']);
    expect(screen.queryByTestId('engage-effect-unconstrained-note')).toBeNull();
  });

  it('falls back to all five effects with a visible note when applicableEffects is missing', () => {
    const effector = makeAsset({ assetId: 'jammer-1', templateId: 'unknown-effector', chainRoles: ['engage'] });
    render(<EngagePicker ownState={makeOwnState([effector])} opponentView={opponentView} templates={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByTestId('engage-effect-select') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(screen.getByTestId('engage-effect-unconstrained-note')).toBeDefined();
  });

  it('submitting calls onSubmit with the selected effector, target, and effect', () => {
    const onSubmit = vi.fn();
    const effector = makeAsset({ assetId: 'jammer-1', templateId: 'ew-jamming-effector', chainRoles: ['engage'] });
    const templates: AssetTemplate[] = [
      { templateId: 'ew-jamming-effector', basing: 'space', apCost: 3, timeToOnline: 3, chainRoles: ['engage'], regimeAffinity: [], applicableEffects: ['disrupt', 'deny'] },
    ];
    render(<EngagePicker ownState={makeOwnState([effector])} opponentView={opponentView} templates={templates} onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId('engage-effect-select'), { target: { value: 'deny' } });
    fireEvent.click(screen.getByTestId('engage-submit'));
    expect(onSubmit).toHaveBeenCalledWith('jammer-1', 'bob-asset-1', 'deny');
  });

  it('shows an empty-state message when no target is known yet', () => {
    const effector = makeAsset({ assetId: 'effector-1', chainRoles: ['engage'] });
    const emptyView: OpponentView = { playerId: 'bob', beliefEntries: [] };
    render(<EngagePicker ownState={makeOwnState([effector])} opponentView={emptyView} templates={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('engage-picker-empty-target')).toBeDefined();
    expect(screen.queryByTestId('engage-submit')).toBeNull();
  });
});
