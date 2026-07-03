import { describe, expect, it } from 'vitest';
import { getSkillCooldownMs, tickCooldowns, createEmptyCooldowns } from '@/progression/SkillCooldown';
import { getSkillDefinition } from '@/progression/SkillLoader';

describe('SkillCooldown', () => {
  it('returns kind-based cooldown defaults', () => {
    const bolt = getSkillDefinition('skill.flame.bolt');
    const mend = getSkillDefinition('skill.life.mend');
    expect(getSkillCooldownMs(bolt)).toBeGreaterThan(0);
    expect(getSkillCooldownMs(mend)).toBeGreaterThan(getSkillCooldownMs(bolt));
  });

  it('ticks cooldowns down to zero', () => {
    const cds = createEmptyCooldowns();
    cds.primary = 500;
    tickCooldowns(cds, 200);
    expect(cds.primary).toBe(300);
    tickCooldowns(cds, 400);
    expect(cds.primary).toBe(0);
  });

  it('god mode reduces cooldown', () => {
    const skill = getSkillDefinition('skill.void.slash');
    const normal = getSkillCooldownMs(skill, false);
    const god = getSkillCooldownMs(skill, true);
    expect(god).toBeLessThan(normal);
  });
});
