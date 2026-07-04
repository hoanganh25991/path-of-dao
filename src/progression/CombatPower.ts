import { EventBus } from '@/core/EventBus';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { EquipmentManager } from '@/progression/EquipmentManager';
import type { InsightState } from '@/progression/InsightSystem';
import { getRealmOrder } from '@/progression/RealmStatScaling';
import { applyModifiers } from '@/progression/StatModifier';
import type { BaseStats } from '@/progression/types';

/** CP contributed per cultivation realm order step (sub-plan 16). */
export const REALM_CP_PER_ORDER = 50_000;

/** CP per awakened insight intent. */
export const INSIGHT_CP_PER_AWAKENING = 25_000;

/**
 * Canonical combat power from resolved stats + realm + awakenings.
 * Speed uses ×1.2 per sub-plan 16 (master plan §7.1 lists ×120 — kept here for starter-range tuning).
 */
export function computeCombatPower(
  stats: BaseStats,
  realmOrder: number,
  insights: Record<string, InsightState>,
): number {
  const base =
    stats.hpMax * 0.15 +
    stats.manaMax * 0.08 +
    stats.atk * 2.5 +
    stats.def * 2.0 +
    stats.crit * 800 +
    stats.critDmg * 400 +
    stats.speed * 1.2 +
    stats.spirit * 1.5;

  const realmBonus = Math.max(0, realmOrder - 1) * REALM_CP_PER_ORDER;
  const insightBonus = Object.values(insights).filter((i) => i.awakened).length * INSIGHT_CP_PER_AWAKENING;

  return Math.floor(base + realmBonus + insightBonus);
}

/** Resolved stats (equipment modifiers) + save realm/insights. */
export function computeCombatPowerFromSave(save: PlayerSaveV1): number {
  const stats = resolveStatsForCombatPower(save);
  const realmOrder = getRealmOrder(save.realm.id);
  return computeCombatPower(stats, realmOrder, save.insights);
}

export function resolveStatsForCombatPower(save: PlayerSaveV1): BaseStats {
  const modifiers = EquipmentManager.getModifiers(save.equipped);
  return applyModifiers(save.stats, modifiers);
}

export function formatCombatPower(value: number, locale: string = 'en'): string {
  return value.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');
}

/** Real seconds per +1 cultivation year from play time (1 real day = 1 year). */
export const SECONDS_PER_CULTIVATION_YEAR = 86_400;

/** Flavor stat — play time + realm depth (sub-plan 16 §5). */
export function yearsCultivated(totalPlaySeconds: number, realmOrder: number): number {
  return Math.floor(totalPlaySeconds / SECONDS_PER_CULTIVATION_YEAR) + Math.max(0, realmOrder - 1) * 17;
}

/** Over-level damage multiplier when revisiting lower-realm maps (sub-plan 13 / 16 §7). */
export function computeOverlevelDamageMultiplier(
  playerRealmOrder: number,
  mapRealmOrder: number,
): number {
  const diff = Math.min(5, Math.max(0, playerRealmOrder - mapRealmOrder));
  return diff > 0 ? 1 + diff * 0.1 : 1;
}

export function notifyCombatPowerChanged(save: PlayerSaveV1): void {
  EventBus.emit('cp:changed', { cp: computeCombatPowerFromSave(save) });
}
