import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { getCultivationExpView, realmCapLabelKeyForOrder } from '@/progression/CultivationDisplay';
import { xpForLevel } from '@/progression/LevelCurve';
import { mapIntroStoryKey, shouldShowMapIntro, markMapIntroSeen } from '@/progression/MapIntroManager';

describe('getCultivationExpView', () => {
  it('returns partial progress within a level', () => {
    const save = SaveManager.createNew();
    const needed = xpForLevel(1);
    const view = getCultivationExpView(save.xp + Math.floor(needed / 2));
    expect(view.level).toBe(1);
    expect(view.pct).toBeGreaterThan(0);
    expect(view.pct).toBeLessThan(100);
  });

  it('reaches 100% at max level', () => {
    let total = 0;
    for (let level = 1; level < 100; level++) {
      total += xpForLevel(level);
    }
    const view = getCultivationExpView(total);
    expect(view.atMaxLevel).toBe(true);
    expect(view.pct).toBe(100);
  });
});

describe('realmCapLabelKeyForOrder', () => {
  it('maps chapter order to peak tier label key', () => {
    expect(realmCapLabelKeyForOrder(1)).toBe('realm.mortal_body.peak');
    expect(realmCapLabelKeyForOrder(3)).toBe('realm.foundation_establishment.peak');
  });
});

describe('MapIntroManager', () => {
  it('shows intro only once per map', () => {
    const save = SaveManager.createNew();
    expect(shouldShowMapIntro('map.fallen_village.01', save)).toBe(true);

    const patch = markMapIntroSeen('map.fallen_village.01', save);
    const next = { ...save, ...patch, progress: { ...save.progress, ...patch.progress! } };
    expect(shouldShowMapIntro('map.fallen_village.01', next)).toBe(false);
    expect(next.progress.storySeen).toContain(mapIntroStoryKey('map.fallen_village.01'));
  });
});
