import { describe, expect, it } from 'vitest';
import { circlesOverlap } from '@/combat/combat/geometry';
import { HURT_CENTER_Y_RATIO } from '@/combat/combat/Hurtbox';
import { resolveEffectiveSkillId } from '@/progression/SkillLoader';

const STICKY_DISPLAY_H = 112;

describe('projectile vs cultivator hurtbox', () => {
  it('misses feet anchor when bolt travels at chest height', () => {
    const feetY = 300;
    const boltY = feetY - STICKY_DISPLAY_H * 0.55;
    const hitRadius = 12;

    expect(circlesOverlap(200, boltY, hitRadius, 220, feetY, 7.2)).toBe(false);
  });

  it('hits torso hurt center when bolt reaches cultivator x', () => {
    const feetY = 300;
    const torsoY = feetY - STICKY_DISPLAY_H * HURT_CENTER_Y_RATIO;
    const boltY = feetY - STICKY_DISPLAY_H * 0.55;
    const hitRadius = 12;
    const targetX = 220;

    expect(circlesOverlap(targetX, boltY, hitRadius, targetX, torsoY, 7.2)).toBe(true);
  });
});

describe('resolveEffectiveSkillId', () => {
  it('keeps flame v1 variant when intent is awakened', () => {
    const id = resolveEffectiveSkillId('skill.flame.scorch.v1', { flame: { awakened: true } });
    expect(id).toBe('skill.flame.scorch.v1');
  });

  it('upgrades only the base flame art to awakened', () => {
    const id = resolveEffectiveSkillId('skill.flame.bolt', { flame: { awakened: true } });
    expect(id).toBe('skill.flame.bolt.awakened');
  });
});
