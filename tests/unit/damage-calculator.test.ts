import { describe, expect, it } from 'vitest';
import { moveSpeedPxPerSec, resolveDamage } from '@/progression/DamageCalculator';
import type { BaseStats } from '@/progression/types';

function makeStats(overrides: Partial<BaseStats> = {}): BaseStats {
  return {
    level: 1,
    hpMax: 100,
    manaMax: 50,
    atk: 100,
    def: 0,
    crit: 0,
    critDmg: 1.5,
    speed: 100,
    spirit: 50,
    ...overrides,
  };
}

const neverCrit = () => 1;
const alwaysCrit = () => 0;

describe('resolveDamage', () => {
  it('atk 100 vs def 0 deals ~100', () => {
    const result = resolveDamage(
      {
        attacker: makeStats({ atk: 100 }),
        defender: makeStats({ def: 0 }),
        skillMultiplier: 1,
        damageType: 'physical',
      },
      neverCrit,
    );
    expect(result.final).toBe(100);
    expect(result.isCrit).toBe(false);
    expect(result.blocked).toBe(0);
  });

  it('atk 100 vs def 100 deals ~50 (mitigation 50%)', () => {
    const result = resolveDamage(
      {
        attacker: makeStats({ atk: 100 }),
        defender: makeStats({ def: 100 }),
        skillMultiplier: 1,
        damageType: 'physical',
      },
      neverCrit,
    );
    expect(result.final).toBe(50);
    expect(result.blocked).toBeCloseTo(50);
  });

  it('guaranteed crit with critDmg 2.0 doubles non-crit damage', () => {
    const input = {
      attacker: makeStats({ atk: 100, crit: 1, critDmg: 2.0 }),
      defender: makeStats({ def: 100 }),
      skillMultiplier: 1,
      damageType: 'physical' as const,
    };
    const nonCrit = resolveDamage(input, neverCrit);
    const crit = resolveDamage(input, alwaysCrit);
    expect(crit.isCrit).toBe(true);
    expect(crit.final).toBe(nonCrit.final * 2);
  });

  it('never deals less than 1 damage', () => {
    const result = resolveDamage(
      {
        attacker: makeStats({ atk: 1 }),
        defender: makeStats({ def: 10_000 }),
        skillMultiplier: 0.1,
        damageType: 'physical',
      },
      neverCrit,
    );
    expect(result.final).toBe(1);
  });

  it('ignoreDef 50% deals more damage than 0%', () => {
    const base = {
      attacker: makeStats({ atk: 100 }),
      defender: makeStats({ def: 200 }),
      skillMultiplier: 1,
      damageType: 'physical' as const,
    };
    const noIgnore = resolveDamage(base, neverCrit);
    const withIgnore = resolveDamage({ ...base, ignoreDefPct: 0.5 }, neverCrit);
    expect(withIgnore.final).toBeGreaterThan(noIgnore.final);
  });

  it('spirit damage uses spirit stat vs half defense', () => {
    const result = resolveDamage(
      {
        attacker: makeStats({ atk: 0, spirit: 100 }),
        defender: makeStats({ def: 200 }),
        skillMultiplier: 1,
        damageType: 'spirit',
      },
      neverCrit,
    );
    // base 100, defEffective 100 → mitigation 50% → 50
    expect(result.final).toBe(50);
  });

  it('skill multiplier scales base damage', () => {
    const result = resolveDamage(
      {
        attacker: makeStats({ atk: 100 }),
        defender: makeStats({ def: 0 }),
        skillMultiplier: 2.5,
        damageType: 'physical',
      },
      neverCrit,
    );
    expect(result.final).toBe(250);
  });
});

describe('moveSpeedPxPerSec', () => {
  it('base speed 100 → 180 px/s', () => {
    expect(moveSpeedPxPerSec(100)).toBe(180);
  });

  it('scales linearly', () => {
    expect(moveSpeedPxPerSec(150)).toBe(270);
    expect(moveSpeedPxPerSec(50)).toBe(90);
  });
});
