import type { MapConfig } from '@/combat/map/MapConfig';

/** Resolve player spawn when entering via a zone portal. */
export function resolvePortalSpawn(
  config: MapConfig,
  spawnFromPortal?: string,
): { x: number; y: number } | null {
  if (!spawnFromPortal) return null;
  const coords = config.portalSpawns[spawnFromPortal];
  return coords ?? null;
}
