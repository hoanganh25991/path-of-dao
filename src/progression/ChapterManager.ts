import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getMapConfig } from '@/combat/map/MapLoader';
import {
  getChapter,
  getChapterByFinalMap,
  isChapterFinalMap,
} from '@/progression/ChapterLoader';
import { getStoryScene } from '@/progression/StoryLoader';
import type { StoryReward } from '@/shared/schemas/story';
import { unlockSkillsForChapter, unlockSkillsForMapClear } from '@/progression/SkillUnlockManager';
import { appendJourneyStep, makeJourneyEntry, recordJourney } from '@/progression/JourneyLog';

export interface MapClearResult {
  newlyCleared: boolean;
  pendingStory?: { chapterId: string; sceneId: string };
  /** Dao Scroll shard newly unlocked on this clear — offer "Read now" / "Later" (sub-plan 31 §6.2). */
  pendingTimelineShard?: string;
}

export interface StoryCompletionPatch {
  save: PlayerSaveV1;
  rewardsGranted: boolean;
}

function addInventoryItem(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
  qty: number,
): PlayerSaveV1['inventory']['items'] {
  const next = items.map((entry) =>
    entry.id === itemId ? { ...entry, qty: entry.qty + qty } : entry,
  );
  if (!next.some((entry) => entry.id === itemId)) {
    next.push({ id: itemId, qty });
  }
  return next;
}

function applyRewards(save: PlayerSaveV1, rewards: StoryReward[]): PlayerSaveV1 {
  let next = { ...save };
  let items = [...save.inventory.items];
  let gold = save.inventory.gold;
  let spirit = save.stats.spirit;

  for (const reward of rewards) {
    if (reward.type === 'item') {
      items = addInventoryItem(items, reward.id, reward.qty);
    } else if (reward.type === 'gold') {
      gold += reward.amount;
    } else if (reward.type === 'spirit') {
      spirit += reward.amount;
    }
  }

  next = {
    ...next,
    inventory: { ...save.inventory, items, gold },
    stats: { ...save.stats, spirit },
  };
  return next;
}

function pendingTimelineShardFor(save: PlayerSaveV1, mapId: string): string | undefined {
  const shardId = getMapConfig(mapId).timelineShardId;
  if (!shardId || save.progress.timelineSeen.includes(shardId)) return undefined;
  return shardId;
}

/** Pure — mark map cleared; queue story if chapter finale first clear, queue Dao Scroll shard offer. */
export function tryClearMap(save: PlayerSaveV1, mapId: string, wavesCleared: boolean): MapClearResult {
  if (!wavesCleared) return { newlyCleared: false };
  if (save.progress.clearedMaps.includes(mapId)) return { newlyCleared: false };

  const pendingTimelineShard = pendingTimelineShardFor(save, mapId);

  if (!isChapterFinalMap(mapId)) {
    return { newlyCleared: true, pendingTimelineShard };
  }

  const chapter = getChapterByFinalMap(mapId);
  if (!chapter) return { newlyCleared: true, pendingTimelineShard };

  if (save.progress.storySeen.includes(chapter.storySceneId)) {
    return { newlyCleared: true, pendingTimelineShard };
  }

  return {
    newlyCleared: true,
    pendingStory: { chapterId: chapter.id, sceneId: chapter.storySceneId },
    pendingTimelineShard,
  };
}

/** Apply map clear to save (no story rewards yet). */
export function applyMapClearPatch(
  save: PlayerSaveV1,
  mapId: string,
  wavesCleared: boolean,
): { patch: Partial<PlayerSaveV1>; result: MapClearResult } {
  const result = tryClearMap(save, mapId, wavesCleared);
  if (!result.newlyCleared) {
    return { patch: {}, result };
  }

  return {
    patch: (() => {
      let journey = recordJourney(save, 'map_clear', mapId, mapId);
      let timelineSeen = save.progress.timelineSeen;

      if (result.pendingTimelineShard) {
        timelineSeen = [...timelineSeen, result.pendingTimelineShard];
        journey = appendJourneyStep(
          journey,
          makeJourneyEntry(save, 'timeline_shard', result.pendingTimelineShard, mapId),
        );
      }

      const clearedProgress = {
        ...save.progress,
        clearedMaps: [...save.progress.clearedMaps, mapId],
        timelineSeen,
        journey,
      };
      const merged = unlockSkillsForMapClear(
        { ...save, progress: clearedProgress },
        mapId,
      );
      return {
        progress: merged.progress,
        unlockedSkills: merged.unlockedSkills,
        divineArts: merged.divineArts,
      };
    })(),
    result,
  };
}

/** After story finishes — rewards (first time), storySeen, unlock next chapter. */
export function completeStory(
  save: PlayerSaveV1,
  sceneId: string,
  grantRewards: boolean,
): StoryCompletionPatch {
  const scene = getStoryScene(sceneId);
  const chapter = getChapter(scene.chapterId);

  let next = { ...save };
  let rewardsGranted = false;

  if (grantRewards && scene.rewards.length > 0) {
    next = applyRewards(next, scene.rewards);
    rewardsGranted = true;
  }

  const storySeen = next.progress.storySeen.includes(sceneId)
    ? next.progress.storySeen
    : [...next.progress.storySeen, sceneId];

  const unlockId = scene.unlockChapter ?? chapter.unlockChapter;
  const unlockedChapters =
    unlockId && !next.progress.unlockedChapters.includes(unlockId)
      ? [...next.progress.unlockedChapters, unlockId]
      : next.progress.unlockedChapters;

  next = {
    ...next,
    progress: {
      ...next.progress,
      storySeen,
      unlockedChapters,
      journey: recordJourney(next, 'story', sceneId, chapter.finalMapId),
    },
  };

  if (grantRewards) {
    next = unlockSkillsForChapter(next, scene.chapterId);
  }

  return { save: next, rewardsGranted };
}

export function onChapterComplete(chapterId: string, save: PlayerSaveV1): PlayerSaveV1 {
  const chapter = getChapter(chapterId);
  if (!chapter.unlockChapter) return save;
  if (save.progress.unlockedChapters.includes(chapter.unlockChapter)) return save;
  return {
    ...save,
    progress: {
      ...save.progress,
      unlockedChapters: [...save.progress.unlockedChapters, chapter.unlockChapter],
    },
  };
}
