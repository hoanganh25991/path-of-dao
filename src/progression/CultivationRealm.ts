import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { buildPlayerStats } from '@/progression/playerStats';
import { getRealmDefinition, listRealmDefinitions } from '@/progression/RealmStatScaling';
import type { RealmDefinition } from '@/shared/schemas/realms';

export type RealmTier = PlayerSaveV1['realm']['tier'];

const TIERS: RealmTier[] = ['early', 'mid', 'late', 'peak'];

export interface CultivationRealmState {
  id: string;
  tier: RealmTier;
  breakthroughReady: boolean;
}

export class CultivationRealm {
  static getDefinition(id: string): RealmDefinition {
    return getRealmDefinition(id);
  }

  static listRealms(): readonly RealmDefinition[] {
    return listRealmDefinitions();
  }

  /** Tier advances every 3 levels within the current realm band. */
  static updateTierFromLevel(realmId: string, level: number): RealmTier {
    const def = getRealmDefinition(realmId);
    const offset = Math.max(0, level - def.levelMin);
    const index = Math.min(3, Math.floor(offset / 3));
    return TIERS[index] ?? 'early';
  }

  static checkBreakthroughReady(save: PlayerSaveV1): boolean {
    const current = getRealmDefinition(save.realm.id);
    if (!current.breakthrough) return false;

    const { nextRealm, spiritCost, requiredBoss, requiredMap } = current.breakthrough;
    const nextDef = getRealmDefinition(nextRealm);

    if (save.stats.level < nextDef.levelMin) return false;
    if (spiritCost > 0 && save.stats.spirit < spiritCost) return false;
    if (requiredBoss && !save.progress.clearedBosses.includes(requiredBoss)) return false;
    if (requiredMap && !save.progress.clearedMaps.includes(requiredMap)) return false;

    return true;
  }

  static syncRealmState(save: PlayerSaveV1): CultivationRealmState {
    return {
      id: save.realm.id,
      tier: CultivationRealm.updateTierFromLevel(save.realm.id, save.stats.level),
      breakthroughReady: CultivationRealm.checkBreakthroughReady(save),
    };
  }

  /** Apply breakthrough: advance realm, spend spirit, rescale stats, reset tier. */
  static performBreakthrough(save: PlayerSaveV1): PlayerSaveV1 {
    if (!CultivationRealm.checkBreakthroughReady(save)) {
      throw new Error('CultivationRealm.performBreakthrough: requirements not met');
    }

    const current = getRealmDefinition(save.realm.id);
    const breakthrough = current.breakthrough;
    if (!breakthrough) {
      throw new Error('CultivationRealm.performBreakthrough: already at max realm');
    }

    const nextId = breakthrough.nextRealm;
    const spiritAfter = save.stats.spirit - breakthrough.spiritCost;
    const newStats = buildPlayerStats(save.heroId, save.stats.level, nextId);

    return {
      ...save,
      realm: { id: nextId, tier: 'early', breakthroughReady: false },
      stats: { ...newStats, spirit: spiritAfter },
      runtime: { hp: newStats.hpMax, mana: newStats.manaMax },
    };
  }
}
