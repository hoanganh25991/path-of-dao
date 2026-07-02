import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import type { BaseStats } from '@/progression/types';
import { levelFromTotalXp, statsForLevel } from '@/progression/LevelCurve';
import type { EnemyConfig } from '@/combat/enemies/EnemyConfig';

export interface KillRewards {
  /** New total XP for the save. */
  xpTotal: number;
  /** Level after the XP grant. */
  level: number;
  /** New base stats — only set when the kill caused a level up. */
  statsAfterLevelUp: BaseStats | null;
  /** Gold rolled from the enemy's [min,max] range (paid out via pickup). */
  gold: number;
  /** Enemy id to append to progress.bestiary, or null if already recorded. */
  bestiaryAdd: string | null;
}

/** Pure kill-reward resolution (sub-plan 08 §9/§10) — testable, no side effects. */
export function computeKillRewards(
  save: PlayerSaveV1,
  enemy: EnemyConfig,
  random: () => number = Math.random,
): KillRewards {
  const xpTotal = save.xp + enemy.xpReward;
  const level = levelFromTotalXp(xpTotal).level;
  const leveledUp = level > save.stats.level;

  const [goldMin, goldMax] = enemy.goldReward;
  const gold = goldMin + Math.floor(random() * (goldMax - goldMin + 1));

  return {
    xpTotal,
    level,
    statsAfterLevelUp: leveledUp ? statsForLevel(save.heroId, level) : null,
    gold,
    bestiaryAdd: save.progress.bestiary.includes(enemy.id) ? null : enemy.id,
  };
}
