import type { CultivatorConfig } from '@/combat/cultivators/CultivatorConfig';
import { getLootDropRates, getLootTable } from '@/progression/LootLoader';
import type { LootTable } from '@/shared/schemas/loot';

export interface ItemDrop {
  itemId: string;
  qty: number;
}

export interface LootRollContext {
  isBoss: boolean;
  wasRematch: boolean;
}

function rollQty(min: number, max: number, random: () => number): number {
  if (max <= min) return min;
  return min + Math.floor(random() * (max - min + 1));
}

function rollWeightedEntry(
  entries: LootTable['entries'],
  random: () => number,
): ItemDrop | null {
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      const [minQ, maxQ] = entry.qty ?? [1, 1];
      return { itemId: entry.itemId, qty: rollQty(minQ, maxQ, random) };
    }
  }

  const fallback = entries[entries.length - 1]!;
  const [minQ, maxQ] = fallback.qty ?? [1, 1];
  return { itemId: fallback.itemId, qty: rollQty(minQ, maxQ, random) };
}

function dropChance(cultivator: CultivatorConfig, ctx: LootRollContext): number {
  const rates = getLootDropRates();
  if (ctx.isBoss) return ctx.wasRematch ? rates.bossRematchChance : 1;
  if (cultivator.category === 'elite') return rates.eliteChance;
  return rates.gruntChance;
}

export function isBossCultivator(cultivator: CultivatorConfig): boolean {
  return Boolean(cultivator.bossClearId) || cultivator.category === 'boss';
}

export function getCultivatorDropChance(
  cultivator: CultivatorConfig,
  ctx: Pick<LootRollContext, 'isBoss' | 'wasRematch'>,
): number {
  return dropChance(cultivator, ctx);
}

export type CultivatorLootTier = 'none' | 'grunt' | 'elite' | 'boss_first' | 'boss_rematch';

export function getCultivatorLootTier(
  cultivator: CultivatorConfig,
  wasRematch = false,
): CultivatorLootTier {
  if (!cultivator.lootTable) return 'none';
  if (isBossCultivator(cultivator)) {
    return wasRematch ? 'boss_rematch' : 'boss_first';
  }
  if (cultivator.category === 'elite') return 'elite';
  return 'grunt';
}

/**
 * Resolve item drops for a defeated cultivator.
 *
 * Strategy:
 * - Grunts: ~12% chance → one weighted roll from their loot table.
 * - Elites: ~28% chance → one weighted roll (uncommon/rare tables).
 * - Boss first clear: guaranteed drops + optional bonus weighted roll.
 * - Boss rematch: ~35% chance → one weighted roll only (no guaranteed).
 */
export function rollCultivatorLoot(
  cultivator: CultivatorConfig,
  ctx: LootRollContext,
  random: () => number = Math.random,
): ItemDrop[] {
  if (!cultivator.lootTable) return [];

  const table = getLootTable(cultivator.lootTable);
  const drops: ItemDrop[] = [];

  if (ctx.isBoss && !ctx.wasRematch) {
    for (const entry of table.guaranteed ?? []) {
      drops.push({ itemId: entry.itemId, qty: entry.qty });
    }
    if (getLootDropRates().bossFirstClearBonusRoll) {
      const bonus = rollWeightedEntry(table.entries, random);
      if (bonus) drops.push(bonus);
    }
    return drops;
  }

  const chance = dropChance(cultivator, ctx);
  if (chance < 1 && random() >= chance) return [];

  const rolled = rollWeightedEntry(table.entries, random);
  return rolled ? [rolled] : [];
}
