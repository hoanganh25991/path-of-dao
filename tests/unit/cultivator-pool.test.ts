import { describe, expect, it } from 'vitest';
import { CultivatorPool } from '@/combat/systems/CultivatorPool';
import type { Cultivator } from '@/combat/entities/Cultivator';

/** Minimal stand-in for the Phaser-backed Cultivator. */
function makeFakeCultivator(cultivatorId: string) {
  return {
    config: { id: cultivatorId },
    isCombatReady: true,
    spawned: [] as Array<{ x: number; y: number }>,
    deactivated: 0,
    destroyed: 0,
    spawnAt(x: number, y: number) {
      this.spawned.push({ x, y });
    },
    deactivate() {
      this.deactivated += 1;
    },
    destroy() {
      this.destroyed += 1;
    },
  };
}

type FakeCultivator = ReturnType<typeof makeFakeCultivator>;

function makePool() {
  const created: FakeCultivator[] = [];
  const pool = new CultivatorPool((id) => {
    const fake = makeFakeCultivator(id);
    created.push(fake);
    return fake as unknown as Cultivator;
  });
  return { pool, created };
}

describe('CultivatorPool', () => {
  it('reuses the same instance after release', () => {
    const { pool, created } = makePool();

    const first = pool.acquire('enemy.slime', 10, 20);
    pool.release(first);
    const second = pool.acquire('enemy.slime', 30, 40);

    expect(second).toBe(first);
    expect(created).toHaveLength(1);
    expect((first as unknown as FakeCultivator).deactivated).toBe(1);
    expect((first as unknown as FakeCultivator).spawned).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it('prewarms instances without activating them', () => {
    const { pool, created } = makePool();
    pool.prewarm(['enemy.slime', 'enemy.archer']);

    expect(created).toHaveLength(40); // 20 per type
    expect(pool.aliveCount).toBe(0);

    pool.acquire('enemy.slime', 0, 0);
    expect(created).toHaveLength(40);
    expect(pool.aliveCount).toBe(1);
  });

  it('tracks combat-ready cultivators separately from defeated', () => {
    const { pool, created } = makePool();
    const c = pool.acquire('enemy.slime', 0, 0) as unknown as FakeCultivator;
    expect(pool.combatReadyCount).toBe(1);

    c.isCombatReady = false;
    expect(pool.combatReadyCount).toBe(0);
    expect(pool.aliveCount).toBe(1);
    expect(created).toHaveLength(1);
  });

  it('tracks alive cultivators and releases them all', () => {
    const { pool } = makePool();
    pool.acquire('enemy.slime', 0, 0);
    pool.acquire('enemy.slime', 1, 1);
    expect(pool.aliveCount).toBe(2);

    pool.releaseAll();
    expect(pool.aliveCount).toBe(0);
  });

  it('destroys pooled game objects on teardown', () => {
    const { pool, created } = makePool();
    const cultivator = pool.acquire('enemy.slime', 0, 0);
    pool.release(cultivator);
    pool.destroy();

    expect(created.every((c) => c.destroyed === 1)).toBe(true);
  });
});
