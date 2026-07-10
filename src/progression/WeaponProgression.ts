import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import type { EquipmentSlots } from '@/progression/ItemDefinition';
import type { WeaponPropType } from '@/progression/ItemDefinition';
import { getItemDefinition } from '@/progression/ItemLoader';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { unlockSkillIds } from '@/progression/SkillUnlockManager';
import { getSkillDefinition } from '@/progression/SkillLoader';

/** Hand strikes when no weapon; weapon prop when a blade/staff is equipped. */
export type AttackStyle = 'unarmed' | WeaponPropType;
export type WeaponMilestone = 'none' | 'ancient_sword';

export const ANCIENT_SWORD_ITEM_ID = 'item.sword.ancient';

export function hasAncientSwordMilestone(save: PlayerSaveV1): boolean {
  return save.progress.weaponMilestone === 'ancient_sword';
}

export function canUseSwordIntent(save: PlayerSaveV1): boolean {
  if (isAncientCombatActive()) return true;
  return hasAncientSwordMilestone(save);
}

export function isArmedAttackStyle(style: AttackStyle): style is WeaponPropType {
  return style !== 'unarmed';
}

/** Infer combat sprite prop from item id when weaponType is omitted. */
export function inferWeaponPropFromItemId(itemId: string): WeaponPropType {
  if (itemId.includes('.lance.') || itemId.includes('.spear.')) return 'lance';
  if (itemId.includes('.stick.') || itemId.includes('.staff.') || itemId.includes('.rod.')) {
    return 'stick';
  }
  return 'sword';
}

export function resolveWeaponPropFromItem(itemId: string): WeaponPropType {
  const def = getItemDefinition(itemId);
  return def.weaponType ?? inferWeaponPropFromItemId(itemId);
}

/** Basic attack animation + hitbox profile — follows equipped weapon, not milestone. */
export function resolveAttackStyle(save: PlayerSaveV1): AttackStyle {
  if (isAncientCombatActive()) return 'sword';
  const weaponId = save.equipped.weapon;
  if (!weaponId) return 'unarmed';
  return resolveWeaponPropFromItem(weaponId);
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
  const unlocked = unlockSkillIds(save, ['skill.sword.slash']);
  return {
    progress: { ...save.progress, weaponMilestone: 'ancient_sword' },
    equipped: { ...save.equipped, weapon: itemId },
    unlockedSkills: unlocked.unlockedSkills,
    divineArts: unlocked.divineArts,
  };
}
