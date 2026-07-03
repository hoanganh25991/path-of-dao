import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { resolveDamage } from '@/progression/DamageCalculator';
import { checkAwakeningReady, recordSkillHitInsight } from '@/progression/InsightSystem';
import type { DamageResult } from '@/progression/types';
import type { StatSheet } from '@/progression/StatSheet';
import type { Hitbox } from '@/combat/combat/Hitbox';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import { applyHitFlash } from '@/combat/combat/HitFlash';

function targetIsDead(target: HurtboxEntity): boolean {
  if (!('stats' in target)) return false;
  return (target as HurtboxEntity & { stats: StatSheet }).stats.isDead;
}

export interface DamageNumberSpawner {
  spawn(value: number, isCrit: boolean, x: number, y: number): void;
}

export interface CombatResolverDeps {
  damageNumbers: DamageNumberSpawner;
  random?: () => number;
}

function applyInsightHitRewards(hitbox: Hitbox, target: HurtboxEntity, result: DamageResult): void {
  if (!hitbox.insightIntent || target.team !== 'enemy') return;

  const save = gameStore.getState().save;
  if (!save) return;

  const { patch, emitReady } = recordSkillHitInsight(save, hitbox.insightIntent, {
    isCrit: result.isCrit,
    isBoss: target.isBoss ?? false,
    isKill: targetIsDead(target),
  });

  if (Object.keys(patch).length > 0) {
    gameStore.getState().patch(patch);
    const nextSave = gameStore.getState().save;
    if (emitReady && nextSave && checkAwakeningReady(nextSave, hitbox.insightIntent)) {
      EventBus.emit('insight:ready-to-awaken', { intentId: hitbox.insightIntent });
    }
  }
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
  applyInsightHitRewards(hitbox, target, result);

  return result;
}
