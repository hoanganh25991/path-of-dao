import { EventBus } from '@/core/EventBus';
import type { BossPhaseCrossing } from '@/combat/ai/BossPhaseTracker';

/**
 * Emits `combat:boss-phase-changed` for genuine phase transitions. The first crossing
 * (`phaseIndex === 0`, typically `hpThreshold: 1`) just marks "boss entered combat" and
 * fires on the opening hit of every fight — skip it so juice/audio only trigger on
 * real phase shifts (sub-plan 23 — distinct boss patterns).
 */
export function emitBossPhaseCrossings(bossId: string, crossings: BossPhaseCrossing[]): void {
  for (const crossing of crossings) {
    if (crossing.phaseIndex === 0) continue;
    EventBus.emit('combat:boss-phase-changed', {
      bossId,
      phaseIndex: crossing.phaseIndex,
      hpThreshold: crossing.hpThreshold,
    });
  }
}
