import { describe, expect, it } from 'vitest';
import { BossPhaseTracker } from '@/combat/ai/BossPhaseTracker';
import { emitBossPhaseCrossings } from '@/combat/ai/bossPhaseEvents';
import { EventBus } from '@/core/EventBus';

describe('BossPhaseTracker crossings (sub-plan 23 — distinct boss patterns)', () => {
  it('records a crossing per threshold, in sorted descending order', () => {
    const tracker = new BossPhaseTracker([
      { hpThreshold: 0.5, spawnAdds: [{ id: 'enemy.slime', count: 2 }] },
      { hpThreshold: 1, spawnAdds: [] },
    ]);

    tracker.onHpRatio(0.4);
    const crossings = tracker.consumeCrossings();

    expect(crossings).toHaveLength(2);
    expect(crossings[0]).toMatchObject({ phaseIndex: 0, hpThreshold: 1 });
    expect(crossings[1]).toMatchObject({ phaseIndex: 1, hpThreshold: 0.5 });
  });

  it('carries per-phase telegraph overrides on the crossing', () => {
    const tracker = new BossPhaseTracker([
      { hpThreshold: 1 },
      { hpThreshold: 0.5, attackShape: 'aoe_ring', telegraphMs: 200 },
    ]);

    tracker.onHpRatio(0.3);
    const crossings = tracker.consumeCrossings();

    expect(crossings[1]!.phase.attackShape).toBe('aoe_ring');
    expect(crossings[1]!.phase.telegraphMs).toBe(200);
  });

  it('only reports newly crossed phases on subsequent calls', () => {
    const tracker = new BossPhaseTracker([{ hpThreshold: 1 }, { hpThreshold: 0.5 }, { hpThreshold: 0.25 }]);

    tracker.onHpRatio(0.6);
    expect(tracker.consumeCrossings()).toHaveLength(1);

    tracker.onHpRatio(0.4);
    expect(tracker.consumeCrossings()).toHaveLength(1);

    tracker.onHpRatio(0.4);
    expect(tracker.consumeCrossings()).toHaveLength(0);
  });

  it('resets phase index and pending state', () => {
    const tracker = new BossPhaseTracker([{ hpThreshold: 1 }, { hpThreshold: 0.5 }]);
    tracker.onHpRatio(0.4);
    tracker.reset();
    expect(tracker.consumeCrossings()).toHaveLength(0);

    tracker.onHpRatio(0.4);
    expect(tracker.consumeCrossings()).toHaveLength(2);
  });
});

describe('emitBossPhaseCrossings (sub-plan 23 — distinct boss patterns)', () => {
  it('emits combat:boss-phase-changed for real phase shifts only, skipping the opening phase', () => {
    const received: Array<{ bossId: string; phaseIndex: number; hpThreshold: number }> = [];
    const unsub = EventBus.on('combat:boss-phase-changed', (payload) => received.push(payload));

    emitBossPhaseCrossings('boss.test', [
      { phaseIndex: 0, hpThreshold: 1, phase: { hpThreshold: 1 } },
      { phaseIndex: 1, hpThreshold: 0.5, phase: { hpThreshold: 0.5 } },
    ]);

    unsub();
    expect(received).toEqual([{ bossId: 'boss.test', phaseIndex: 1, hpThreshold: 0.5 }]);
  });

  it('emits nothing when only the opening phase crossed', () => {
    const received: unknown[] = [];
    const unsub = EventBus.on('combat:boss-phase-changed', (payload) => received.push(payload));

    emitBossPhaseCrossings('boss.test', [{ phaseIndex: 0, hpThreshold: 1, phase: { hpThreshold: 1 } }]);

    unsub();
    expect(received).toHaveLength(0);
  });
});
