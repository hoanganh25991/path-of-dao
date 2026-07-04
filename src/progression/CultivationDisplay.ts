import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { levelFromTotalXp, xpForLevel, MAX_LEVEL } from '@/progression/LevelCurve';
import { getRealmDefinition, listRealmDefinitions } from '@/progression/RealmStatScaling';
import type { RealmTier } from '@/progression/CultivationRealm';

export const IMMORTAL_JADE_ITEM_ID = 'item.consumable.immortal_jade';

export interface CultivationExpView {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  pct: number;
  atMaxLevel: boolean;
}

/** XP bar fill + label values for the combat HUD cultivation meter. */
export function getCultivationExpView(totalXp: number): CultivationExpView {
  const { level, xpIntoLevel } = levelFromTotalXp(totalXp);
  const xpToNext = xpForLevel(level);
  const atMaxLevel = level >= MAX_LEVEL || xpToNext === 0;
  const pct = atMaxLevel ? 100 : Math.min(100, Math.round((xpIntoLevel / xpToNext) * 100));

  return { level, xpIntoLevel, xpToNext, pct, atMaxLevel };
}

export function realmTierLabelKey(realmId: string, tier: RealmTier): string {
  return `realm.${realmId}.${tier}`;
}

export function realmTierLabel(save: PlayerSaveV1): string {
  return realmTierLabelKey(save.realm.id, save.realm.tier);
}

/** Map `recommendedRealmOrder` → peak tier label key for intro copy. */
export function realmCapLabelKeyForOrder(order: number): string {
  const def = listRealmDefinitions().find((r) => r.order === order);
  if (!def) return 'realm.mortal_body.peak';
  return `${def.displayKey}.peak`;
}

export function getRealmDefinitionByOrder(order: number) {
  const def = listRealmDefinitions().find((r) => r.order === order);
  if (!def) return getRealmDefinition('mortal_body');
  return def;
}
