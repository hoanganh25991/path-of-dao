import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import {
  getChapter,
  getChapterByFinalMap,
  isChapterFinalMap,
} from '@/progression/ChapterLoader';
import { getStoryScene } from '@/progression/StoryLoader';
import type { StoryReward } from '@/shared/schemas/story';
import { unlockSkillsForChapter } from '@/progression/SkillUnlockManager';

export interface MapClearResult {
  newlyCleared: boolean;
  pendingStory?: { chapterId: string; sceneId: string };
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

/** Pure — mark map cleared; queue story if chapter finale first clear. */
export function tryClearMap(save: PlayerSaveV1, mapId: string, wavesCleared: boolean): MapClearResult {
  if (!wavesCleared) return { newlyCleared: false };
  if (save.progress.clearedMaps.includes(mapId)) return { newlyCleared: false };

  if (!isChapterFinalMap(mapId)) {
    return { newlyCleared: true };
  }

  const chapter = getChapterByFinalMap(mapId);
  if (!chapter) return { newlyCleared: true };

  if (save.progress.storySeen.includes(chapter.storySceneId)) {
    return { newlyCleared: true };
  }

  return {
    newlyCleared: true,
    pendingStory: { chapterId: chapter.id, sceneId: chapter.storySceneId },
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
    patch: {
      progress: {
        ...save.progress,
        clearedMaps: [...save.progress.clearedMaps, mapId],
      },
    },
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
