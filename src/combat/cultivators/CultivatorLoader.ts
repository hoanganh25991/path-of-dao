import {
  encounterConfigSchema,
  cultivatorConfigSchema,
  type EncounterConfig,
  type CultivatorConfig,
} from '@/combat/cultivators/CultivatorConfig';

/** Bundles + validates cultivator and encounter content (mirrors MapLoader). */

const cultivatorModules = import.meta.glob('../../../content/enemies/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const encounterModules = import.meta.glob('../../../content/encounters/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function indexByFileName(modules: Record<string, unknown>): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(modules)) {
    index.set(path.replace(/^.*\//, '').replace(/\.json$/, ''), raw);
  }
  return index;
}

const rawCultivators = indexByFileName(cultivatorModules);
const rawEncounters = indexByFileName(encounterModules);

const cultivatorCache = new Map<string, CultivatorConfig>();
const encounterCache = new Map<string, EncounterConfig>();

export function listCultivatorIds(): string[] {
  return [...rawCultivators.keys()].sort();
}

/** @deprecated Use listCultivatorIds */
export const listEnemyIds = listCultivatorIds;

export function getCultivatorConfig(cultivatorId: string): CultivatorConfig {
  const cached = cultivatorCache.get(cultivatorId);
  if (cached) return cached;

  const raw = rawCultivators.get(cultivatorId);
  if (!raw) {
    throw new Error(`CultivatorLoader: no cultivator config for "${cultivatorId}"`);
  }

  const result = cultivatorConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `CultivatorLoader: invalid cultivator config "${cultivatorId}": ${result.error.message}`,
    );
  }
  if (result.data.id !== cultivatorId) {
    throw new Error(
      `CultivatorLoader: cultivator "${cultivatorId}" declares mismatched id "${result.data.id}"`,
    );
  }

  cultivatorCache.set(cultivatorId, result.data);
  return result.data;
}

/** @deprecated Use getCultivatorConfig */
export const getEnemyConfig = getCultivatorConfig;

export function getEncounterConfig(encounterId: string): EncounterConfig {
  const cached = encounterCache.get(encounterId);
  if (cached) return cached;

  const raw = rawEncounters.get(encounterId);
  if (!raw) {
    throw new Error(`CultivatorLoader: no encounter config for "${encounterId}"`);
  }

  const result = encounterConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `CultivatorLoader: invalid encounter config "${encounterId}": ${result.error.message}`,
    );
  }

  encounterCache.set(encounterId, result.data);
  return result.data;
}
