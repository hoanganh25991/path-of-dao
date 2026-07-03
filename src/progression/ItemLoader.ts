import { itemDefinitionSchema, type ItemDefinition } from '@/progression/ItemDefinition';

/** Bundles + validates item content (mirrors EnemyLoader). */

const itemModules = import.meta.glob('../../content/items/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function indexByFileName(modules: Record<string, unknown>): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(modules)) {
    const fileName = path.replace(/^.*\//, '').replace(/\.json$/, '');
    if (fileName.startsWith('_')) continue;
    index.set(fileName, raw);
  }
  return index;
}

const rawItems = indexByFileName(itemModules);
const itemCache = new Map<string, ItemDefinition>();

export function listItemIds(): string[] {
  return [...rawItems.keys()].sort();
}

export function getItemDefinition(itemId: string): ItemDefinition {
  const cached = itemCache.get(itemId);
  if (cached) return cached;

  const raw = rawItems.get(itemId);
  if (!raw) {
    throw new Error(`ItemLoader: no item config for "${itemId}"`);
  }

  const result = itemDefinitionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`ItemLoader: invalid item config "${itemId}": ${result.error.message}`);
  }
  if (result.data.id !== itemId) {
    throw new Error(`ItemLoader: item "${itemId}" declares mismatched id "${result.data.id}"`);
  }

  itemCache.set(itemId, result.data);
  return result.data;
}
