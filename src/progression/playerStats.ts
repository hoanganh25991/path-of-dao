import { statsForLevel } from '@/progression/LevelCurve';
import { applyRealmScaling } from '@/progression/RealmStatScaling';
import type { BaseStats } from '@/progression/types';

/** Level-curve base stats with cumulative realm scaling applied. */
export function buildPlayerStats(heroId: string, level: number, realmId: string): BaseStats {
  const base = statsForLevel(heroId, level);
  return applyRealmScaling(base, realmId);
}
