import { roamConfigSchema, type RoamConfig } from '@/combat/map/RoamConfig';

const roamModules = import.meta.glob('../../../content/roam/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const cache = new Map<string, RoamConfig>();

function buildIndex(): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(roamModules)) {
    index.set(path.replace(/^.*\//, '').replace(/\.json$/, ''), raw);
  }
  return index;
}

const rawRoam = buildIndex();

export function listRoamIds(): string[] {
  return [...rawRoam.keys()].sort();
}

export function getRoamConfig(roamId: string): RoamConfig {
  const cached = cache.get(roamId);
  if (cached) return cached;

  const raw = rawRoam.get(roamId);
  if (!raw) {
    throw new Error(`RoamLoader: no roam config for "${roamId}" (known: ${listRoamIds().join(', ')})`);
  }

  const result = roamConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`RoamLoader: invalid roam config "${roamId}": ${result.error.message}`);
  }
  if (result.data.id !== roamId) {
    throw new Error(`RoamLoader: roam "${roamId}" declares mismatched id "${result.data.id}"`);
  }

  cache.set(roamId, result.data);
  return result.data;
}
