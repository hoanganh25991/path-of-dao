import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  computeCombatPower,
  computeCombatPowerFromSave,
  computeOverlevelDamageMultiplier,
  formatCombatPower,
  INSIGHT_CP_PER_AWAKENING,
  REALM_CP_PER_ORDER,
  yearsCultivated,
} from '@/progression/CombatPower';
import { seedDefaultInsights } from '@/progression/InsightSystem';
import type { BaseStats } from '@/progression/types';

function makeStats(overrides: Partial<BaseStats> = {}): BaseStats {
  return {
    level: 1,
    hpMax: 120,
    manaMax: 50,
    atk: 14,
    def: 11,
    crit: 0.05,
    critDmg: 1.5,
    speed: 100,
    spirit: 10,
    ...overrides,
  };
}

/** Level-1 mortal body with default wood sword + novice robe (documented starter loadout). */
const STARTER_STATS = makeStats();

describe('computeCombatPower', () => {
  it('starter stat contribution is ~854 (level 1 + starter gear, no realm/insight bonus)', () => {
    const cp = computeCombatPower(STARTER_STATS, 0, {});
    expect(cp).toBe(854);
    expect(cp).toBeGreaterThanOrEqual(500);
    expect(cp).toBeLessThanOrEqual(2000);
  });

  it('adds +25000 per awakened insight', () => {
    const insights = seedDefaultInsights();
    insights.sword = { xp: 200, awakened: true, totalUses: 10 };

    const base = computeCombatPower(STARTER_STATS, 1, {});
    const awakened = computeCombatPower(STARTER_STATS, 1, insights);
    expect(awakened - base).toBe(INSIGHT_CP_PER_AWAKENING);
  });

  it('realm order 6 vs 1 adds +250000 realm bonus', () => {
    const order1 = computeCombatPower(STARTER_STATS, 1, {});
    const order6 = computeCombatPower(STARTER_STATS, 6, {});
    expect(order6 - order1).toBe(5 * REALM_CP_PER_ORDER);
  });

  it('computes from default new save with mortal_body realm order 1', () => {
    const save = SaveManager.createNew();
    const cp = computeCombatPowerFromSave(save);
    expect(cp).toBe(computeCombatPower(STARTER_STATS, 1, save.insights));
    expect(cp).toBe(50_854);
  });
});

describe('formatCombatPower', () => {
  it('formats with locale thousands separator', () => {
    expect(formatCombatPower(50854, 'en')).toBe('50,854');
    expect(formatCombatPower(50854, 'vi')).toMatch(/50[\s.]854/);
  });
});

describe('yearsCultivated', () => {
  it('combines play time and realm depth', () => {
    expect(yearsCultivated(0, 1)).toBe(17);
    expect(yearsCultivated(240, 3)).toBe(53);
  });
});

describe('computeOverlevelDamageMultiplier', () => {
  it('adds +10% per realm order above map, capped at +50%', () => {
    expect(computeOverlevelDamageMultiplier(2, 2)).toBe(1);
    expect(computeOverlevelDamageMultiplier(4, 1)).toBeCloseTo(1.3);
    expect(computeOverlevelDamageMultiplier(7, 1)).toBeCloseTo(1.5);
  });
});
