import { describe, expect, it } from 'vitest';
import { getMapConfig } from '@/combat/map/MapLoader';
import { getChapter } from '@/progression/ChapterLoader';
import { getSkillDefinition } from '@/progression/SkillLoader';
import { unlockSkillsForChapter, unlockSkillsForMapClear } from '@/progression/SkillUnlockManager';
import { SaveManager } from '@/core/save/SaveManager';
import skillUnlocks from '../../content/progression/skill-unlocks.json';

type SkillUnlockConfig = {
  starter: string[];
  byLevel: Record<string, string>;
  byBoss: Record<string, string>;
  byChapter: Record<string, string>;
  byMapClear: Record<string, string>;
};

const CONFIG = skillUnlocks as SkillUnlockConfig;

function expectSkillExists(skillId: string): void {
  expect(() => getSkillDefinition(skillId)).not.toThrow();
}

describe('skill-unlocks.json references', () => {
  it('starter skills exist', () => {
    for (const skillId of CONFIG.starter) {
      expectSkillExists(skillId);
    }
  });

  it('byMapClear maps and skills exist', () => {
    for (const [mapId, skillId] of Object.entries(CONFIG.byMapClear)) {
      expect(() => getMapConfig(mapId)).not.toThrow();
      expect(mapId.endsWith('.01')).toBe(true);
      expectSkillExists(skillId);
    }
    expect(Object.keys(CONFIG.byMapClear)).toHaveLength(10);
  });

  it('byChapter chapters and skills exist', () => {
    for (const [chapterId, skillId] of Object.entries(CONFIG.byChapter)) {
      expect(() => getChapter(chapterId)).not.toThrow();
      expectSkillExists(skillId);
    }
    expect(Object.keys(CONFIG.byChapter)).toHaveLength(10);
  });

  it('map-clear and chapter rewards do not overlap per chapter', () => {
    for (const [mapId, mapSkill] of Object.entries(CONFIG.byMapClear)) {
      const config = getMapConfig(mapId);
      const chapterSkill = CONFIG.byChapter[config.chapterId];
      if (chapterSkill) {
        expect(mapSkill).not.toBe(chapterSkill);
      }
    }
  });
});

describe('unlockSkillsForMapClear on the road', () => {
  it('teaches flame bolt on mist forest explore clear', () => {
    const save = SaveManager.createNew();
    const next = unlockSkillsForMapClear(save, 'map.mist_forest.01');
    expect(next.unlockedSkills).toContain('skill.flame.bolt');
    expect(Object.values(next.divineArts)).toContain('skill.flame.bolt');
  });

  it('does not re-unlock on repeat clear', () => {
    const save = SaveManager.createNew();
    const once = unlockSkillsForMapClear(save, 'map.mist_forest.01');
    const twice = unlockSkillsForMapClear(once, 'map.mist_forest.01');
    expect(twice).toBe(once);
  });
});

describe('unlockSkillsForChapter endgame', () => {
  it('grants chapter 10 story skill', () => {
    const save = SaveManager.createNew();
    const next = unlockSkillsForChapter(save, 'chapter.10.void_throne');
    expect(next.unlockedSkills).toContain('skill.time.echo.v5');
  });
});
