import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import skillUnlocks from '../../content/progression/skill-unlocks.json';

export const STARTER_SKILL_IDS: string[] = skillUnlocks.starter;

type SkillUnlockConfig = {
  starter: string[];
  byLevel: Record<string, string>;
  byBoss: Record<string, string>;
  byChapter: Record<string, string>;
};

const CONFIG = skillUnlocks as SkillUnlockConfig;

function mergeUnlocks(save: PlayerSaveV1, ids: string[]): PlayerSaveV1 {
  const current = new Set(save.unlockedSkills);
  let changed = false;
  for (const id of ids) {
    if (!current.has(id)) {
      current.add(id);
      changed = true;
    }
  }
  if (!changed) return save;
  return { ...save, unlockedSkills: [...current].sort() };
}

export function unlockSkillsForLevel(save: PlayerSaveV1, level: number): PlayerSaveV1 {
  const skillId = CONFIG.byLevel[String(level)];
  return skillId ? mergeUnlocks(save, [skillId]) : save;
}

export function unlockSkillForBoss(save: PlayerSaveV1, bossClearId: string): PlayerSaveV1 {
  const skillId = CONFIG.byBoss[bossClearId];
  return skillId ? mergeUnlocks(save, [skillId]) : save;
}

export function unlockSkillsForChapter(save: PlayerSaveV1, chapterId: string): PlayerSaveV1 {
  const skillId = CONFIG.byChapter[chapterId];
  return skillId ? mergeUnlocks(save, [skillId]) : save;
}

export function isSkillUnlocked(save: PlayerSaveV1, skillId: string): boolean {
  return save.unlockedSkills.includes(skillId);
}
