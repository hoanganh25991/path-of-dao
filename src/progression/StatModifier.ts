import type { BaseStats, ModifiableStat } from '@/progression/types';

/**
 * A single stat modifier from equipment, buffs, realm bonuses, etc.
 *
 * Stacking order (BREAKING CHANGE if reordered — documented in master plan):
 *   1. All `flat` bonuses sum per stat.
 *   2. All `percent` bonuses sum per stat.
 *   3. `final = (base + flatSum) * (1 + percentSum)`
 *   4. Clamp: crit ∈ [0, 0.75], critDmg ∈ [1.2, 3.0], speed ∈ [50, 200].
 */
export interface StatModifier {
  /** Unique id so equipment swaps can remove their own modifiers. */
  id: string;
  stat: ModifiableStat;
  kind: 'flat' | 'percent';
  value: number;
}

const CLAMPS: Partial<Record<ModifiableStat, { min: number; max: number }>> = {
  crit: { min: 0, max: 0.75 },
  critDmg: { min: 1.2, max: 3.0 },
  speed: { min: 50, max: 200 },
};

export function applyModifiers(base: BaseStats, modifiers: readonly StatModifier[]): BaseStats {
  const flat: Partial<Record<ModifiableStat, number>> = {};
  const pct: Partial<Record<ModifiableStat, number>> = {};

  for (const mod of modifiers) {
    const bucket = mod.kind === 'flat' ? flat : pct;
    bucket[mod.stat] = (bucket[mod.stat] ?? 0) + mod.value;
  }

  const resolved: BaseStats = { ...base };
  const stats: ModifiableStat[] = [
    'hpMax',
    'manaMax',
    'atk',
    'def',
    'crit',
    'critDmg',
    'speed',
    'spirit',
  ];

  for (const stat of stats) {
    let value = (base[stat] + (flat[stat] ?? 0)) * (1 + (pct[stat] ?? 0));
    const clamp = CLAMPS[stat];
    if (clamp) value = Math.min(clamp.max, Math.max(clamp.min, value));
    resolved[stat] = value;
  }

  return resolved;
}
