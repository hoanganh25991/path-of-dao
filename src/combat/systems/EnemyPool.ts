import type { Enemy } from '@/combat/entities/Enemy';

const PREWARM_COUNT = 10;

/**
 * Per-enemy-type pool (sub-plan 08 §7). Released enemies are hidden and
 * body-disabled, never destroyed, to avoid GC spikes on mobile.
 *
 * The Phaser-facing factory is injected so pooling logic stays unit-testable.
 */
export class EnemyPool {
  private readonly free = new Map<string, Enemy[]>();
  private readonly active = new Set<Enemy>();

  constructor(private readonly create: (enemyId: string) => Enemy) {}

  /** Instantiate PREWARM_COUNT instances per type up front (map load). */
  prewarm(enemyIds: string[]): void {
    for (const id of enemyIds) {
      const list = this.free.get(id) ?? [];
      while (list.length < PREWARM_COUNT) {
        list.push(this.create(id));
      }
      this.free.set(id, list);
    }
  }

  acquire(enemyId: string, x: number, y: number): Enemy {
    const list = this.free.get(enemyId) ?? [];
    const enemy = list.pop() ?? this.create(enemyId);
    this.free.set(enemyId, list);

    enemy.spawnAt(x, y);
    this.active.add(enemy);
    return enemy;
  }

  release(enemy: Enemy): void {
    if (!this.active.delete(enemy)) return;

    enemy.deactivate();
    const list = this.free.get(enemy.config.id) ?? [];
    list.push(enemy);
    this.free.set(enemy.config.id, list);
  }

  get aliveEnemies(): ReadonlySet<Enemy> {
    return this.active;
  }

  get aliveCount(): number {
    return this.active.size;
  }

  releaseAll(): void {
    for (const enemy of [...this.active]) {
      this.release(enemy);
    }
  }

  /** Destroy every pooled GameObject (scene teardown). */
  destroy(): void {
    this.releaseAll();
    for (const list of this.free.values()) {
      for (const enemy of list) enemy.destroy();
    }
    this.free.clear();
  }
}
