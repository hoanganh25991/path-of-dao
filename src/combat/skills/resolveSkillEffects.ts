import type { SkillDefinition, SkillEffect } from '@/progression/SkillDefinition';

/** Resolve composable effects — explicit JSON array or legacy `kind` mapping. */
export function resolveSkillEffects(skill: SkillDefinition): SkillEffect[] {
  if (skill.effects && skill.effects.length > 0) {
    return skill.effects;
  }

  const overrides = skill.awakenedOverrides;

  switch (skill.kind) {
    case 'arc':
      return [
        {
          type: 'melee_arc',
          reach: 52,
          halfAngleDeg: overrides?.arcHalfAngle
            ? (overrides.arcHalfAngle * 180) / Math.PI
            : 60,
          reachBonus: overrides?.arcReachBonus ?? 0,
          damage: {
            skillMultiplier: skill.skillMultiplier,
            damageType: 'physical',
          },
        },
      ];
    case 'bolt':
      return [
        {
          type: 'projectile',
          speed: 420,
          rangePx: 400,
          hitRadius: 12,
          pullForce: overrides?.pullForce,
          damage: {
            skillMultiplier: skill.skillMultiplier,
            damageType: 'spirit',
          },
        },
      ];
    case 'heal':
      return [
        {
          type: 'heal',
          healPct: overrides?.healPct ?? 0.1,
        },
      ];
    default:
      return [];
  }
}
