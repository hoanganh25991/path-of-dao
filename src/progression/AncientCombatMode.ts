import type { StatSheet } from '@/progression/StatSheet';
import { getActiveAncientId } from '@/progression/AncientDemoManager';

/** Display multiplier so ancient echoes show imposing HP/Mana values. */
const ANCIENT_POOL_AMP = 10;
const ANCIENT_HP_FLOOR = 50_000;
const ANCIENT_MANA_FLOOR = 25_000;

export function isAncientCombatActive(): boolean {
  return getActiveAncientId() !== null;
}

/** God-mode pools: unlimited combat, inflated numbers for show-off HUD. */
export function applyAncientGodMode(sheet: StatSheet): void {
  const resolved = sheet.resolved;
  const hpMax = Math.max(ANCIENT_HP_FLOOR, Math.floor(resolved.hpMax * ANCIENT_POOL_AMP));
  const manaMax = Math.max(ANCIENT_MANA_FLOOR, Math.floor(resolved.manaMax * ANCIENT_POOL_AMP));
  sheet.enableGodMode(hpMax, manaMax);
}
