import { resolveDamage } from '@/progression/DamageCalculator';
import type { DamageResult } from '@/progression/types';
import type { Hitbox } from '@/combat/combat/Hitbox';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import { applyHitFlash } from '@/combat/combat/HitFlash';

export interface DamageNumberSpawner {
  spawn(value: number, isCrit: boolean, x: number, y: number): void;
}

export interface CombatResolverDeps {
  damageNumbers: DamageNumberSpawner;
  random?: () => number;
}

/**
 * Full hit pipeline: i-frame check, damage calc, VFX, pierce tracking.
 * Knockback is applied by the target in receiveHit using hitbox metadata.
 */
export function resolveHit(
  hitbox: Hitbox,
  target: HurtboxEntity,
  deps: CombatResolverDeps,
): DamageResult | null {
  if (hitbox.team === target.team) return null;
  if (target.invulnerable) return null;
  if (hitbox.alreadyHit.has(target.id)) return null;

  const { damage } = hitbox;
  const result = resolveDamage(
    {
      attacker: damage.attacker,
      defender: target.getDefenderStats(),
      skillMultiplier: damage.skillMultiplier,
      damageType: damage.damageType,
      ignoreDefPct: damage.ignoreDefPct,
      attackerRealmOrder: damage.attackerRealmOrder,
      defenderRecommendedRealmOrder: damage.defenderRecommendedRealmOrder,
    },
    deps.random ?? Math.random,
  );

  target.receiveHit(result, hitbox);
  hitbox.alreadyHit.add(target.id);
  hitbox.pierceRemaining--;

  applyHitFlash(target.sprite);
  deps.damageNumbers.spawn(result.final, result.isCrit, target.x, target.y - 12);

  return result;
}
