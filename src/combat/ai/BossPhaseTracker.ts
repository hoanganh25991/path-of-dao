import type { BossPhaseConfig } from '@/combat/enemies/EnemyConfig';

/** Tracks boss HP thresholds and pending add spawns (sub-plan 23). */
export class BossPhaseTracker {
  private phaseIndex = 0;
  private pendingSpawns: { id: string; count: number }[] = [];

  constructor(private readonly phases: BossPhaseConfig[]) {
    this.phases = [...phases].sort((a, b) => b.hpThreshold - a.hpThreshold);
  }

  onHpRatio(hpRatio: number): { id: string; count: number }[] {
    const spawns: { id: string; count: number }[] = [];
    while (
      this.phaseIndex < this.phases.length &&
      hpRatio <= this.phases[this.phaseIndex]!.hpThreshold
    ) {
      const phase = this.phases[this.phaseIndex]!;
      if (phase.spawnAdds?.length) {
        spawns.push(...phase.spawnAdds);
      }
      this.phaseIndex += 1;
    }
    if (spawns.length) this.pendingSpawns.push(...spawns);
    return spawns;
  }

  consumePendingSpawns(): { id: string; count: number }[] {
    const out = [...this.pendingSpawns];
    this.pendingSpawns = [];
    return out;
  }

  reset(): void {
    this.phaseIndex = 0;
    this.pendingSpawns = [];
  }
}
