import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  applyMapClearPatch,
  completeStory,
  onChapterComplete,
  tryClearMap,
} from '@/progression/ChapterManager';
import { isChapterFinalMap } from '@/progression/ChapterLoader';

describe('isChapterFinalMap', () => {
  it('only stage .02 maps are chapter finals', () => {
    expect(isChapterFinalMap('map.fallen_village.01')).toBe(false);
    expect(isChapterFinalMap('map.fallen_village.02')).toBe(true);
    expect(isChapterFinalMap('map.test.grove')).toBe(false);
  });
});

describe('tryClearMap', () => {
  it('requires waves cleared', () => {
    const save = SaveManager.createNew();
    expect(tryClearMap(save, 'map.fallen_village.01', false)).toEqual({ newlyCleared: false });
  });

  it('chapter 1 map 1 clears without story', () => {
    const save = SaveManager.createNew();
    expect(tryClearMap(save, 'map.fallen_village.01', true)).toEqual({ newlyCleared: true });
  });

  it('chapter final first clear queues story', () => {
    const save = SaveManager.createNew();
    const result = tryClearMap(save, 'map.fallen_village.02', true);
    expect(result.newlyCleared).toBe(true);
    expect(result.pendingStory).toEqual({
      chapterId: 'chapter.01.fallen_village',
      sceneId: 'story.ch01.awakening_jade',
    });
  });

  it('does not re-queue story after seen', () => {
    const save = {
      ...SaveManager.createNew(),
      progress: {
        ...SaveManager.createNew().progress,
        storySeen: ['story.ch01.awakening_jade'],
      },
    };
    const result = tryClearMap(save, 'map.fallen_village.02', true);
    expect(result.pendingStory).toBeUndefined();
  });
});

describe('onChapterComplete', () => {
  it('unlocks next chapter', () => {
    const save = SaveManager.createNew();
    const next = onChapterComplete('chapter.01.fallen_village', save);
    expect(next.progress.unlockedChapters).toContain('chapter.02.mist_forest');
  });
});

describe('completeStory', () => {
  it('grants rewards on first view', () => {
    const save = SaveManager.createNew();
    const spiritBefore = save.stats.spirit;
    const { save: next, rewardsGranted } = completeStory(
      save,
      'story.ch01.awakening_jade',
      true,
    );
    expect(rewardsGranted).toBe(true);
    expect(next.stats.spirit).toBe(spiritBefore + 30);
    expect(next.inventory.items.some((i) => i.id === 'item.spirit.jade')).toBe(true);
    expect(next.progress.storySeen).toContain('story.ch01.awakening_jade');
    expect(next.progress.unlockedChapters).toContain('chapter.02.mist_forest');
  });

  it('replay does not duplicate rewards', () => {
    const base = SaveManager.createNew();
    const { save: once } = completeStory(base, 'story.ch01.awakening_jade', true);
    const spiritAfterFirst = once.stats.spirit;
    const jadeQty = once.inventory.items.find((i) => i.id === 'item.spirit.jade')?.qty ?? 0;

    const { save: replayed, rewardsGranted } = completeStory(once, 'story.ch01.awakening_jade', false);
    expect(rewardsGranted).toBe(false);
    expect(replayed.stats.spirit).toBe(spiritAfterFirst);
    expect(replayed.inventory.items.find((i) => i.id === 'item.spirit.jade')?.qty).toBe(jadeQty);
    expect(replayed.progress.storySeen.filter((id) => id === 'story.ch01.awakening_jade')).toHaveLength(1);
  });
});

describe('applyMapClearPatch', () => {
  it('appends clearedMaps once', () => {
    const save = SaveManager.createNew();
    const { patch } = applyMapClearPatch(save, 'map.fallen_village.01', true);
    expect(patch.progress?.clearedMaps).toEqual(['map.fallen_village.01']);
  });
});
