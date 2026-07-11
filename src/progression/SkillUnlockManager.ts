import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { EventBus } from '@/core/EventBus';
import {
  equipLearnedSkill,
  listUnlockedSkillIds,
  normalizeLoadout,
} from '@/progression/SkillLoadout';
import { isIntentUnlocked } from '@/progression/MasterIntentSystem';
import { getSkillDefinition } from '@/progression/SkillLoader';
import skillUnlocks from '../../content/progression/skill-unlocks.json';

type SkillUnlockConfig = {
  starter: string[];
  byLevel: Record<string, string>;
  byBoss: Record<string, string>;
  byChapter: Record<string, string>;
  byMapClear: Record<string, string>;
};

const CONFIG = skillUnlocks as SkillUnlockConfig;

/**
 * Skills granted at new game — Life-and-Death mend so the wheel is never empty.
 * Gate / later main-flow arts are earned on the road (level, map clear, boss, chapter).
 */
export const STARTER_SKILL_IDS: string[] = CONFIG.starter;

export function unlockSkillIds(save: PlayerSaveV1, ids: string[]): PlayerSaveV1 {
  return unlockAndEquip(save, ids);
}

function canAutoEquip(save: PlayerSaveV1, skillId: string): boolean {
  try {
    return isIntentUnlocked(getSkillDefinition(skillId).intent, save);
  } catch {
    return false;
  }
}

function unlockAndEquip(save: PlayerSaveV1, ids: string[]): PlayerSaveV1 {
  const next = mergeUnlocks(save, ids);
  let loadout = next.divineArts;
  for (const id of ids) {
    // Only put castable arts on the wheel — gated intents stay unlocked-but-unequipped
    // until their Master Intent milestone opens (plan 14).
    if (next.unlockedSkills.includes(id) && canAutoEquip(next, id)) {
      loadout = equipLearnedSkill(loadout, id);
    }
  }
  return loadout === next.divineArts ? next : { ...next, divineArts: loadout };
}

/**
 * Catch-up for mid-run saves after Master Intent remapped early unlocks:
 * re-apply byLevel rewards through the current level, ensure starter arts exist,
 * and scrub gated arts that were auto-equipped onto the wheel before the gate fix.
 */
export function catchUpSkillUnlocks(save: PlayerSaveV1): PlayerSaveV1 {
  let next = save;
  if (STARTER_SKILL_IDS.length > 0) {
    next = unlockAndEquip(next, STARTER_SKILL_IDS);
  }
  const level = Math.max(1, next.stats.level);
  if (level > 1) {
    next = unlockSkillsForLevel(next, 1, level);
  }

  const pool = listUnlockedSkillIds(next);
  let loadout = normalizeLoadout(next.divineArts, pool);
  for (const id of pool) {
    loadout = equipLearnedSkill(loadout, id);
  }
  if (loadout !== next.divineArts && loadout.some((id, i) => id !== next.divineArts[i])) {
    next = { ...next, divineArts: loadout };
  }
  return next;
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
