import type { SkillDefinition } from '@/progression/SkillDefinition';

export type CastBlockReason = 'action' | 'cooldown' | 'mana';

export function getCastBlockReason(
  skill: SkillDefinition,
  canAct: boolean,
  mana: number,
  cooldownRemainingMs: number,
): CastBlockReason | null {
  if (!canAct) return 'action';
  if (cooldownRemainingMs > 0) return 'cooldown';
  if (mana < skill.manaCost) return 'mana';
  return null;
}

export function canAffordCast(
  skill: SkillDefinition,
  canAct: boolean,
  mana: number,
  cooldownRemainingMs: number,
): boolean {
  return getCastBlockReason(skill, canAct, mana, cooldownRemainingMs) === null;
}
