/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

// CombatJuiceBridge value-imports JuiceController, which pulls in real 'phaser'
// (canvas/webgl bootstrapping jsdom can't satisfy). Stub the tiny runtime surface it needs.
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));

const { CombatJuiceBridge } = await import('@/combat/juice/CombatJuiceBridge');
const { EventBus } = await import('@/core/EventBus');
type JuiceController = InstanceType<Awaited<typeof import('@/combat/juice/JuiceController')>['JuiceController']>;

function createJuiceSpy(): JuiceController {
  return {
    applyHitJuice: vi.fn(),
    applyBossPhaseJuice: vi.fn(),
    setEnabled: vi.fn(),
    destroy: vi.fn(),
  } as unknown as JuiceController;
}

afterEach(() => {
  EventBus.clear();
});

describe('CombatJuiceBridge — boss phase screen darken wiring', () => {
  it('applies boss phase juice (screen darken) when combat:boss-phase-changed fires', () => {
    const juice = createJuiceSpy();
    const bridge = new CombatJuiceBridge({} as never, juice);
    bridge.mount();

    EventBus.emit('combat:boss-phase-changed', { bossId: 'boss.demo', phaseIndex: 1, hpThreshold: 0.5 });

    expect(juice.applyBossPhaseJuice).toHaveBeenCalledTimes(1);
    bridge.destroy();
  });

  it('stops reacting to boss-phase-changed once destroyed (no stale darken after scene teardown)', () => {
    const juice = createJuiceSpy();
    const bridge = new CombatJuiceBridge({} as never, juice);
    bridge.mount();
    bridge.destroy();

    EventBus.emit('combat:boss-phase-changed', { bossId: 'boss.demo', phaseIndex: 2, hpThreshold: 0.25 });

    expect(juice.applyBossPhaseJuice).not.toHaveBeenCalled();
  });

  it('also darkens on boss defeat / boss enemy-killed (existing juice hooks)', () => {
    const juice = createJuiceSpy();
    const bridge = new CombatJuiceBridge({} as never, juice);
    bridge.mount();

    EventBus.emit('map:cultivator-defeated', {
      cultivatorId: 'boss.demo',
      isBoss: true,
      wasRematch: false,
      isBeast: false,
    });

    expect(juice.applyBossPhaseJuice).toHaveBeenCalledTimes(1);
    bridge.destroy();
  });
});
