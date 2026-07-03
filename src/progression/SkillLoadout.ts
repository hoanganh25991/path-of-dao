import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
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

/** Pool for a slot — excludes skills already on the other two buttons. */
export function listAssignableSkills(
  loadout: EquippedSkills,
  slot: SkillSlotId,
  pool: string[],
): string[] {
  const taken = new Set(
    SKILL_SLOTS.filter((s) => s !== slot).map((s) => loadout[s]).filter(isFilledSkillSlot),
  );
  return pool.filter((id) => !taken.has(id) || loadout[slot] === id);
}

/** Assign without duplicates — swaps if the skill is already on another slot. */
export function assignSkillToSlot(
  loadout: EquippedSkills,
  slot: SkillSlotId,
  skillId: string,
): EquippedSkills {
  const otherSlot = SKILL_SLOTS.find((s) => s !== slot && loadout[s] === skillId);
  if (otherSlot) {
    return { ...loadout, [slot]: skillId, [otherSlot]: loadout[slot] };
  }
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

/** Ensure three unique skills — fills gaps from pool when template duplicates. */
export function normalizeLoadout(
  loadout: EquippedSkills,
  pool: string[],
): EquippedSkills {
  const next = { ...loadout };
  const used = new Set<string>();

  for (const slot of SKILL_SLOTS) {
    const id = next[slot];
    if (isFilledSkillSlot(id) && !used.has(id) && pool.includes(id)) {
      used.add(id);
      continue;
    }
    const replacement = pool.find((candidate) => !used.has(candidate));
    next[slot] = replacement ?? '';
    if (replacement) used.add(replacement);
  }
  return next;
}

export function defaultLoadoutFromSave(save: PlayerSaveV1): EquippedSkills {
  const pool = listUnlockedSkillIds(save);
  return normalizeLoadout(save.equippedSkills, pool);
}

export function canCastEquippedSkill(save: PlayerSaveV1, slot: SkillSlotId): boolean {
  const skillId = save.equippedSkills[slot];
  if (!isFilledSkillSlot(skillId)) return false;
  return listUnlockedSkillIds(save).includes(skillId);
}
