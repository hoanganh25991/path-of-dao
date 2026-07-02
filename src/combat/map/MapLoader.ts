import { mapConfigSchema, type MapConfig } from '@/combat/map/MapConfig';

/**
 * Bundles every map config in content/maps/ and resolves Tiled asset URLs.
 * All content is validated lazily on first access and cached.
 */

const configModules = import.meta.glob('../../../content/maps/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const tiledUrls = import.meta.glob('../../../assets/maps/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const configCache = new Map<string, MapConfig>();

function buildConfigIndex(): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(configModules)) {
    const fileId = path.replace(/^.*\//, '').replace(/\.json$/, '');
    index.set(fileId, raw);
  }
  return index;
}

const rawConfigs = buildConfigIndex();

export function listMapIds(): string[] {
  return [...rawConfigs.keys()].sort();
}

/** Validated map config; throws with the mapId in the message on any failure. */
export function getMapConfig(mapId: string): MapConfig {
  const cached = configCache.get(mapId);
  if (cached) return cached;

  const raw = rawConfigs.get(mapId);
  if (!raw) {
    throw new Error(`MapLoader: no map config for "${mapId}" (known: ${listMapIds().join(', ')})`);
  }

  const result = mapConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`MapLoader: invalid map config "${mapId}": ${result.error.message}`);
  }
  if (result.data.id !== mapId) {
    throw new Error(
      `MapLoader: map config "${mapId}" declares mismatched id "${result.data.id}"`,
    );
  }

  configCache.set(mapId, result.data);
  return result.data;
}

/** Bundler URL for a config's tiledPath (works in dev and production build). */
export function resolveTiledUrl(config: MapConfig): string {
  const fileName = config.tiledPath.replace(/^.*\//, '');
  const entry = Object.entries(tiledUrls).find(([path]) => path.endsWith(`/${fileName}`));
  if (!entry) {
    throw new Error(`MapLoader: tiled asset "${config.tiledPath}" not found for "${config.id}"`);
  }
  return entry[1];
}
