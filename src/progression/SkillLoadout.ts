import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import { getInsightIntentConfig, listInsightIntentIds } from '@/progression/InsightDefinitions';
import type { SkillSlotId } from '@/ui/skills/SkillIcon';

export type EquippedSkills = PlayerSaveV1['equippedSkills'];

export const SKILL_SLOTS: SkillSlotId[] = ['primary', 'secondary', 'ultimate'];

/** Skills the player may assign — ancient pool or all base + awakened unlocks. */
export function listUnlockedSkillIds(save: PlayerSaveV1): string[] {
  const ancientId = getActiveAncientId();
  if (ancientId) {
    return [...getAncientProfile(ancientId).unlockedSkills];
  }

  const ids = new Set<string>(Object.values(save.equippedSkills));
  for (const intentId of listInsightIntentIds()) {
    const config = getInsightIntentConfig(intentId);
    const state = save.insights[intentId];
    ids.add(config.baseSkillId);
    if (state?.awakened) ids.add(config.awakenedSkillId);
  }
  return [...ids].sort();
}

/** Pool for a slot — excludes skills already on the other two buttons. */
export function listAssignableSkills(
  loadout: EquippedSkills,
  slot: SkillSlotId,
  pool: string[],
): string[] {
  const taken = new Set(
    SKILL_SLOTS.filter((s) => s !== slot).map((s) => loadout[s]),
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

/** Ensure three unique skills — fills gaps from pool when template duplicates. */
export function normalizeLoadout(
  loadout: EquippedSkills,
  pool: string[],
): EquippedSkills {
  const next = { ...loadout };
  const used = new Set<string>();

  for (const slot of SKILL_SLOTS) {
    const id = next[slot];
    if (id && !used.has(id) && pool.includes(id)) {
      used.add(id);
      continue;
    }
    const replacement = pool.find((candidate) => !used.has(candidate));
    if (replacement) {
      next[slot] = replacement;
      used.add(replacement);
    }
  }
  return next;
}

export function defaultLoadoutFromSave(save: PlayerSaveV1): EquippedSkills {
  const pool = listUnlockedSkillIds(save);
  return normalizeLoadout(save.equippedSkills, pool);
}
