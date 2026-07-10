import { describe, expect, it } from 'vitest';
import { canAffordCast, getCastBlockReason } from '@/combat/skills/castGuards';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import { getSkillDefinition } from '@/progression/SkillLoader';
import { grantInsightXp } from '@/progression/InsightSystem';
import { SaveManager } from '@/core/save/SaveManager';

describe('castGuards', () => {
  const skill = getSkillDefinition('skill.void.slash');

  it('blocks when on cooldown', () => {
    expect(getCastBlockReason(skill, true, 100, 500)).toBe('cooldown');
    expect(canAffordCast(skill, true, 100, 500)).toBe(false);
  });

  it('blocks when insufficient mana', () => {
    expect(getCastBlockReason(skill, true, 5, 0)).toBe('mana');
  });

  it('allows cast when ready', () => {
    expect(canAffordCast(skill, true, skill.manaCost, 0)).toBe(true);
  });
});

describe('resolveSkillEffects', () => {
  it('maps legacy arc kind to melee_arc', () => {
    const skill = getSkillDefinition('skill.sword.slash');
    const effects = resolveSkillEffects(skill);
    expect(effects).toHaveLength(1);
    expect(effects[0]?.type).toBe('melee_arc');
  });

  it('awakened void uses explicit pull_field + projectile', () => {
    const skill = getSkillDefinition('skill.void.slash.awakened');
    const effects = resolveSkillEffects(skill);
    expect(effects.map((e) => e.type)).toEqual(['pull_field', 'projectile']);
  });

  it('awakened flame uses twin aoe_circle ticks', () => {
    const skill = getSkillDefinition('skill.flame.bolt.awakened');
    const aoe = resolveSkillEffects(skill)[0];
    expect(aoe?.type).toBe('aoe_circle');
    if (aoe?.type === 'aoe_circle') {
      expect(aoe.ticks).toBe(2);
    }
  });

  it('heavenly thunder strike uses vertical thunder_strike effect', () => {
    const skill = getSkillDefinition('skill.lightning.strike');
    const effects = resolveSkillEffects(skill);
    expect(effects).toHaveLength(1);
    expect(effects[0]?.type).toBe('thunder_strike');
  });

  it('awakened thunder chain uses thunder_chain effect', () => {
    const skill = getSkillDefinition('skill.lightning.strike.awakened');
    const effects = resolveSkillEffects(skill);
    expect(effects).toHaveLength(1);
    expect(effects[0]?.type).toBe('thunder_chain');
    if (effects[0]?.type === 'thunder_chain') {
      expect(effects[0].maxJumps).toBe(4);
    }
  });
});

describe('insight on skill use', () => {
  it('accumulates XP via record path used by CombatComponent', () => {
    const save = SaveManager.createNew();
    const { insights } = grantInsightXp(save, 'life_death', 'skillUse');
    expect(insights.life_death?.xp).toBeGreaterThan(0);
  });
});
