/**
 * EventLog (IP-8010) — appends each resolved action's EventRecord in order, human-readable.
 */
import type { EventRecord } from '@owchess/shared';

export interface EventLogProps {
  eventLog: EventRecord[];
}

export function EventLog({ eventLog }: EventLogProps) {
  return (
    <div className="event-log" data-testid="event-log">
      {eventLog.map((entry, i) => (
        <div key={i} data-testid={`event-${i}`}>
          Turn {entry.turnNumber} — {entry.actingPlayerId}: {entry.actionType} — {entry.stateDeltaSummary}
        </div>
      ))}
    </div>
  );
}
