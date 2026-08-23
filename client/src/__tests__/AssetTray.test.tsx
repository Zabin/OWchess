import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { App } from '../App.js';
import { GameClient, type SocketLike } from '../state/gameClient.js';
import type { StateDeltaMessage, TemplateCatalogMessage } from '@owchess/shared';

/**
 * BL-0048 (VR-8010 remediation): AssetTray previously had no test rendering it with non-empty
 * data at all — VR-8010's own live scratch render confirmed the component's own logic was
 * correct in isolation, but nothing in the committed suite exercised that path end-to-end.
 */
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
      apRemaining: 2,
      beliefOfOpponent: new Map(),
    },
    opponentView: { playerId: 'bob', beliefEntries: [] },
    activeTurn: 'alice',
  };
}

function fixtureTemplateCatalog(): TemplateCatalogMessage {
  return {
    type: 'template-catalog',
    templates: [
      { templateId: 'cheap-sensor', basing: 'ground', apCost: 1, timeToOnline: 1, chainRoles: ['find'], regimeAffinity: ['LEO-EQUATORIAL'] },
      { templateId: 'expensive-effector', basing: 'space', apCost: 5, timeToOnline: 3, chainRoles: ['engage'], regimeAffinity: ['GEO-EQUATORIAL'] },
    ],
  };
}

describe('AssetTray (IP-8010) — populated via TemplateCatalogMessage', () => {
  afterEach(() => cleanup());

  it('shows cost/time-to-online for every template, disabling unaffordable ones with a reason', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);

    act(() => socket.deliver(fixtureTemplateCatalog()));
    act(() => socket.deliver(fixtureStateDelta())); // apRemaining: 2

    const cheap = screen.getByTestId('deploy-cheap-sensor') as HTMLButtonElement;
    const expensive = screen.getByTestId('deploy-expensive-effector') as HTMLButtonElement;

    expect(cheap.disabled).toBe(false);
    expect(cheap.textContent).toContain('1 AP');
    expect(cheap.textContent).toContain('1 turn(s) to online');

    expect(expensive.disabled).toBe(true);
    expect(expensive.title).toContain('insufficient AP');
    expect(expensive.textContent).toContain('5 AP');
  });

  it('a subsequent state-delta does not clear the previously-delivered template catalog', () => {
    const socket = new FakeSocket();
    const client = new GameClient(socket);
    render(<App client={client} sessionId="s1" />);

    act(() => socket.deliver(fixtureTemplateCatalog()));
    act(() => socket.deliver(fixtureStateDelta()));
    expect(screen.getByTestId('deploy-cheap-sensor')).toBeDefined();

    // A second, ordinary state-delta (e.g. after a turn change) must not wipe the static catalog.
    act(() => socket.deliver(fixtureStateDelta()));
    expect(screen.getByTestId('deploy-cheap-sensor')).toBeDefined();
    expect(screen.getByTestId('deploy-expensive-effector')).toBeDefined();
  });
});
