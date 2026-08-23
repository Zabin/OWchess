import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Asset, OpponentView, PlayerState } from '@owchess/shared';
import { OrbitalBoard } from '../components/OrbitalBoard.js';
import { IntelPanel } from '../components/IntelPanel.js';

/**
 * fogOfWarBoundary (IP-8010) — the property FS-108's Verification Plan calls out: no component
 * ever accepts/reads a PlayerState-shaped prop where OpponentView is expected. TypeScript's own
 * component prop types (`opponentView: OpponentView`) already make this a compile error, checked
 * by `npm run build` per this package's own Verification Checklist ("Inspection"). This test adds
 * a runtime proxy for the same guarantee: even if a caller accidentally attached PlayerState-only
 * fields (king/assets/apRemaining) onto an object also satisfying OpponentView's shape, the
 * rendered output never reflects them — proving the component's own implementation never reaches
 * for those fields, structurally, not just by the type checker's say-so.
 */
function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1',
    ownerId: 'bob',
    templateId: 't1',
    basing: 'space',
    chainRoles: [],
    trueRegime: 'LEO-EQUATORIAL',
    maneuverState: null,
    deployState: null,
    activeEffects: [],
    isKing: false,
    missionSet: null,
    consecutiveDenialTurns: 0,
    totalDenialTurns: 0,
    destroyed: false,
    ...overrides,
  };
}

describe('fog-of-war rendering boundary (IP-8010)', () => {
  it('OrbitalBoard never renders a PlayerState-only field even if smuggled onto an OpponentView-shaped object', () => {
    const smuggledSecretAssetId = 'bob-secret-never-tasked';
    const contaminated = {
      playerId: 'bob',
      beliefEntries: [],
      // PlayerState-only fields that must never be read/rendered:
      king: makeAsset({ assetId: smuggledSecretAssetId, isKing: true, trueRegime: 'GEO-POLAR' }),
      assets: [makeAsset({ assetId: 'bob-another-secret' })],
      apRemaining: 5,
    } as unknown as OpponentView;

    const ownState: PlayerState = {
      playerId: 'alice',
      king: makeAsset({ assetId: 'alice-king', isKing: true }),
      assets: [],
      apRemaining: 5,
      beliefOfOpponent: new Map(),
    };

    const { container } = render(<OrbitalBoard ownState={ownState} opponentView={contaminated} />);
    expect(container.innerHTML).not.toContain(smuggledSecretAssetId);
    expect(container.innerHTML).not.toContain('bob-another-secret');
    expect(container.innerHTML).not.toContain('GEO-POLAR');
  });

  it('IntelPanel never renders a PlayerState-only field even if smuggled onto an OpponentView-shaped object', () => {
    const smuggledSecretAssetId = 'bob-secret-never-tasked-2';
    const contaminated = {
      playerId: 'bob',
      beliefEntries: [],
      king: makeAsset({ assetId: smuggledSecretAssetId, isKing: true, trueRegime: 'MEO-POLAR' }),
      assets: [],
      apRemaining: 3,
    } as unknown as OpponentView;

    const { container } = render(<IntelPanel opponentView={contaminated} />);
    expect(container.innerHTML).not.toContain(smuggledSecretAssetId);
    expect(container.innerHTML).not.toContain('MEO-POLAR');
    expect(screen.getByTestId('intel-empty')).toBeDefined();
  });
});
