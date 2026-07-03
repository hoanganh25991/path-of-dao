import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { checksumOf } from '@/core/save/checksum';
import { SaveManager } from '@/core/save/SaveManager';
import { applyMapClearPatch, completeStory } from '@/progression/ChapterManager';
import { getNextJourneyMapId } from '@/progression/WorldProgression';
import { listWorldRegions } from '@/progression/WorldMapLoader';

/** Simulate clearing explore + ordeal maps and chapter stories through chapter N. */
export function simulateRoadThroughChapter(chapterIndex: number): PlayerSaveV1 {
  let save = SaveManager.createNew();
  const regions = listWorldRegions().slice(0, chapterIndex);

  for (const region of regions) {
    for (const node of region.maps) {
      const { patch, result } = applyMapClearPatch(save, node.mapId, true);
      save = { ...save, ...patch };
      if (result.pendingStory) {
        const { save: afterStory } = completeStory(save, result.pendingStory.sceneId, true);
        save = afterStory;
      }
    }
  }

  const nextMapId = getNextJourneyMapId(save);
  save = {
    ...save,
    progress: {
      ...save.progress,
      currentMapId: nextMapId,
    },
  };
  save.checksum = checksumOf(save);
  return save;
}

/** Boss ordeal cleared but chapter story not yet viewed — matches post-combat pre-story routing. */
export function simulateBossClearPendingStory(chapterIndex: number): PlayerSaveV1 {
  let save = SaveManager.createNew();
  const regions = listWorldRegions().slice(0, chapterIndex);
  if (regions.length === 0) {
    throw new Error('simulateBossClearPendingStory: chapterIndex must be >= 1');
  }

  for (const region of regions) {
    for (const node of region.maps) {
      const { patch } = applyMapClearPatch(save, node.mapId, true);
      save = { ...save, ...patch };
    }
  }

  const lastRegion = regions[regions.length - 1]!;
  const bossMapId = lastRegion.maps[lastRegion.maps.length - 1]!.mapId;
  save = {
    ...save,
    progress: {
      ...save.progress,
      currentMapId: bossMapId,
    },
  };
  save.checksum = checksumOf(save);
  return save;
}

/** Explore stage cleared; next stop is the chapter ordeal (boss) map. */
export function simulateReadyForOrdeal(chapterIndex: number): PlayerSaveV1 {
  if (chapterIndex < 1 || chapterIndex > listWorldRegions().length) {
    throw new Error(`simulateReadyForOrdeal: chapterIndex out of range (${chapterIndex})`);
  }

  let save =
    chapterIndex === 1
      ? SaveManager.createNew()
      : simulateRoadThroughChapter(chapterIndex - 1);

  const region = listWorldRegions()[chapterIndex - 1]!;
  const exploreMapId = region.maps[0]!.mapId;
  const ordealMapId = region.maps[1]?.mapId ?? exploreMapId;

  if (!save.progress.clearedMaps.includes(exploreMapId)) {
    const { patch } = applyMapClearPatch(save, exploreMapId, true);
    save = { ...save, ...patch };
  }

  save = {
    ...save,
    progress: {
      ...save.progress,
      currentMapId: ordealMapId,
    },
  };
  save.checksum = checksumOf(save);
  return save;
}
