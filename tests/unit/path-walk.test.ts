import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { resetAncientDemoSession } from '@/progression/AncientDemoManager';
import {
  getCurrentPathStep,
  getPathWalkTimelineShardId,
  isPathWalkActive,
  markPathWalkTimelineShardSeen,
  onPathStepMapCleared,
  onPathStepStoryFinished,
  resetPathWalkSession,
  startPathWalk,
  stopPathWalk,
} from '@/progression/PathWalkManager';

beforeEach(() => {
  resetAncientDemoSession();
  resetPathWalkSession();
});

describe('PathWalkManager', () => {
  it('starts on the first path stop', () => {
    startPathWalk('ancient.breakthrough_sage');
    expect(isPathWalkActive()).toBe(true);
    expect(getCurrentPathStep()?.mapId).toBe('map.fallen_village.01');
  });

  it('advances from a map-only stop to the next combat map', () => {
    startPathWalk('ancient.breakthrough_sage');
    const route = onPathStepMapCleared('map.fallen_village.01');

    expect(route).toEqual({ action: 'combat', mapId: 'map.fallen_village.02' });
    expect(getCurrentPathStep()?.mapId).toBe('map.fallen_village.02');
  });

  it('queues story after clearing a stop that has a story beat', () => {
    startPathWalk('ancient.breakthrough_sage');
    onPathStepMapCleared('map.fallen_village.01');

    const route = onPathStepMapCleared('map.fallen_village.02');
    expect(route.action).toBe('story');
    if (route.action === 'story') {
      expect(route.sceneId).toBe('story.ch01.awakening_jade');
      expect(route.chapterId).toBe('chapter.01.fallen_village');
    }
  });

  it('finishes the walk after the last story beat', () => {
    startPathWalk('ancient.breakthrough_sage');
    onPathStepMapCleared('map.fallen_village.01');
    onPathStepMapCleared('map.fallen_village.02');

    const route = onPathStepStoryFinished();
    expect(route).toEqual({ action: 'home' });
    expect(isPathWalkActive()).toBe(false);
  });

  it('walks sword ancestor road with interleaved story beats', () => {
    startPathWalk('ancient.sword_ancestor');

    const first = onPathStepMapCleared('map.fallen_village.02');
    expect(first.action).toBe('story');

    const second = onPathStepStoryFinished();
    expect(second).toEqual({ action: 'combat', mapId: 'map.stone_canyon.02' });

    onPathStepMapCleared('map.stone_canyon.02');
    const third = onPathStepStoryFinished();
    expect(third).toEqual({ action: 'combat', mapId: 'map.moon_lake.02' });

    onPathStepMapCleared('map.moon_lake.02');
    const finish = onPathStepStoryFinished();
    expect(finish).toEqual({ action: 'home' });
    expect(isPathWalkActive()).toBe(false);
  });

  it('stopPathWalk clears the session', () => {
    startPathWalk('ancient.void_walker');
    stopPathWalk();
    expect(isPathWalkActive()).toBe(false);
    expect(onPathStepMapCleared('map.stone_canyon.02')).toEqual({ action: 'home' });
  });

  describe('Dao Scroll auto-read between maps (sub-plan 31 §6.3)', () => {
    it('resolves the timeline shard id for a map on the road', () => {
      expect(getPathWalkTimelineShardId('map.fallen_village.01')).toBe(
        'timeline.map.fallen_village.01',
      );
    });

    it('returns null for a map with no timeline shard', () => {
      expect(getPathWalkTimelineShardId('map.test.grove')).toBeNull();
    });

    it('marks a shard seen when not already in timelineSeen', () => {
      const save = SaveManager.createNew();
      expect(save.progress.timelineSeen).toEqual([]);

      const progress = markPathWalkTimelineShardSeen(save, 'timeline.map.fallen_village.01');
      expect(progress.timelineSeen).toEqual(['timeline.map.fallen_village.01']);
    });

    it('is idempotent — does not duplicate or re-allocate when already seen', () => {
      const save = SaveManager.createNew();
      save.progress = {
        ...save.progress,
        timelineSeen: ['timeline.map.fallen_village.01'],
      };

      const progress = markPathWalkTimelineShardSeen(save, 'timeline.map.fallen_village.01');
      expect(progress).toBe(save.progress);
      expect(progress.timelineSeen).toEqual(['timeline.map.fallen_village.01']);
    });
  });
});
