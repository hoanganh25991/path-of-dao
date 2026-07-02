import { describe, expect, it } from 'vitest';
import { StatSheet } from '@/progression/StatSheet';
import { applyModifiers } from '@/progression/StatModifier';
import type { BaseStats } from '@/progression/types';

function makeBase(overrides: Partial<BaseStats> = {}): BaseStats {
  return {
    level: 1,
    hpMax: 100,
    manaMax: 50,
    atk: 10,
    def: 5,
    crit: 0.05,
    critDmg: 1.5,
    speed: 100,
    spirit: 10,
    ...overrides,
  };
}

describe('applyModifiers', () => {
  it('applies flat then percent: (base + flat) * (1 + pct)', () => {
    const resolved = applyModifiers(makeBase({ atk: 100 }), [
      { id: 'sword', stat: 'atk', kind: 'flat', value: 50 },
      { id: 'ring', stat: 'atk', kind: 'percent', value: 0.2 },
    ]);
    expect(resolved.atk).toBeCloseTo((100 + 50) * 1.2);
  });

  it('sums multiple modifiers of the same kind', () => {
    const resolved = applyModifiers(makeBase({ hpMax: 100 }), [
      { id: 'a', stat: 'hpMax', kind: 'flat', value: 20 },
      { id: 'b', stat: 'hpMax', kind: 'flat', value: 30 },
      { id: 'c', stat: 'hpMax', kind: 'percent', value: 0.1 },
      { id: 'd', stat: 'hpMax', kind: 'percent', value: 0.1 },
    ]);
    expect(resolved.hpMax).toBeCloseTo(150 * 1.2);
  });

  it('clamps crit, critDmg, and speed', () => {
    const resolved = applyModifiers(makeBase(), [
      { id: 'a', stat: 'crit', kind: 'flat', value: 5 },
      { id: 'b', stat: 'critDmg', kind: 'flat', value: 10 },
      { id: 'c', stat: 'speed', kind: 'flat', value: 500 },
    ]);
    expect(resolved.crit).toBe(0.75);
    expect(resolved.critDmg).toBe(3.0);
    expect(resolved.speed).toBe(200);
  });
});

describe('StatSheet', () => {
  it('starts with full HP and mana', () => {
    const sheet = new StatSheet(makeBase());
    expect(sheet.runtime.hp).toBe(100);
    expect(sheet.runtime.mana).toBe(50);
  });

  it('recalculates when modifiers change and clamps runtime pools', () => {
    const sheet = new StatSheet(makeBase(), [
      { id: 'armor', stat: 'hpMax', kind: 'flat', value: 100 },
    ]);
    sheet.refill();
    expect(sheet.runtime.hp).toBe(200);

    sheet.removeModifier('armor');
    expect(sheet.resolved.hpMax).toBe(100);
    expect(sheet.runtime.hp).toBe(100);
  });

  it('HP cannot go below 0 and reports actual loss', () => {
    const sheet = new StatSheet(makeBase());
    const lost = sheet.applyDamage(500);
    expect(lost).toBe(100);
    expect(sheet.runtime.hp).toBe(0);
    expect(sheet.isDead).toBe(true);
  });

  it('heal cannot exceed hpMax', () => {
    const sheet = new StatSheet(makeBase());
    sheet.applyDamage(30);
    sheet.heal(1000);
    expect(sheet.runtime.hp).toBe(100);
  });

  it('spendMana fails when insufficient and spends nothing', () => {
    const sheet = new StatSheet(makeBase());
    expect(sheet.spendMana(30)).toBe(true);
    expect(sheet.runtime.mana).toBe(20);
    expect(sheet.spendMana(21)).toBe(false);
    expect(sheet.runtime.mana).toBe(20);
  });

  it('setRuntime clamps to valid range (save load)', () => {
    const sheet = new StatSheet(makeBase());
    sheet.setRuntime(9999, -5);
    expect(sheet.runtime.hp).toBe(100);
    expect(sheet.runtime.mana).toBe(0);
  });
});
