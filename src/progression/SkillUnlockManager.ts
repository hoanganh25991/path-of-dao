import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { EventBus } from '@/core/EventBus';
import { equipLearnedSkill } from '@/progression/SkillLoadout';
import skillUnlocks from '../../content/progression/skill-unlocks.json';

type SkillUnlockConfig = {
  starter: string[];
  byLevel: Record<string, string>;
  byBoss: Record<string, string>;
  byChapter: Record<string, string>;
  byMapClear: Record<string, string>;
};

const CONFIG = skillUnlocks as SkillUnlockConfig;

/** Skills granted at new game — empty; learn on the road via level, boss, chapter, and cơ duyên. */
export const STARTER_SKILL_IDS: string[] = CONFIG.starter;

export function unlockSkillIds(save: PlayerSaveV1, ids: string[]): PlayerSaveV1 {
  return unlockAndEquip(save, ids);
}

function unlockAndEquip(save: PlayerSaveV1, ids: string[]): PlayerSaveV1 {
  const next = mergeUnlocks(save, ids);
  let loadout = next.equippedSkills;
  for (const id of ids) {
    if (next.unlockedSkills.includes(id)) {
      loadout = equipLearnedSkill(loadout, id);
    }
  }
  return loadout === next.equippedSkills ? next : { ...next, equippedSkills: loadout };
}

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
  const added = ids.filter((id) => !save.unlockedSkills.includes(id));
  const next = { ...save, unlockedSkills: [...current].sort() };
  if (added.length > 0) {
    EventBus.emit('skill:learned', { skillIds: added });
  }
  return next;
}

export function unlockSkillsForLevel(save: PlayerSaveV1, oldLevel: number, newLevel: number): PlayerSaveV1 {
  const ids: string[] = [];
  for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
    const skillId = CONFIG.byLevel[String(lv)];
    if (skillId && !save.unlockedSkills.includes(skillId)) {
      ids.push(skillId);
    }
  }
  return ids.length > 0 ? unlockAndEquip(save, ids) : save;
}

export function unlockSkillForBoss(save: PlayerSaveV1, bossClearId: string): PlayerSaveV1 {
  const skillId = CONFIG.byBoss[bossClearId];
  return skillId ? unlockAndEquip(save, [skillId]) : save;
}

export function unlockSkillsForChapter(save: PlayerSaveV1, chapterId: string): PlayerSaveV1 {
  const skillId = CONFIG.byChapter[chapterId];
  return skillId ? unlockAndEquip(save, [skillId]) : save;
}

/** First clear of a map — teaches a technique earned on the road. */
export function unlockSkillsForMapClear(save: PlayerSaveV1, mapId: string): PlayerSaveV1 {
  const skillId = CONFIG.byMapClear[mapId];
  return skillId ? unlockAndEquip(save, [skillId]) : save;
}

export function isSkillUnlocked(save: PlayerSaveV1, skillId: string): boolean {
  return save.unlockedSkills.includes(skillId);
}
