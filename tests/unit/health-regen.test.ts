import { describe, expect, it } from 'vitest';
import {
  REGEN_STATE_MULTIPLIER,
  computeBaseRegenPerSec,
  computeHealthRegenPerSec,
  computeManaRegenPerSec,
  regenStateFromPlayerState,
} from '@/combat/combat/HealthRegen';

describe('HealthRegen', () => {
  it('scales base regen with level and realm order', () => {
    const mortalL1 = computeBaseRegenPerSec(1, 1);
    const foundationL10 = computeBaseRegenPerSec(2, 10);
    expect(mortalL1).toBeCloseTo(2.35, 2);
    expect(foundationL10).toBeGreaterThan(mortalL1 * 2);
  });

  it('applies state multipliers — meditate fastest, combat slowest', () => {
    const base = computeBaseRegenPerSec(2, 5);
    const walk = computeHealthRegenPerSec({ realmOrder: 2, level: 5, state: 'walk' });
    const meditate = computeHealthRegenPerSec({ realmOrder: 2, level: 5, state: 'meditate' });
    const combat = computeHealthRegenPerSec({ realmOrder: 2, level: 5, state: 'combat' });

    expect(walk).toBeCloseTo(base * REGEN_STATE_MULTIPLIER.walk, 5);
    expect(meditate).toBeCloseTo(base * REGEN_STATE_MULTIPLIER.meditate, 5);
    expect(combat).toBeCloseTo(base * REGEN_STATE_MULTIPLIER.combat, 5);
    expect(meditate).toBeGreaterThan(walk * 8);
    expect(walk).toBeGreaterThan(combat);
  });

  it('scales mana regen by pool ratio at same state multiplier', () => {
    const hpRate = computeHealthRegenPerSec({ realmOrder: 2, level: 5, state: 'meditate' });
    const manaRate = computeManaRegenPerSec({
      realmOrder: 2,
      level: 5,
      state: 'meditate',
      hpMax: 100,
      manaMax: 50,
    });

    expect(manaRate).toBeCloseTo(hpRate * 0.5, 5);
  });

  it('maps player states to regen buckets', () => {
    expect(regenStateFromPlayerState('meditate')).toBe('meditate');
    expect(regenStateFromPlayerState('attack')).toBe('combat');
    expect(regenStateFromPlayerState('move')).toBe('walk');
    expect(regenStateFromPlayerState('idle')).toBe('walk');
    expect(regenStateFromPlayerState('dead')).toBeNull();
  });
});
