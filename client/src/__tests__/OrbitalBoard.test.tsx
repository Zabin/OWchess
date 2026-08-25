import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Asset, OpponentView, PlayerState } from '@owchess/shared';
import { OrbitalBoard } from '../components/OrbitalBoard.js';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    assetId: 'a1',
    ownerId: 'alice',
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

describe('OrbitalBoard (IP-8010)', () => {
  it('renders own assets with a distinct class from known-opponent contacts', () => {
    const ownState: PlayerState = {
      playerId: 'alice',
      king: makeAsset({ assetId: 'alice-king', isKing: true, trueRegime: 'GEO-EQUATORIAL' }),
      assets: [],
      apRemaining: 5,
      beliefOfOpponent: new Map(),
    };
    const opponentView: OpponentView = {
      playerId: 'bob',
      beliefEntries: [
        { subject: 'bob-sat', precision: 'fix', lastUpdatedTurn: 1, sourceAssetId: 'alice-sensor', deceived: false, apparentRegime: 'LEO-POLAR' },
      ],
    };

    render(<OrbitalBoard ownState={ownState} opponentView={opponentView} />);

    const ownContact = screen.getByTestId('contact-own-alice-king');
    const knownContact = screen.getByTestId('contact-known-bob-sat');
    expect(ownContact.className).toContain('contact--own');
    expect(knownContact.className).toContain('contact--known');
    expect(ownContact.className).not.toBe(knownContact.className);
  });

  it('shows only presence (no regime) for a find-level belief entry', () => {
    const ownState: PlayerState = {
      playerId: 'alice',
      king: makeAsset({ assetId: 'alice-king', isKing: true }),
      assets: [],
      apRemaining: 5,
      beliefOfOpponent: new Map(),
    };
    const opponentView: OpponentView = {
      playerId: 'bob',
      beliefEntries: [
        { subject: 'bob-unknown', precision: 'find', lastUpdatedTurn: 1, sourceAssetId: 'x', deceived: false, apparentRegime: null },
      ],
    };
    render(<OrbitalBoard ownState={ownState} opponentView={opponentView} />);
    expect(screen.getByTestId('contact-known-bob-unknown').textContent).toContain('presence only');
  });
});
