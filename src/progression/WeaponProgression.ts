import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import type { EquipmentSlots } from '@/progression/ItemDefinition';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { getSkillDefinition } from '@/progression/SkillLoader';

export type AttackStyle = 'unarmed' | 'sword';
export type WeaponMilestone = 'none' | 'ancient_sword';

export const ANCIENT_SWORD_ITEM_ID = 'item.sword.ancient';

export function hasAncientSwordMilestone(save: PlayerSaveV1): boolean {
  return save.progress.weaponMilestone === 'ancient_sword';
}

export function canUseSwordIntent(save: PlayerSaveV1): boolean {
  if (isAncientCombatActive()) return true;
  return hasAncientSwordMilestone(save);
}

export function resolveAttackStyle(save: PlayerSaveV1): AttackStyle {
  if (isAncientCombatActive()) return 'sword';
  if (hasAncientSwordMilestone(save)) return 'sword';
  return 'unarmed';
}

/** Hide weapon mesh in Home until the ancient blade is earned (T8). */
export function getHeroDisplayEquipment(save: PlayerSaveV1): EquipmentSlots {
  if (hasAncientSwordMilestone(save)) return save.equipped;
  return { ...save.equipped, weapon: null };
}

export function filterSkillsForWeaponGate(save: PlayerSaveV1, skillIds: string[]): string[] {
  if (canUseSwordIntent(save)) return skillIds;
  return skillIds.filter((id) => getSkillDefinition(id).intent !== 'sword');
}

export function patchAncientSwordMilestone(
  save: PlayerSaveV1,
  itemId: string,
): Partial<PlayerSaveV1> | null {
  if (itemId !== ANCIENT_SWORD_ITEM_ID) return null;
  if (hasAncientSwordMilestone(save)) return null;
  return {
    progress: { ...save.progress, weaponMilestone: 'ancient_sword' },
    equipped: { ...save.equipped, weapon: itemId },
  };
}
