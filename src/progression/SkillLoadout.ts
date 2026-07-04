import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { BUILTIN_SKILL_IDS } from '@/progression/BuiltinSkills';
import { getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import { getInsightIntentConfig, getIntentForSkillId, listInsightIntentIds } from '@/progression/InsightDefinitions';
import { getInsightState } from '@/progression/InsightSystem';
import { filterSkillsForWeaponGate } from '@/progression/WeaponProgression';
import type { SkillSlotId } from '@/ui/skills/SkillIcon';

export type EquippedSkills = PlayerSaveV1['equippedSkills'];

export const SKILL_SLOTS: SkillSlotId[] = ['primary', 'secondary', 'ultimate'];

export function isFilledSkillSlot(skillId: string): boolean {
  return skillId.length > 0;
}

/** Intents the player has touched — unlocked skill, insight XP, or awakening. */
export function listDiscoveredIntentIds(save: PlayerSaveV1): string[] {
  const discovered = new Set<string>();

  for (const skillId of save.unlockedSkills) {
    const intent = getIntentForSkillId(skillId);
    if (intent) discovered.add(intent);
  }

  for (const intentId of listInsightIntentIds()) {
    const state = getInsightState(save, intentId);
    if (state.xp > 0 || state.awakened || state.totalUses > 0) {
      discovered.add(intentId);
    }
  }

  return [...discovered].sort();
}

/** Built-in skills always available in the loadout picker (meditate, etc.). */
export function listBuiltinSkillIds(): string[] {
  return [...BUILTIN_SKILL_IDS];
}

/** Assignable pool — earned unlocks (+ awakened variants) plus built-ins. */
export function listAssignableSkillPool(save: PlayerSaveV1): string[] {
  const unlocked = listUnlockedSkillIds(save);
  const merged = new Set([...listBuiltinSkillIds(), ...unlocked]);
  return [...merged].sort();
}

/** Skills the player may assign — only earned unlocks (+ awakened variants). */
export function listUnlockedSkillIds(save: PlayerSaveV1): string[] {
  const ancientId = getActiveAncientId();
  if (ancientId) {
    return [...getAncientProfile(ancientId).unlockedSkills];
  }

  const ids = new Set<string>(save.unlockedSkills);
  for (const intentId of listInsightIntentIds()) {
    const config = getInsightIntentConfig(intentId);
    if (save.insights[intentId]?.awakened && ids.has(config.baseSkillId)) {
      ids.add(config.awakenedSkillId);
    }
  }
  return filterSkillsForWeaponGate(save, [...ids].sort());
}

/** Full skill pool for a slot — duplicates allowed across slots. */
export function listAssignableSkills(
  _loadout: EquippedSkills,
  _slot: SkillSlotId,
  pool: string[],
): string[] {
  return pool.filter(isFilledSkillSlot);
}

/** Assign a skill to a slot — duplicates across slots are allowed. */
export function assignSkillToSlot(
  loadout: EquippedSkills,
  slot: SkillSlotId,
  skillId: string,
): EquippedSkills {
  return { ...loadout, [slot]: skillId };
}

/** Put a newly learned skill on the first empty combat slot. */
export function equipLearnedSkill(loadout: EquippedSkills, skillId: string): EquippedSkills {
  if (Object.values(loadout).includes(skillId)) return loadout;
  for (const slot of SKILL_SLOTS) {
    if (!isFilledSkillSlot(loadout[slot])) {
      return { ...loadout, [slot]: skillId };
    }
  }
  return loadout;
}

/** Ensure each slot has a valid pool skill — duplicates are kept. */
export function normalizeLoadout(
  loadout: EquippedSkills,
  pool: string[],
): EquippedSkills {
  const fallback = pool.find(isFilledSkillSlot) ?? '';
  const next = { ...loadout };

  for (const slot of SKILL_SLOTS) {
    const id = next[slot];
    if (!isFilledSkillSlot(id) || !pool.includes(id)) {
      next[slot] = fallback;
    }
  }

  return next;
}

export function defaultLoadoutFromSave(save: PlayerSaveV1): EquippedSkills {
  const pool = listAssignableSkillPool(save);
  return normalizeLoadout(save.equippedSkills, pool);
}

export function canCastEquippedSkill(save: PlayerSaveV1, slot: SkillSlotId): boolean {
  const skillId = save.equippedSkills[slot];
  if (!isFilledSkillSlot(skillId)) return false;
  if (listBuiltinSkillIds().includes(skillId)) return true;
  return listUnlockedSkillIds(save).includes(skillId);
}
