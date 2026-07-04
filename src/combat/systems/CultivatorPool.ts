import type { Cultivator } from '@/combat/entities/Cultivator';

/** Prewarm enough instances for mass-tier live cap (EncounterScaling maxAlive = 18). */
const PREWARM_COUNT = 20;

/**
 * Per-cultivator-type pool (sub-plan 08 §7). Released cultivators are hidden and
 * body-disabled, never destroyed, to avoid GC spikes on mobile.
 */
export class CultivatorPool {
  private readonly free = new Map<string, Cultivator[]>();
  private readonly active = new Set<Cultivator>();

  constructor(private readonly create: (cultivatorId: string) => Cultivator) {}

  /** Instantiate PREWARM_COUNT instances per type up front (map load). */
  prewarm(cultivatorIds: string[]): void {
    for (const id of cultivatorIds) {
      const list = this.free.get(id) ?? [];
      while (list.length < PREWARM_COUNT) {
        list.push(this.create(id));
      }
      this.free.set(id, list);
    }
  }

  acquire(cultivatorId: string, x: number, y: number): Cultivator {
    const list = this.free.get(cultivatorId) ?? [];
    const cultivator = list.pop() ?? this.create(cultivatorId);
    this.free.set(cultivatorId, list);

    cultivator.spawnAt(x, y);
    this.active.add(cultivator);
    return cultivator;
  }

  release(cultivator: Cultivator): void {
    if (!this.active.delete(cultivator)) return;

    cultivator.deactivate();
    const list = this.free.get(cultivator.config.id) ?? [];
    list.push(cultivator);
    this.free.set(cultivator.config.id, list);
  }

  get aliveCultivators(): ReadonlySet<Cultivator> {
    return this.active;
  }

  /** @deprecated Use aliveCultivators */
  get aliveEnemies(): ReadonlySet<Cultivator> {
    return this.aliveCultivators;
  }

  get aliveCount(): number {
    return this.active.size;
  }

  /** Cultivators still able to fight (not in defeated/recovery pose). */
  get combatReadyCount(): number {
    let n = 0;
    for (const cultivator of this.active) {
      if (cultivator.isCombatReady) n += 1;
    }
    return n;
  }

  get combatReadyCultivators(): Cultivator[] {
    return [...this.active].filter((c) => c.isCombatReady);
  }

  /** @deprecated Use combatReadyCultivators */
  get combatReadyEnemies(): Cultivator[] {
    return this.combatReadyCultivators;
  }

  releaseAll(): void {
    for (const cultivator of [...this.active]) {
      this.release(cultivator);
    }
  }

  /** Destroy every pooled GameObject (scene teardown). */
  destroy(): void {
    this.releaseAll();
    for (const list of this.free.values()) {
      for (const cultivator of list) cultivator.destroy();
    }
    this.free.clear();
  }
}

/** @deprecated Use CultivatorPool */
export const EnemyPool = CultivatorPool;
