/**
 * OrbitalBoard (IP-8010) — renders own assets and known-opponent belief entries, visually
 * distinguished per GDS-08's palette convention. Renders only from ownState/opponentView, never
 * infers or holds opponent truth beyond what OpponentView already carries (GDS-02).
 */
import type { OpponentView, PlayerState } from '@owchess/shared';

export interface OrbitalBoardProps {
  ownState: PlayerState;
  opponentView: OpponentView;
}

export function OrbitalBoard({ ownState, opponentView }: OrbitalBoardProps) {
  const ownAssets = [ownState.king, ...ownState.assets];

  return (
    <div className="orbital-board" data-testid="orbital-board">
      <div className="orbital-board__own">
        {ownAssets.map((asset) => (
          <div key={asset.assetId} className="contact contact--own" data-testid={`contact-own-${asset.assetId}`}>
            {asset.assetId} — {asset.trueRegime}
          </div>
        ))}
      </div>
      <div className="orbital-board__known">
        {opponentView.beliefEntries.map((entry) => (
          <div
            key={entry.subject}
            className={`contact contact--known contact--${entry.precision}`}
            data-testid={`contact-known-${entry.subject}`}
          >
            {entry.subject} — {entry.apparentRegime ?? 'presence only'} ({entry.precision})
            {entry.deceived ? ' [reported]' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
