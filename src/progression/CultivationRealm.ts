import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { IMMORTAL_JADE_ITEM_ID } from '@/progression/CultivationDisplay';
import { consumeInventoryItem, inventoryQty } from '@/progression/InventoryManager';
import { buildPlayerStats } from '@/progression/playerStats';
import { getRealmDefinition, listRealmDefinitions } from '@/progression/RealmStatScaling';
import type { RealmDefinition } from '@/shared/schemas/realms';

export type RealmTier = PlayerSaveV1['realm']['tier'];

const TIERS: RealmTier[] = ['early', 'mid', 'late', 'peak'];

export interface BreakthroughBlockers {
  levelShortfall: number;
  spiritShortfall: number;
  jadeShortfall: number;
  missingBoss: string | null;
  missingMap: string | null;
}

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

  /** What's still missing before the next realm breakthrough (0 / null = met). */
  static getBreakthroughBlockers(save: PlayerSaveV1): BreakthroughBlockers {
    const current = getRealmDefinition(save.realm.id);
    if (!current.breakthrough) {
      return {
        levelShortfall: 0,
        spiritShortfall: 0,
        jadeShortfall: 0,
        missingBoss: null,
        missingMap: null,
      };
    }

    const { nextRealm, spiritCost, jadeCost, requiredBoss, requiredMap } = current.breakthrough;
    const nextDef = getRealmDefinition(nextRealm);
    const jadeRequired = jadeCost ?? 0;

    return {
      levelShortfall: Math.max(0, nextDef.levelMin - save.stats.level),
      spiritShortfall: Math.max(0, spiritCost - save.stats.spirit),
      jadeShortfall: Math.max(
        0,
        jadeRequired - inventoryQty(save.inventory.items, IMMORTAL_JADE_ITEM_ID),
      ),
      missingBoss:
        requiredBoss && !save.progress.clearedBosses.includes(requiredBoss) ? requiredBoss : null,
      missingMap:
        requiredMap && !save.progress.clearedMaps.includes(requiredMap) ? requiredMap : null,
    };
  }

  static checkBreakthroughReady(save: PlayerSaveV1): boolean {
    const blockers = CultivationRealm.getBreakthroughBlockers(save);
    return (
      blockers.levelShortfall === 0 &&
      blockers.spiritShortfall === 0 &&
      blockers.jadeShortfall === 0 &&
      blockers.missingBoss === null &&
      blockers.missingMap === null
    );
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
    const items =
      breakthrough.jadeCost > 0
        ? consumeInventoryItem(save.inventory.items, IMMORTAL_JADE_ITEM_ID, breakthrough.jadeCost)
        : save.inventory.items;

    return {
      ...save,
      realm: { id: nextId, tier: 'early', breakthroughReady: false },
      stats: { ...newStats, spirit: spiritAfter },
      inventory: { ...save.inventory, items },
      runtime: { hp: newStats.hpMax, mana: newStats.manaMax },
    };
  }
}
