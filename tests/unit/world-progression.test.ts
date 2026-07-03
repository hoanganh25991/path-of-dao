import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { canEnter, getNextJourneyMapId, getJourneyHomeMapId, hasStartedJourney } from '@/progression/WorldProgression';

describe('WorldProgression.canEnter', () => {
  it('chapter 1 map 1 is always enterable', () => {
    const save = SaveManager.createNew();
    expect(canEnter('map.fallen_village.01', save)).toEqual({ ok: true });
  });

  it('chapter 1 map 2 is locked until map 1 is cleared', () => {
    const save = SaveManager.createNew();
    expect(canEnter('map.fallen_village.02', save)).toEqual({
      ok: false,
      reasonKey: 'world.lock.clear_map',
    });

    const cleared = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01'],
      },
    };
    expect(canEnter('map.fallen_village.02', cleared)).toEqual({ ok: true });
  });

  it('chapter 2 is locked until chapter 1 is complete', () => {
    const save = SaveManager.createNew();
    expect(canEnter('map.mist_forest.01', save)).toEqual({
      ok: false,
      reasonKey: 'world.lock.chapter_gate',
    });

    const ch1OnlyStage1 = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01'],
      },
    };
    expect(canEnter('map.mist_forest.01', ch1OnlyStage1)).toEqual({
      ok: false,
      reasonKey: 'world.lock.chapter_gate',
    });

    const ch1Complete = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01', 'map.fallen_village.02'],
      },
    };
    expect(canEnter('map.mist_forest.01', ch1Complete)).toEqual({ ok: true });
  });

  it('returns unknown reason for invalid map id', () => {
    const save = SaveManager.createNew();
    expect(canEnter('map.does.not.exist', save)).toEqual({
      ok: false,
      reasonKey: 'world.lock.unknown',
    });
  });
});

describe('WorldProgression.hasStartedJourney', () => {
  it('is false on a fresh save', () => {
    expect(hasStartedJourney(SaveManager.createNew())).toBe(false);
  });

  it('is true after entering the road', () => {
    const save = SaveManager.createNew();
    expect(
      hasStartedJourney({
        ...save,
        progress: { ...save.progress, currentMapId: 'map.fallen_village.01' },
      }),
    ).toBe(true);
  });
});

describe('WorldProgression.getNextJourneyMapId', () => {
  it('starts on chapter 1 explore map for a new save', () => {
    const save = SaveManager.createNew();
    expect(getNextJourneyMapId(save)).toBe('map.fallen_village.01');
  });

  it('advances to the next uncleared unlocked map', () => {
    const save = SaveManager.createNew();
    const clearedStage1 = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01'],
      },
    };
    expect(getNextJourneyMapId(clearedStage1)).toBe('map.fallen_village.02');
  });

  it('opens chapter 2 explore after chapter 1 finale is cleared', () => {
    const save = SaveManager.createNew();
    const ch1Complete = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01', 'map.fallen_village.02'],
        storySeen: ['story.ch01.awakening_jade'],
        unlockedChapters: ['chapter.02.mist_forest'],
        currentMapId: 'map.mist_forest.01',
      },
    };
    expect(getNextJourneyMapId(ch1Complete)).toBe('map.mist_forest.01');
  });
});

describe('WorldProgression.getJourneyHomeMapId', () => {
  it('skips a cleared currentMapId and uses the next journey stop', () => {
    const save = SaveManager.createNew();
    const afterBossClear = {
      ...save,
      progress: {
        ...save.progress,
        clearedMaps: ['map.fallen_village.01', 'map.fallen_village.02'],
        currentMapId: 'map.fallen_village.02',
      },
    };
    expect(getJourneyHomeMapId(afterBossClear)).toBe('map.mist_forest.01');
  });
});
