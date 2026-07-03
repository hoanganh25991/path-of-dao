import { describe, expect, it } from 'vitest';
import { buildSkillDisplayStats } from '@/ui/skills/SkillCombatStats';

describe('SkillCombatStats', () => {
  it('builds arc stats for base sword slash', () => {
    const stats = buildSkillDisplayStats('skill.sword.slash');
    expect(stats.kind).toBe('arc');
    expect(stats.tier).toBe('base');
    expect(stats.damageText).toBe('×1.6');
    expect(stats.manaCost).toBe(20);
    expect(stats.aoeText).toBe('120°');
    expect(stats.rangeText).toBe('52px');
  });

  it('builds wider arc for awakened sword', () => {
    const stats = buildSkillDisplayStats('skill.sword.slash.awakened');
    expect(stats.tier).toBe('awakened');
    expect(stats.aoeText).toBe('180°');
    expect(stats.rangeText).toBe('76px');
    expect(stats.difficultyStars).toBe(4);
  });

  it('builds heal stats as percent HP', () => {
    const stats = buildSkillDisplayStats('skill.life.mend.awakened');
    expect(stats.kind).toBe('heal');
    expect(stats.damageText).toBe('15% HP');
    expect(stats.aoeText).toBe('Self');
  });

  it('builds bolt range for void fracture', () => {
    const stats = buildSkillDisplayStats('skill.void.slash.awakened');
    expect(stats.kind).toBe('bolt');
    expect(stats.rangeText).toBe('400px');
    expect(stats.aoeText).toContain('pull');
  });
});
