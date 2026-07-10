import type { CultivatorConfig } from '@/combat/cultivators/CultivatorConfig';
import { getLootDropRates, getLootTable } from '@/progression/LootLoader';
import {
  getCultivatorDropChance,
  getCultivatorLootTier,
  isBossCultivator,
  type CultivatorLootTier,
} from '@/combat/systems/lootRoll';

export function formatLootChancePercent(chance: number): number {
  return Math.round(chance * 100);
}

/** Item ids that may roll from this cultivator's loot table (for bestiary preview). */
export function getCultivatorLootItemIds(cultivator: CultivatorConfig, limit = 4): string[] {
  if (!cultivator.lootTable) return [];
  const table = getLootTable(cultivator.lootTable);
  const ids = new Set<string>();
  for (const entry of table.guaranteed ?? []) {
    ids.add(entry.itemId);
  }
  for (const entry of table.entries) {
    ids.add(entry.itemId);
    if (ids.size >= limit) break;
  }
  return [...ids].slice(0, limit);
}

export interface CultivatorLootHint {
  tier: CultivatorLootTier;
  /** 0–100 display percent for grunt/elite/rematch; 100 for boss first clear. */
  chancePercent: number;
  itemIds: string[];
}

export function describeCultivatorLootHint(
  cultivator: CultivatorConfig,
  wasRematch = false,
): CultivatorLootHint {
  const tier = getCultivatorLootTier(cultivator, wasRematch);
  const isBoss = isBossCultivator(cultivator);
  const chance = getCultivatorDropChance(cultivator, { isBoss, wasRematch });
  return {
    tier,
    chancePercent: formatLootChancePercent(chance),
    itemIds: getCultivatorLootItemIds(cultivator),
  };
}

export interface MapLootHudHint {
  gruntPercent: number;
  elitePercent: number;
  bossRematchPercent: number;
}

/** Rates for the compact combat HUD strip. */
export function getMapLootHudHint(): MapLootHudHint {
  const rates = getLootDropRates();
  return {
    gruntPercent: formatLootChancePercent(rates.gruntChance),
    elitePercent: formatLootChancePercent(rates.eliteChance),
    bossRematchPercent: formatLootChancePercent(rates.bossRematchChance),
  };
}
