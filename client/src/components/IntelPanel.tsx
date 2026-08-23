/**
 * IntelPanel (IP-8010) — detail view of the opponent belief entries already filtered into
 * OpponentView (FEAT-6000). Renders only what's already been earned; never independently infers.
 */
import type { OpponentView } from '@owchess/shared';

export interface IntelPanelProps {
  opponentView: OpponentView;
}

export function IntelPanel({ opponentView }: IntelPanelProps) {
  return (
    <div className="intel-panel" data-testid="intel-panel">
      {opponentView.beliefEntries.length === 0 ? (
        <div data-testid="intel-empty">No intel gathered yet.</div>
      ) : (
        opponentView.beliefEntries.map((entry) => (
          <div key={entry.subject} data-testid={`intel-${entry.subject}`}>
            <strong>{entry.subject}</strong> — precision: {entry.precision}
            {entry.apparentRegime ? `, regime: ${entry.apparentRegime}` : ''}
            {entry.deceived ? ' (source: own sensors — unverified against ground truth)' : ''}
            , last updated turn {entry.lastUpdatedTurn}
          </div>
        ))
      )}
    </div>
  );
}
