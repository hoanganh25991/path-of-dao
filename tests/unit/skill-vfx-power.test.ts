import { describe, expect, it } from 'vitest';
import { skillVfxPower, skillVfxTierFromId } from '@/combat/skills/skillVfxPower';

describe('skillVfxPower', () => {
  it('tiers base arts as low', () => {
    expect(skillVfxTierFromId('skill.void.slash')).toBe('low');
    expect(skillVfxTierFromId('skill.flame.bolt')).toBe('low');
    expect(skillVfxTierFromId('skill.flame.scorch.v1')).toBe('low');
  });

  it('ramps tier with skill version suffix', () => {
    expect(skillVfxTierFromId('skill.flame.ember.v2')).toBe('medium');
    expect(skillVfxTierFromId('skill.flame.pillar.v3')).toBe('medium');
    expect(skillVfxTierFromId('skill.flame.lotus.v4')).toBe('high');
    expect(skillVfxTierFromId('skill.void.abyss.v5')).toBe('ultra');
    expect(skillVfxTierFromId('skill.void.slash.awakened')).toBe('ultra');
  });

  it('scales power by tier and god mode', () => {
    expect(skillVfxPower('skill.flame.bolt', 1)).toBe(1);
    expect(skillVfxPower('skill.flame.lotus.v4', 1)).toBeGreaterThan(1.5);
    expect(skillVfxPower('skill.void.slash.awakened', 1)).toBe(1.95);
    expect(skillVfxPower('skill.flame.bolt', 4.5)).toBe(4.5);
  });
});
