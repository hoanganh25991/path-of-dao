import type { BossPhaseConfig } from '@/combat/cultivators/CultivatorConfig';

export interface BossPhaseCrossing {
  /** Ordinal position in the sorted (descending hpThreshold) phase list. */
  phaseIndex: number;
  hpThreshold: number;
  phase: BossPhaseConfig;
}

/** Tracks boss HP thresholds, pending add spawns, and phase transitions (sub-plan 23). */
export class BossPhaseTracker {
  private phaseIndex = 0;
  private pendingSpawns: { id: string; count: number }[] = [];
  private pendingCrossings: BossPhaseCrossing[] = [];

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
      this.pendingCrossings.push({
        phaseIndex: this.phaseIndex,
        hpThreshold: phase.hpThreshold,
        phase,
      });
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

  /** Phase transitions crossed since the last call — drives the phase-changed event + telegraph overrides. */
  consumeCrossings(): BossPhaseCrossing[] {
    const out = [...this.pendingCrossings];
    this.pendingCrossings = [];
    return out;
  }

  reset(): void {
    this.phaseIndex = 0;
    this.pendingSpawns = [];
    this.pendingCrossings = [];
  }
}
