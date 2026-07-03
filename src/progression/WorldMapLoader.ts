import worldMapJson from '../../../content/world/world-map.json';
import {
  worldMapFileSchema,
  type WorldMapFile,
  type WorldMapNode,
  type WorldRegion,
} from '@/shared/schemas/world-map';

const worldMapData = worldMapFileSchema.parse(worldMapJson);

const mapIndex = new Map<string, { region: WorldRegion; node: WorldMapNode }>();

for (const region of worldMapData.regions) {
  for (const node of region.maps) {
    mapIndex.set(node.mapId, { region, node });
  }
}

export function getWorldMapData(): WorldMapFile {
  return worldMapData;
}

export function listWorldRegions(): readonly WorldRegion[] {
  return worldMapData.regions;
}

export function findWorldMapNode(mapId: string): { region: WorldRegion; node: WorldMapNode } | null {
  return mapIndex.get(mapId) ?? null;
}

/** Final map in a chapter (last entry in region.maps). */
export function getChapterFinalMapId(chapterId: string): string | null {
  const region = worldMapData.regions.find((r) => r.chapterId === chapterId);
  if (!region || region.maps.length === 0) return null;
  return region.maps[region.maps.length - 1]!.mapId;
}

export function getFirstMapId(): string {
  const firstRegion = worldMapData.regions[0];
  return firstRegion?.maps[0]?.mapId ?? 'map.fallen_village.01';
}
