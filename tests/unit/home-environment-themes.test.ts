import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { getHomeThemeForMap, getHomeThemeForSave } from '@/home/homeEnvironmentThemes';
import { getJourneyHomeMapId } from '@/progression/WorldProgression';

describe('getJourneyHomeMapId', () => {
  it('uses next journey map on a fresh save', () => {
    expect(getJourneyHomeMapId(SaveManager.createNew())).toBe('map.fallen_village.01');
  });

  it('prefers currentMapId when set', () => {
    const save = SaveManager.createNew();
    expect(
      getJourneyHomeMapId({
        ...save,
        progress: { ...save.progress, currentMapId: 'map.mist_forest.01' },
      }),
    ).toBe('map.mist_forest.01');
  });
});

describe('home environment themes', () => {
  it('maps fallen village to warm ruin palette', () => {
    const theme = getHomeThemeForMap('map.fallen_village.01');
    expect(theme.chapterId).toBe('chapter.01.fallen_village');
    expect(theme.signature).toBe('ruined_pillar');
  });

  it('maps mist forest to green mist palette', () => {
    const theme = getHomeThemeForMap('map.mist_forest.02');
    expect(theme.chapterId).toBe('chapter.02.mist_forest');
    expect(theme.signature).toBe('mist_pine');
  });

  it('resolves theme from save journey position', () => {
    const save = SaveManager.createNew();
    const theme = getHomeThemeForSave({
      ...save,
      progress: { ...save.progress, currentMapId: 'map.thunder_peaks.01' },
    });
    expect(theme.chapterId).toBe('chapter.06.thunder_peaks');
    expect(theme.signature).toBe('storm_crystal');
  });
});
