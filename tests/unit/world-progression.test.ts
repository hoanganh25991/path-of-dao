import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { canEnter } from '@/progression/WorldProgression';

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
