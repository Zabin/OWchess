/**
 * Landing (IP-9038, closes BL-0055) — the "produce a shareable join link" UI FS-101 W1 assumed
 * but no package ever built. Shown when the URL carries no sessionId/playerId yet.
 */
import { useState } from 'react';

export interface LandingProps {
  onEnter: (sessionId: string, playerId: string) => void;
}

export function Landing({ onEnter }: LandingProps) {
  const [joinSessionId, setJoinSessionId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function createGame() {
    setError(null);
    const res = await fetch('/api/sessions', { method: 'POST' });
    const body = await res.json();
    if (!res.ok) {
      setError(body.reason ?? 'failed to create session');
      return;
    }
    onEnter(body.sessionId, body.playerId);
  }

  async function joinGame() {
    setError(null);
    if (!joinSessionId.trim()) {
      setError('enter a session ID to join');
      return;
    }
    const res = await fetch(`/api/sessions/${encodeURIComponent(joinSessionId.trim())}/join`, {
      method: 'POST',
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.reason ?? 'failed to join session');
      return;
    }
    onEnter(joinSessionId.trim(), body.playerId);
  }

  return (
    <div className="landing" data-testid="landing">
      <h1>OW Chess</h1>
      <button type="button" data-testid="create-game" onClick={() => void createGame()}>
        Create Game
      </button>
      <div>
        <input
          type="text"
          data-testid="join-session-input"
          placeholder="Paste a session ID"
          value={joinSessionId}
          onChange={(e) => setJoinSessionId(e.target.value)}
        />
        <button type="button" data-testid="join-game" onClick={() => void joinGame()}>
          Join Game
        </button>
      </div>
      {error && <div data-testid="landing-error">{error}</div>}
    </div>
  );
}
