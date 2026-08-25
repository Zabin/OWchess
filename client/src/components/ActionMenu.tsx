/**
 * ActionMenu (IP-8010) — persistent, non-modal action menu, pre-filtered client-side via
 * legalityPreFilter (resolves BL-0004). Only currently-legal actions are enabled; a disabled
 * entry always shows why (FR-1320's "no dead menu entries" rule).
 */
import type { PlayerId, PlayerState } from '@owchess/shared';
import { computeLegalActions, type ActionKind } from '../legality/legalityPreFilter.js';

export interface ActionMenuProps {
  ownState: PlayerState;
  activeTurn: PlayerId;
  onSelectAction: (action: ActionKind) => void;
}

const LABELS: Record<ActionKind, string> = {
  pass: 'Pass',
  deploy: 'Deploy Asset',
  maneuver: 'Maneuver',
  task: 'Task Sensor',
  engage: 'Engage',
};

export function ActionMenu({ ownState, activeTurn, onSelectAction }: ActionMenuProps) {
  const legality = computeLegalActions(ownState, activeTurn);

  return (
    <div className="action-menu" data-testid="action-menu">
      {(Object.keys(LABELS) as ActionKind[]).map((kind) => {
        const result = legality[kind];
        return (
          <button
            key={kind}
            type="button"
            disabled={!result.legal}
            title={result.legal ? undefined : result.reason}
            data-testid={`action-${kind}`}
            onClick={() => onSelectAction(kind)}
          >
            {LABELS[kind]}
            {!result.legal && result.reason ? ` (${result.reason})` : ''}
          </button>
        );
      })}
    </div>
  );
}
