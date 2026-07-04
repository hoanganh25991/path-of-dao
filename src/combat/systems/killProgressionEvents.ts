import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { CultivationRealm } from '@/progression/CultivationRealm';
import type { KillRewards } from '@/combat/systems/rewards';

/** Combat HUD + audio hooks after kill XP is persisted to the store. */
export function emitKillProgressionEvents(
  rewards: KillRewards,
  xpBefore: number,
  realmId = gameStore.getState().save?.realm.id,
): void {
  EventBus.emit('progression:xp-gained', {
    xpTotal: rewards.xpTotal,
    xpGained: rewards.xpTotal - xpBefore,
    level: rewards.level,
  });

  if (!rewards.statsAfterLevelUp || !realmId) return;

  const tier = CultivationRealm.updateTierFromLevel(realmId, rewards.statsAfterLevelUp.level);
  EventBus.emit('progression:level-up', {
    level: rewards.statsAfterLevelUp.level,
    realmId,
    tier,
  });
}
