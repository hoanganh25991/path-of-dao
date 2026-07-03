import type { JourneyEntry, PlayerSaveV1 } from '@/core/save/SaveSchema';
import { computeCombatPowerFromSave } from '@/progression/CombatPower';

export type JourneyKind = JourneyEntry['kind'];

/**
 * Build a journey step stamped with the player's strength at this moment.
 * The snapshot (realm/level/cp) is what powers the "how strong was I here"
 * read-back on the My Path scroll — do NOT recompute it later.
 */
export function makeJourneyEntry(
  save: PlayerSaveV1,
  kind: JourneyKind,
  refId: string,
  mapId: string | null = null,
): JourneyEntry {
  return {
    kind,
    refId,
    mapId,
    realmId: save.realm.id,
    level: save.stats.level,
    cp: computeCombatPowerFromSave(save),
    at: new Date().toISOString(),
  };
}

/** Append a step unless (kind, refId) is already recorded — each milestone logs once. */
export function appendJourneyStep(
  journey: JourneyEntry[],
  entry: JourneyEntry,
): JourneyEntry[] {
  if (journey.some((e) => e.kind === entry.kind && e.refId === entry.refId)) {
    return journey;
  }
  return [...journey, entry];
}

/** Convenience — record a milestone into a save's progress, returning the new journey array. */
export function recordJourney(
  save: PlayerSaveV1,
  kind: JourneyKind,
  refId: string,
  mapId: string | null = null,
): JourneyEntry[] {
  return appendJourneyStep(save.progress.journey, makeJourneyEntry(save, kind, refId, mapId));
}
