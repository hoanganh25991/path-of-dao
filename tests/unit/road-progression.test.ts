import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { getNextJourneyMapId } from '@/progression/WorldProgression';
import { simulateRoadThroughChapter, simulateBossClearPendingStory, simulateReadyForOrdeal } from '@/progression/RoadProgressSimulator';

describe('full road progression', () => {
  it('chapter 2 opens after chapter 1 loop', () => {
    const save = simulateRoadThroughChapter(1);
    expect(save.progress.clearedMaps).toContain('map.fallen_village.02');
    expect(save.progress.unlockedChapters).toContain('chapter.02.mist_forest');
    expect(getNextJourneyMapId(save)).toBe('map.mist_forest.01');
    expect(save.progress.currentMapId).toBe('map.mist_forest.01');
  });

  it('chapter 3 opens after chapter 2 loop', () => {
    const save = simulateRoadThroughChapter(2);
    expect(save.progress.unlockedChapters).toContain('chapter.03.stone_canyon');
    expect(getNextJourneyMapId(save)).toBe('map.stone_canyon.01');
    expect(save.unlockedSkills).toContain('skill.life.pulse.v2');
  });

  it('each explore map clear grants a unique road technique through chapter 10', () => {
    const save = simulateRoadThroughChapter(10);
    const exploreSkills = [
      'skill.life.mend',
      'skill.life.pulse.v2',
      'skill.life.bloom.v1',
      'skill.time.slow',
      'skill.flame.scorch.v1',
      'skill.lightning.fork.v1',
      'skill.time.drift.v2',
      'skill.void.rift.v1',
      'skill.sword.burst.v4',
      'skill.void.tear.v2',
    ];
    for (const skillId of exploreSkills) {
      expect(save.unlockedSkills).toContain(skillId);
    }
    expect(getNextJourneyMapId(save)).toBeNull();
  });

  it('mid-road chapter 5 points at thunder peaks explore', () => {
    const save = simulateRoadThroughChapter(5);
    expect(getNextJourneyMapId(save)).toBe('map.thunder_peaks.01');
  });

  it('all ten chapter story skills unlock by chapter 10 finale', () => {
    const save = simulateRoadThroughChapter(10);
    expect(save.progress.storySeen).toHaveLength(10);
    expect(save.unlockedSkills).toContain('skill.time.echo.v5');
    expect(getNextJourneyMapId(save)).toBeNull();
    expect(save.progress.currentMapId).toBeNull();
  });
});

describe('DevSaveSeeds.build via simulator', () => {
  it('fresh save differs from chapter-1-complete seed', () => {
    const fresh = SaveManager.createNew();
    const ch1 = simulateRoadThroughChapter(1);
    expect(ch1.progress.clearedMaps.length).toBeGreaterThan(fresh.progress.clearedMaps.length);
  });
});

describe('simulateBossClearPendingStory', () => {
  it('clears chapter boss but leaves story unseen', () => {
    const save = simulateBossClearPendingStory(1);
    expect(save.progress.clearedMaps).toContain('map.fallen_village.02');
    expect(save.progress.storySeen).not.toContain('story.ch01.awakening_jade');
    expect(save.progress.unlockedChapters).not.toContain('chapter.02.mist_forest');
  });
});

describe('simulateReadyForOrdeal', () => {
  it('clears explore and points journey at the boss map for chapter 1', () => {
    const save = simulateReadyForOrdeal(1);
    expect(save.progress.clearedMaps).toEqual(['map.fallen_village.01']);
    expect(getNextJourneyMapId(save)).toBe('map.fallen_village.02');
  });

  it('opens chapter 2 explore after chapter 1 is complete', () => {
    const save = simulateReadyForOrdeal(2);
    expect(save.progress.clearedMaps).toContain('map.fallen_village.02');
    expect(getNextJourneyMapId(save)).toBe('map.mist_forest.02');
  });
});
