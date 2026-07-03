import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import {
  findWorldMapNode,
  getChapterFinalMapId,
  listWorldRegions,
} from '@/progression/WorldMapLoader';
import type { UnlockRule } from '@/shared/schemas/world-map';

export type MapTravelState = 'locked' | 'unlocked' | 'cleared' | 'current';

export interface CanEnterResult {
  ok: boolean;
  reasonKey?: string;
}

function isMapCleared(save: PlayerSaveV1, mapId: string): boolean {
  return save.progress.clearedMaps.includes(mapId);
}

function evaluateUnlock(rule: UnlockRule, save: PlayerSaveV1): CanEnterResult {
  switch (rule.type) {
    case 'default':
      return { ok: true };
    case 'clearMap':
      if (isMapCleared(save, rule.required)) return { ok: true };
      return { ok: false, reasonKey: 'world.lock.clear_map' };
    case 'clearBoss':
      if (save.progress.clearedBosses.includes(rule.required)) return { ok: true };
      return { ok: false, reasonKey: 'world.lock.clear_boss' };
    case 'chapterGate': {
      const finalMap = getChapterFinalMapId(rule.required);
      if (finalMap && isMapCleared(save, finalMap)) return { ok: true };
      return { ok: false, reasonKey: 'world.lock.chapter_gate' };
    }
    default:
      return { ok: false, reasonKey: 'world.lock.unknown' };
  }
}

export function canEnter(mapId: string, save: PlayerSaveV1): CanEnterResult {
  const entry = findWorldMapNode(mapId);
  if (!entry) return { ok: false, reasonKey: 'world.lock.unknown' };
  return evaluateUnlock(entry.node.unlock, save);
}

export function getMapTravelState(mapId: string, save: PlayerSaveV1): MapTravelState {
  if (save.progress.currentMapId === mapId) return 'current';
  if (isMapCleared(save, mapId)) return 'cleared';
  if (canEnter(mapId, save).ok) return 'unlocked';
  return 'locked';
}

/** Two dots per chapter — cleared status for each map stage. */
export function getRegionClearDots(chapterId: string, save: PlayerSaveV1): boolean[] {
  const region = listWorldRegions().find((r) => r.chapterId === chapterId);
  if (!region) return [];
  return region.maps.map((node) => isMapCleared(save, node.mapId));
}

export function isChapterComplete(chapterId: string, save: PlayerSaveV1): boolean {
  const finalMap = getChapterFinalMapId(chapterId);
  return finalMap ? isMapCleared(save, finalMap) : false;
}

/** True after the player has entered the road at least once (return visits show Continue Journey). */
export function hasStartedJourney(save: PlayerSaveV1): boolean {
  if (save.progress.currentMapId != null) return true;
  if (save.progress.clearedMaps.length > 0) return true;
  if (save.progress.journey.length > 0) return true;
  return false;
}

/** First unlocked, uncleared map along the world road — for journey CTA. */
export function getNextJourneyMapId(save: PlayerSaveV1): string | null {
  for (const region of listWorldRegions()) {
    for (const node of region.maps) {
      const mapId = node.mapId;
      if (isMapCleared(save, mapId)) continue;
      if (canEnter(mapId, save).ok) return mapId;
    }
  }
  return null;
}

/** Map the Home shrine should reflect — last visited, or next stop on the road. */
export function getJourneyHomeMapId(save: PlayerSaveV1): string {
  const { currentMapId } = save.progress;
  if (currentMapId && findWorldMapNode(currentMapId) && !isMapCleared(save, currentMapId)) {
    return currentMapId;
  }
  return getNextJourneyMapId(save) ?? 'map.fallen_village.01';
}
