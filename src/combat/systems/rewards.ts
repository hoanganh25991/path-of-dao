import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import type { BaseStats } from '@/progression/types';
import { levelFromTotalXp } from '@/progression/LevelCurve';
import { buildPlayerStats } from '@/progression/playerStats';
import type { CultivatorConfig } from '@/combat/cultivators/CultivatorConfig';

export interface KillRewards {
  /** New total XP for the save. */
  xpTotal: number;
  /** Level after the XP grant. */
  level: number;
  /** New base stats — only set when the defeat caused a level up. */
  statsAfterLevelUp: BaseStats | null;
  /** Gold rolled from the cultivator's [min,max] range (paid out via pickup). */
  gold: number;
  /** Cultivator id to append to progress.bestiary, or null if already recorded. */
  bestiaryAdd: string | null;
}

/** Pure defeat-reward resolution (sub-plan 08 §9/§10) — testable, no side effects. */
export function computeKillRewards(
  save: PlayerSaveV1,
  cultivator: CultivatorConfig,
  random: () => number = Math.random,
): KillRewards {
  const xpTotal = save.xp + cultivator.xpReward;
  const level = levelFromTotalXp(xpTotal).level;
  const leveledUp = level > save.stats.level;

  const [goldMin, goldMax] = cultivator.goldReward;
  const gold = goldMin + Math.floor(random() * (goldMax - goldMin + 1));

  return {
    xpTotal,
    level,
    statsAfterLevelUp: leveledUp ? buildPlayerStats(save.heroId, level, save.realm.id) : null,
    gold,
    bestiaryAdd: save.progress.bestiary.includes(cultivator.id) ? null : cultivator.id,
  };
}
