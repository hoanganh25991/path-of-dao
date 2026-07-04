import type { EncounterConfig } from '@/combat/cultivators/CultivatorConfig';

/** Encounter density tier — drives spawn counts and combat camera zoom. */
export type EncounterTier = 'solo' | 'squad' | 'horde' | 'mass';

export interface EncounterScale {
  tier: EncounterTier;
  /** Total enemies to spawn across the wave (after scaling). */
  targetCount: number;
  /** Live cap while queue drains — mass uses full pool budget. */
  maxAlive: number;
}

const TIER_TARGETS: Record<EncounterTier, number> = {
  solo: 1,
  squad: 10,
  horde: 100,
  mass: 500,
};

const TIER_MAX_ALIVE: Record<EncounterTier, number> = {
  solo: 3,
  squad: 12,
  horde: 18,
  mass: 18,
};

/** Camera zoom targets per tier (Phaser zoom — higher = closer). */
export const ENCOUNTER_ZOOM: Record<EncounterTier, number> = {
  solo: 1.3,
  squad: 1.0,
  horde: 0.72,
  mass: 0.58,
};

/**
 * Map power vs recommended realm → encounter density.
 * Weak on map: 1v1 duels. At cap: squads. Over-leveled return: horde / mass wipe fantasy.
 */
export function resolveEncounterScale(
  playerRealmOrder: number,
  mapRealmOrder: number,
  playerLevel = 1,
): EncounterScale {
  const delta = playerRealmOrder - mapRealmOrder;
  const levelBoost = playerLevel >= 12 ? 1 : 0;

  let tier: EncounterTier;
  if (delta <= -1) {
    tier = 'solo';
  } else if (delta === 0 && levelBoost === 0) {
    tier = 'squad';
  } else if (delta <= 1) {
    tier = 'horde';
  } else {
    tier = 'mass';
  }

  return {
    tier,
    targetCount: TIER_TARGETS[tier],
    maxAlive: TIER_MAX_ALIVE[tier],
  };
}

/** Zoom from active combat-ready enemy count (live battle feel). */
export function zoomForActiveEnemies(count: number): number {
  if (count <= 1) return ENCOUNTER_ZOOM.solo;
  if (count <= 10) return ENCOUNTER_ZOOM.squad;
  if (count <= 100) return ENCOUNTER_ZOOM.horde;
  return ENCOUNTER_ZOOM.mass;
}

/** Max temporary zoom-in from attacks/skills — smaller when many cultivators are active. */
export function engagementBoostCap(activeCultivatorCount: number): number {
  if (activeCultivatorCount <= 1) return 0.6;
  if (activeCultivatorCount <= 10) return 0.4;
  if (activeCultivatorCount <= 100) return 0.15;
  return 0;
}

function countWaveEnemies(wave: EncounterConfig['waves'][number]): number {
  return wave.enemies.reduce((sum, g) => sum + g.count, 0);
}

/**
 * Scale first wave enemy counts toward `targetCount`, preserving enemy mix ratios.
 * Boss / ordeal maps keep at least one of each listed type.
 */
export function scaleEncounterForPower(
  encounter: EncounterConfig,
  scale: EncounterScale,
): EncounterConfig {
  if (encounter.waves.length === 0) return encounter;

  const baseWave = encounter.waves[0]!;
  const baseTotal = countWaveEnemies(baseWave);
  if (baseTotal <= 0 || scale.targetCount <= baseTotal) {
    return encounter;
  }

  const ratio = scale.targetCount / baseTotal;
  const scaledFirst: EncounterConfig['waves'][number] = {
    trigger: baseWave.trigger,
    enemies: baseWave.enemies.map((group) => ({
      ...group,
      count: Math.max(1, Math.round(group.count * ratio)),
    })),
  };

  // Snap total to target (rounding drift).
  let scaledTotal = countWaveEnemies(scaledFirst);
  if (scaledTotal < scale.targetCount && scaledFirst.enemies.length > 0) {
    const head = scaledFirst.enemies[0]!;
    scaledFirst.enemies = [
      { ...head, count: head.count + (scale.targetCount - scaledTotal) },
      ...scaledFirst.enemies.slice(1),
    ];
    scaledTotal = scale.targetCount;
  }

  return {
    ...encounter,
    waves: [scaledFirst, ...encounter.waves.slice(1)],
  };
}
