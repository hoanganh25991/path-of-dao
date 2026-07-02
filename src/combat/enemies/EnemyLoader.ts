import {
  encounterConfigSchema,
  enemyConfigSchema,
  type EncounterConfig,
  type EnemyConfig,
} from '@/combat/enemies/EnemyConfig';

/** Bundles + validates enemy and encounter content (mirrors MapLoader). */

const enemyModules = import.meta.glob('../../../content/enemies/*.json', {
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

const rawEnemies = indexByFileName(enemyModules);
const rawEncounters = indexByFileName(encounterModules);

const enemyCache = new Map<string, EnemyConfig>();
const encounterCache = new Map<string, EncounterConfig>();

export function listEnemyIds(): string[] {
  return [...rawEnemies.keys()].sort();
}

export function getEnemyConfig(enemyId: string): EnemyConfig {
  const cached = enemyCache.get(enemyId);
  if (cached) return cached;

  const raw = rawEnemies.get(enemyId);
  if (!raw) {
    throw new Error(`EnemyLoader: no enemy config for "${enemyId}"`);
  }

  const result = enemyConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`EnemyLoader: invalid enemy config "${enemyId}": ${result.error.message}`);
  }
  if (result.data.id !== enemyId) {
    throw new Error(`EnemyLoader: enemy "${enemyId}" declares mismatched id "${result.data.id}"`);
  }

  enemyCache.set(enemyId, result.data);
  return result.data;
}

export function getEncounterConfig(encounterId: string): EncounterConfig {
  const cached = encounterCache.get(encounterId);
  if (cached) return cached;

  const raw = rawEncounters.get(encounterId);
  if (!raw) {
    throw new Error(`EnemyLoader: no encounter config for "${encounterId}"`);
  }

  const result = encounterConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `EnemyLoader: invalid encounter config "${encounterId}": ${result.error.message}`,
    );
  }

  encounterCache.set(encounterId, result.data);
  return result.data;
}
