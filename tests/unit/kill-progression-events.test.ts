import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import { computeKillRewards } from '@/combat/systems/rewards';
import { emitKillProgressionEvents } from '@/combat/systems/killProgressionEvents';
import { xpForLevel } from '@/progression/LevelCurve';
import { CultivationRealm } from '@/progression/CultivationRealm';

const slime = getEnemyConfig('enemy.slime');

describe('emitKillProgressionEvents', () => {
  it('emits xp-gained on every kill and level-up with sub-tier at new level', () => {
    const save = SaveManager.createNew();
    save.xp = xpForLevel(1) - 1;
    const rewards = computeKillRewards(save, slime, () => 0);

    const xpGained = vi.fn();
    const levelUp = vi.fn();
    EventBus.on('progression:xp-gained', xpGained);
    EventBus.on('progression:level-up', levelUp);

    emitKillProgressionEvents(rewards, save.xp, save.realm.id);

    expect(xpGained).toHaveBeenCalledWith({
      xpTotal: rewards.xpTotal,
      xpGained: rewards.xpTotal - save.xp,
      level: rewards.level,
    });
    expect(levelUp).toHaveBeenCalledWith({
      level: rewards.level,
      realmId: 'mortal_body',
      tier: CultivationRealm.updateTierFromLevel('mortal_body', rewards.level),
    });

    EventBus.clear();
  });
});
