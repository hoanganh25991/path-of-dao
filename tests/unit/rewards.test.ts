import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { xpForLevel } from '@/progression/LevelCurve';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import { computeKillRewards } from '@/combat/systems/rewards';

const slime = getEnemyConfig('enemy.slime');

describe('computeKillRewards', () => {
  it('adds XP to the save total', () => {
    const save = SaveManager.createNew();
    const rewards = computeKillRewards(save, slime, () => 0);
    expect(rewards.xpTotal).toBe(save.xp + slime.xpReward);
  });

  it('reports a level up with new stats when XP crosses the threshold', () => {
    const save = SaveManager.createNew();
    save.xp = xpForLevel(1) - 1; // one XP short of level 2

    const rewards = computeKillRewards(save, slime, () => 0);
    expect(rewards.level).toBeGreaterThanOrEqual(2);
    expect(rewards.statsAfterLevelUp).not.toBeNull();
    expect(rewards.statsAfterLevelUp?.level).toBe(rewards.level);
  });

  it('does not report stats when no level up occurred', () => {
    const save = SaveManager.createNew();
    const rewards = computeKillRewards(save, slime, () => 0);
    expect(rewards.statsAfterLevelUp).toBeNull();
  });

  it('rolls gold within the configured range', () => {
    const save = SaveManager.createNew();
    const [min, max] = slime.goldReward;

    expect(computeKillRewards(save, slime, () => 0).gold).toBe(min);
    expect(computeKillRewards(save, slime, () => 0.999999).gold).toBe(max);
  });

  it('adds the enemy to the bestiary only once', () => {
    const save = SaveManager.createNew();
    expect(computeKillRewards(save, slime, () => 0).bestiaryAdd).toBe(slime.id);

    save.progress.bestiary.push(slime.id);
    expect(computeKillRewards(save, slime, () => 0).bestiaryAdd).toBeNull();
  });
});
