import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
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
    render(<App client={client} sessionId="s1" />);

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
    render(<App client={client} sessionId="s1" />);

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
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureStateDelta()));
    act(() => socket.deliver({ type: 'disconnect-notification' }));
    expect(screen.getByTestId('disconnect-banner')).toBeDefined();
  });

  it('shows a rejection banner distinct from a pre-filtered unavailable action', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureStateDelta()));
    act(() => socket.deliver({ type: 'action-rejected', reason: 'insufficient AP' }));
    expect(screen.getByTestId('rejection-banner').textContent).toContain('insufficient AP');
  });
});

describe('App (IP-9062, closes BL-0062) — Maneuver/Task/Engage targeting pickers', () => {
  afterEach(() => cleanup());

  function fixtureWithFullRoster(): StateDeltaMessage {
    const base = fixtureStateDelta();
    return {
      ...base,
      ownState: {
        ...base.ownState,
        assets: [
          {
            assetId: 'sensor-1', ownerId: 'alice', templateId: 'wide-area-sda-radar', basing: 'ground',
            chainRoles: ['find', 'fix'], trueRegime: 'LEO-EQUATORIAL', maneuverState: null, deployState: null,
            activeEffects: [], isKing: false, missionSet: null, consecutiveDenialTurns: 0,
            totalDenialTurns: 0, destroyed: false,
          },
          {
            assetId: 'jammer-1', ownerId: 'alice', templateId: 'ew-jamming-effector', basing: 'space',
            chainRoles: ['engage'], trueRegime: 'GEO-EQUATORIAL', maneuverState: null, deployState: null,
            activeEffects: [], isKing: false, missionSet: null, consecutiveDenialTurns: 0,
            totalDenialTurns: 0, destroyed: false,
          },
        ],
      },
      opponentView: {
        playerId: 'bob',
        beliefEntries: [
          { subject: 'bob-asset-1', precision: 'track', lastUpdatedTurn: 1, sourceAssetId: 'sensor-1', deceived: false, apparentRegime: 'MEO-EQUATORIAL' },
        ],
      },
    };
  }

  it('clicking Deploy Asset in the Action Menu is a deliberate no-op (Deploy lives in the Asset Tray)', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureStateDelta()));
    fireEvent.click(screen.getByTestId('action-deploy'));
    expect(socket.sent).toEqual([]);
  });

  it('clicking Maneuver opens ManeuverPicker; submitting sends a fully-populated payload', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureStateDelta()));

    fireEvent.click(screen.getByTestId('action-maneuver'));
    expect(screen.getByTestId('maneuver-picker')).toBeDefined();
    fireEvent.change(screen.getByTestId('maneuver-asset-select'), { target: { value: 'alice-king' } });
    fireEvent.change(screen.getByTestId('maneuver-regime-select'), { target: { value: 'LEO-POLAR' } });
    fireEvent.click(screen.getByTestId('maneuver-submit'));

    expect(socket.sent).toHaveLength(1);
    const sent = JSON.parse(socket.sent[0]);
    expect(sent).toEqual({
      type: 'action',
      sessionId: 's1',
      action: { type: 'maneuver', payload: { assetId: 'alice-king', targetRegime: 'LEO-POLAR' } },
    });
    expect(screen.queryByTestId('maneuver-picker')).toBeNull();
  });

  it('clicking Task Sensor opens TaskPicker; submitting sends a fully-populated payload', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureWithFullRoster()));

    fireEvent.click(screen.getByTestId('action-task'));
    expect(screen.getByTestId('task-picker')).toBeDefined();
    fireEvent.change(screen.getByTestId('task-source-select'), { target: { value: 'sensor-1' } });
    fireEvent.change(screen.getByTestId('task-regime-select'), { target: { value: 'MEO-EQUATORIAL' } });
    fireEvent.click(screen.getByTestId('task-submit'));

    expect(socket.sent).toHaveLength(1);
    const sent = JSON.parse(socket.sent[0]);
    expect(sent.action).toEqual({ type: 'task', payload: { sourceAssetId: 'sensor-1', targetRegime: 'MEO-EQUATORIAL' } });
  });

  it('clicking Engage opens EngagePicker; submitting sends a fully-populated payload', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureWithFullRoster()));

    fireEvent.click(screen.getByTestId('action-engage'));
    expect(screen.getByTestId('engage-picker')).toBeDefined();
    fireEvent.click(screen.getByTestId('engage-submit'));

    expect(socket.sent).toHaveLength(1);
    const sent = JSON.parse(socket.sent[0]);
    expect(sent.action.type).toBe('engage');
    expect(sent.action.payload).toEqual({
      effectorAssetId: 'jammer-1',
      targetAssetId: 'bob-asset-1',
      effect: sent.action.payload.effect,
    });
    expect(typeof sent.action.payload.effect).toBe('string');
  });

  it('cancelling a picker closes it without sending anything', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);
    act(() => socket.deliver(fixtureStateDelta()));
    fireEvent.click(screen.getByTestId('action-maneuver'));
    fireEvent.click(screen.getByTestId('maneuver-cancel'));
    expect(screen.queryByTestId('maneuver-picker')).toBeNull();
    expect(socket.sent).toEqual([]);
  });
});
