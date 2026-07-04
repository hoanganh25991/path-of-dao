import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import { getInsightIntentConfig, getIntentForSkillId, listInsightIntentIds } from '@/progression/InsightDefinitions';
import { getInsightState } from '@/progression/InsightSystem';
import {
  coerceEquippedSkills,
  emptyEquippedSkills,
  SKILL_SLOT_INDICES,
  type EquippedSkills,
  type SkillSlotIndex,
} from '@/progression/SkillSlots';
import { filterSkillsForWeaponGate } from '@/progression/WeaponProgression';

export type { EquippedSkills, SkillSlotIndex as SkillSlotId } from '@/progression/SkillSlots';
export { SKILL_SLOT_INDICES as SKILL_SLOTS } from '@/progression/SkillSlots';

export function isFilledSkillSlot(skillId: string | undefined): boolean {
  return typeof skillId === 'string' && skillId.length > 0;
}

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

export function listAssignableSkillPool(save: PlayerSaveV1): string[] {
  return listUnlockedSkillIds(save);
}

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

export function listAssignableSkills(
  _loadout: EquippedSkills,
  _slot: SkillSlotIndex,
  pool: string[],
): string[] {
  return pool.filter(isFilledSkillSlot);
}

export function assignSkillToSlot(
  loadout: EquippedSkills,
  slot: SkillSlotIndex,
  skillId: string,
): EquippedSkills {
  const next = [...loadout] as EquippedSkills;
  next[slot] = skillId;
  return next;
}

export function equipLearnedSkill(loadout: EquippedSkills, skillId: string): EquippedSkills {
  if (loadout.includes(skillId)) return loadout;
  for (const slot of SKILL_SLOT_INDICES) {
    if (!isFilledSkillSlot(loadout[slot])) {
      return assignSkillToSlot(loadout, slot, skillId);
    }
  }
  return loadout;
}

/** Drop skills outside the pool; leave empty slots empty (no HUD placeholder). */
export function normalizeLoadout(loadout: EquippedSkills | unknown, pool: string[]): EquippedSkills {
  const next = coerceEquippedSkills(loadout);

  for (const slot of SKILL_SLOT_INDICES) {
    const id = next[slot];
    if (isFilledSkillSlot(id) && !pool.includes(id)) {
      next[slot] = '';
    }
  }

  return next;
}

export function defaultLoadoutFromSave(save: PlayerSaveV1): EquippedSkills {
  const pool = listAssignableSkillPool(save);
  return normalizeLoadout(save.equippedSkills, pool);
}

export function canCastEquippedSkill(save: PlayerSaveV1, slot: SkillSlotIndex): boolean {
  const loadout = coerceEquippedSkills(save.equippedSkills);
  const skillId = loadout[slot];
  if (!isFilledSkillSlot(skillId)) return false;
  return listUnlockedSkillIds(save).includes(skillId);
}

export { coerceEquippedSkills, emptyEquippedSkills };
