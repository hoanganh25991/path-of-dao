import { describe, expect, it } from 'vitest';
import { EnemyPool } from '@/combat/systems/EnemyPool';
import type { Enemy } from '@/combat/entities/Enemy';

/** Minimal stand-in for the Phaser-backed Enemy. */
function makeFakeEnemy(enemyId: string) {
  return {
    config: { id: enemyId },
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

type FakeEnemy = ReturnType<typeof makeFakeEnemy>;

function makePool() {
  const created: FakeEnemy[] = [];
  const pool = new EnemyPool((id) => {
    const fake = makeFakeEnemy(id);
    created.push(fake);
    return fake as unknown as Enemy;
  });
  return { pool, created };
}

describe('EnemyPool', () => {
  it('reuses the same instance after release', () => {
    const { pool, created } = makePool();

    const first = pool.acquire('enemy.slime', 10, 20);
    pool.release(first);
    const second = pool.acquire('enemy.slime', 30, 40);

    expect(second).toBe(first);
    expect(created).toHaveLength(1);
    expect((first as unknown as FakeEnemy).deactivated).toBe(1);
    expect((first as unknown as FakeEnemy).spawned).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it('prewarms instances without activating them', () => {
    const { pool, created } = makePool();
    pool.prewarm(['enemy.slime', 'enemy.archer']);

    expect(created).toHaveLength(20); // 10 per type
    expect(pool.aliveCount).toBe(0);

    pool.acquire('enemy.slime', 0, 0);
    expect(created).toHaveLength(20); // reused, not newly created
    expect(pool.aliveCount).toBe(1);
  });

  it('tracks alive enemies and releases them all', () => {
    const { pool } = makePool();
    pool.acquire('enemy.slime', 0, 0);
    pool.acquire('enemy.slime', 1, 1);
    expect(pool.aliveCount).toBe(2);

    pool.releaseAll();
    expect(pool.aliveCount).toBe(0);
  });

  it('destroys pooled game objects on teardown', () => {
    const { pool, created } = makePool();
    const enemy = pool.acquire('enemy.slime', 0, 0);
    pool.release(enemy);
    pool.destroy();

    expect(created.every((e) => e.destroyed === 1)).toBe(true);
  });
});
