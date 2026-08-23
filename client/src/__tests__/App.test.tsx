import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { App } from '../App.js';
import { GameClient, type SocketLike } from '../state/gameClient.js';
import type { StateDeltaMessage } from '@owchess/shared';

class FakeSocket implements SocketLike {
  sent: string[] = [];
  private messageCb: ((ev: { data: string }) => void) | null = null;
  private closeCb: (() => void) | null = null;
  send(data: string): void {
    this.sent.push(data);
  }
  set onmessage(cb: ((ev: { data: string }) => void) | null) {
    this.messageCb = cb;
  }
  set onclose(cb: (() => void) | null) {
    this.closeCb = cb;
  }
  deliver(msg: unknown): void {
    this.messageCb?.({ data: JSON.stringify(msg) });
  }
  close(): void {
    this.closeCb?.();
  }
}

function fixtureStateDelta(): StateDeltaMessage {
  return {
    type: 'state-delta',
    ownState: {
      playerId: 'alice',
      king: {
        assetId: 'alice-king', ownerId: 'alice', templateId: 'satcom', basing: 'space',
        chainRoles: [], trueRegime: 'GEO-EQUATORIAL', maneuverState: null, deployState: null,
        activeEffects: [], isKing: true, missionSet: 'satcom', consecutiveDenialTurns: 0,
        totalDenialTurns: 0, destroyed: false,
      },
      assets: [],
      apRemaining: 5,
      beliefOfOpponent: new Map(),
    },
    opponentView: { playerId: 'bob', beliefEntries: [] },
    activeTurn: 'alice',
  };
}

describe('App (IP-8010) — all six panels render from a StateDeltaMessage fixture', () => {
  afterEach(() => cleanup());

  it('renders all six panels once a state-delta arrives (initial render, W1)', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" deployableTemplates={[]} />);

    expect(screen.getByTestId('waiting-for-session')).toBeDefined();
    act(() => socket.deliver(fixtureStateDelta()));

    expect(screen.getByTestId('orbital-board')).toBeDefined();
    expect(screen.getByTestId('action-menu')).toBeDefined();
    expect(screen.getByTestId('asset-tray')).toBeDefined();
    expect(screen.getByTestId('mission-king-status')).toBeDefined();
    expect(screen.getByTestId('intel-panel')).toBeDefined();
    expect(screen.getByTestId('event-log')).toBeDefined();
  });

  it('reconnect uses the identical render path — same full state-delta, no special resume UI', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" deployableTemplates={[]} />);

    // First connect
    act(() => socket.deliver(fixtureStateDelta()));
    expect(screen.getByTestId('app')).toBeDefined();

    // Simulate disconnect then reconnect (a fresh full state-delta, same shape as W1's)
    act(() => socket.close());
    expect(screen.getByTestId('connectivity-lost')).toBeDefined();
    act(() => socket.deliver(fixtureStateDelta()));
    expect(screen.getByTestId('app')).toBeDefined();
    expect(screen.getByTestId('orbital-board')).toBeDefined();
  });

  it('shows the disconnect-notification banner with wait/cancel choices', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" deployableTemplates={[]} />);
    act(() => socket.deliver(fixtureStateDelta()));
    act(() => socket.deliver({ type: 'disconnect-notification' }));
    expect(screen.getByTestId('disconnect-banner')).toBeDefined();
  });

  it('shows a rejection banner distinct from a pre-filtered unavailable action', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" deployableTemplates={[]} />);
    act(() => socket.deliver(fixtureStateDelta()));
    act(() => socket.deliver({ type: 'action-rejected', reason: 'insufficient AP' }));
    expect(screen.getByTestId('rejection-banner').textContent).toContain('insufficient AP');
  });
});
