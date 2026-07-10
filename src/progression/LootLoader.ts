import dropRatesJson from '../../content/loot/_drop_rates.json';
import { lootTableSchema, lootDropRatesSchema, type LootTable, type LootDropRates } from '@/shared/schemas/loot';

const lootModules = import.meta.glob('../../content/loot/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const cache = new Map<string, LootTable>();

function indexLoot(): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(lootModules)) {
    const fileId = path.replace(/^.*\//, '').replace(/\.json$/, '');
    if (fileId.startsWith('_')) continue;
    index.set(fileId, raw);
  }
  return index;
}

const rawLoot = indexLoot();
const dropRatesData = lootDropRatesSchema.parse(dropRatesJson);

export function getLootDropRates(): LootDropRates {
  return dropRatesData;
}

export function listLootTableIds(): string[] {
  return [...rawLoot.keys()].sort();
}

export function getLootTable(tableId: string): LootTable {
  const cached = cache.get(tableId);
  if (cached) return cached;

  const raw = rawLoot.get(tableId);
  if (!raw) {
    throw new Error(`LootLoader: no loot table "${tableId}"`);
  }

  const result = lootTableSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`LootLoader: invalid loot table "${tableId}": ${result.error.message}`);
  }
  if (result.data.id !== tableId) {
    throw new Error(`LootLoader: loot "${tableId}" declares mismatched id "${result.data.id}"`);
  }

  cache.set(tableId, result.data);
  return result.data;
}
