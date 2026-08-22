import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '../SessionStore.js';
import { TurnManager } from '../TurnManager.js';
import { GameEngine } from '../GameEngine.js';
import { TemplateRegistry } from '../TemplateRegistry.js';
import { assertOnline, makeDeployHandler, tickDeployStates } from '../deployAction.js';

describe('deploy action (IP-3010)', () => {
  let store: SessionStore;
  let engine: GameEngine;
  let registry: TemplateRegistry;
  let sessionId: string;

  beforeEach(() => {
    store = new SessionStore();
    engine = new GameEngine(store);
    registry = new TemplateRegistry();
    registry.registerAssetTemplate({
      templateId: 'ground-tracking-array',
      basing: 'ground',
      apCost: 2,
      timeToOnline: 1,
      chainRoles: ['find', 'fix'],
      regimeAffinity: ['LEO-EQUATORIAL'],
    });
    registry.registerAssetTemplate({
      templateId: 'space-based-sda-sensor',
      basing: 'space',
      apCost: 3,
      timeToOnline: 3,
      chainRoles: ['find', 'fix', 'track'],
      regimeAffinity: ['LEO-POLAR'],
    });

    sessionId = store.createSession('alice');
    store.joinSession(sessionId, 'bob');
    store.submitKingDeployment(sessionId, 'alice', 'satcom', 'GEO-EQUATORIAL');
    store.submitKingDeployment(sessionId, 'bob', 'isr', 'LEO-POLAR');

    const turnManagers = new Map<string, TurnManager>();
    const turnManagerFor = (sid: string) => {
      let tm = turnManagers.get(sid);
      if (!tm) {
        tm = new TurnManager(store, sid);
        turnManagers.set(sid, tm);
      }
      return tm;
    };
    engine.registerHandler('deploy', makeDeployHandler(store, turnManagerFor, registry));
  });

  it('deploys successfully, deducting AP cost and setting deployState (FR-3400)', () => {
    const result = engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'ground-tracking-array', targetRegime: 'LEO-EQUATORIAL' },
    });
    expect(result.accepted).toBe(true);
    const player = store.getPlayerState(sessionId, 'alice')!;
    expect(player.apRemaining).toBe(3); // 5 - 2
    expect(player.assets).toHaveLength(1);
    expect(player.assets[0].deployState).toEqual({ turnsUntilOnline: 1 });
  });

  it('rejects deploy on insufficient AP, with no cap otherwise (BL-0013)', () => {
    // Spend down to 1 AP first via three cheap ground deploys (2 AP each -> not enough for
    // a second one, so use direct AP manipulation for a crisp insufficiency test instead).
    const player = store.getPlayerState(sessionId, 'alice')!;
    player.apRemaining = 1;
    const result = engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'ground-tracking-array', targetRegime: 'LEO-EQUATORIAL' },
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/insufficient AP/);
  });

  it('computes onlineAt/turnsUntilOnline correctly for ground vs. space (FR-3300)', () => {
    engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'ground-tracking-array', targetRegime: 'LEO-EQUATORIAL' },
    });
    const player = store.getPlayerState(sessionId, 'alice')!;
    // Reset AP so the second deploy isn't blocked by scarcity for this cost-time-only assertion.
    player.apRemaining = 5;
    engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'space-based-sda-sensor', targetRegime: 'LEO-POLAR' },
    });
    expect(player.assets[0].deployState?.turnsUntilOnline).toBe(1); // ground: faster
    expect(player.assets[1].deployState?.turnsUntilOnline).toBe(3); // space: slower
  });

  it('blocks a pre-online asset from use via assertOnline (FR-3500)', () => {
    engine.handleAction(sessionId, 'alice', {
      type: 'deploy',
      payload: { templateId: 'space-based-sda-sensor', targetRegime: 'LEO-POLAR' },
    });
    const asset = store.getPlayerState(sessionId, 'alice')!.assets[0];
    expect(assertOnline(asset, 1).ok).toBe(false);
    tickDeployStates([asset]);
    tickDeployStates([asset]);
    tickDeployStates([asset]);
    expect(asset.deployState).toBeNull();
    expect(assertOnline(asset, 4).ok).toBe(true);
  });
});
