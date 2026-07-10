import { proceduralWorldSchema, type ProceduralWorldConfig } from '@/combat/world/ProceduralWorldConfig';
import { hashStringToSeed } from '@/combat/world/seededRandom';

const worldModules = import.meta.glob('../../../content/world/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const cache = new Map<string, ProceduralWorldConfig>();

function buildIndex(): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(worldModules)) {
    index.set(path.replace(/^.*\//, '').replace(/\.json$/, ''), raw);
  }
  return index;
}

const rawWorlds = buildIndex();

export function listWorldProfileIds(): string[] {
  return [...rawWorlds.keys()].sort();
}

export function getWorldProfile(profileId: string): ProceduralWorldConfig {
  const cached = cache.get(profileId);
  if (cached) return cached;

  const raw = rawWorlds.get(profileId);
  if (!raw) {
    throw new Error(
      `ProceduralWorldLoader: no profile "${profileId}" (known: ${listWorldProfileIds().join(', ')})`,
    );
  }

  const result = proceduralWorldSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`ProceduralWorldLoader: invalid "${profileId}": ${result.error.message}`);
  }
  if (result.data.id !== profileId) {
    throw new Error(`ProceduralWorldLoader: "${profileId}" declares mismatched id "${result.data.id}"`);
  }

  cache.set(profileId, result.data);
  return result.data;
}

/** Stable numeric seed per map — revisit yields identical cell rolls. */
export function worldSeedForMap(mapId: string): number {
  return hashStringToSeed(mapId);
}
