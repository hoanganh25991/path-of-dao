import { describe, expect, it } from 'vitest';
import {
  computeAoeScale,
  computeBasicAttackAoeScale,
  scaledMeleeHalfArc,
} from '@/combat/combat/AoeScaling';

describe('AoeScaling', () => {
  it('grows with realm and level', () => {
    const early = computeAoeScale(1, 1);
    const mid = computeAoeScale(3, 7);
    const late = computeAoeScale(6, 16);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
  });

  it('basic attack gets extra realm reach', () => {
    const realm = 4;
    const level = 10;
    expect(computeBasicAttackAoeScale(realm, level)).toBeGreaterThan(
      computeAoeScale(realm, level),
    );
  });

  it('caps melee arc widening', () => {
    const base = Math.PI / 3;
    const widened = scaledMeleeHalfArc(base, computeAoeScale(7, 20));
    expect(widened).toBeLessThanOrEqual(Math.PI * 0.75);
    expect(widened).toBeGreaterThan(base * 0.85);
  });
});
