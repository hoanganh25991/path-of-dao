import baseStatsJson from '../../content/curves/base-stats.json';
import levelXpJson from '../../content/curves/level-xp.json';
import { baseStatsSchema, levelXpSchema } from '@/shared/schemas/curves';
import type { BaseStats } from '@/progression/types';

// Validated once at module load — invalid content JSON throws immediately (fail fast in dev).
const levelXp = levelXpSchema.parse(levelXpJson);
const baseStats = baseStatsSchema.parse(baseStatsJson);

export const MAX_LEVEL = levelXp.maxLevel;

/** XP required to advance from `level` to `level + 1`. Returns 0 at/above cap. */
export function xpForLevel(level: number): number {
  if (level < 1 || level >= levelXp.maxLevel) return 0;
  return levelXp.xpToNext[level] ?? 0;
}

/** Resolve total accumulated XP into a level + progress into that level. */
export function levelFromTotalXp(totalXp: number): { level: number; xpIntoLevel: number } {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  while (level < levelXp.maxLevel) {
    const needed = xpForLevel(level);
    if (needed === 0 || remaining < needed) break;
    remaining -= needed;
    level += 1;
  }

  return { level, xpIntoLevel: level >= levelXp.maxLevel ? 0 : remaining };
}

/** Base stats for a hero at a level (clamped to the data range). */
export function statsForLevel(heroId: string, level: number): BaseStats {
  const hero = baseStats.heroes[heroId];
  if (!hero) {
    throw new Error(`statsForLevel: unknown hero "${heroId}"`);
  }

  const clamped = Math.min(Math.max(1, Math.floor(level)), hero.levels.length);
  const row = hero.levels[clamped - 1];
  if (!row) {
    throw new Error(`statsForLevel: no stat row for ${heroId} level ${clamped}`);
  }

  return {
    level: row.level,
    hpMax: row.hpMax,
    manaMax: row.manaMax,
    atk: row.atk,
    def: row.def,
    crit: row.crit,
    critDmg: row.critDmg,
    speed: row.speed,
    spirit: row.spirit,
  };
}
