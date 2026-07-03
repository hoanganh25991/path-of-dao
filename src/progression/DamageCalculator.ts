import { computeOverlevelDamageMultiplier } from '@/progression/CombatPower';
import type { DamageInput, DamageResult } from '@/progression/types';

/**
 * Canonical hit resolution (master plan §7.1 companion):
 *
 *   base = atk * skillMultiplier            (spirit dmg: spirit * multiplier)
 *   defEffective = def * (1 - ignoreDefPct) (spirit dmg: def * 0.5)
 *   mitigation = defEffective / (defEffective + 100)
 *   raw = base * (1 - mitigation)
 *   crit → raw *= critDmg
 *   final = max(1, floor(raw))
 */
export function resolveDamage(input: DamageInput, random: () => number = Math.random): DamageResult {
  const { attacker, defender, skillMultiplier, damageType } = input;
  const ignoreDefPct = input.ignoreDefPct ?? 0;

  const base =
    damageType === 'spirit'
      ? attacker.spirit * skillMultiplier
      : attacker.atk * skillMultiplier;

  const defenderDef = damageType === 'spirit' ? defender.def * 0.5 : defender.def;
  const defEffective = defenderDef * (1 - ignoreDefPct);
  const mitigation = defEffective / (defEffective + 100);

  const raw = base * (1 - mitigation);
  const isCrit = random() < attacker.crit;
  let withCrit = isCrit ? raw * attacker.critDmg : raw;

  if (
    input.attackerRealmOrder != null &&
    input.defenderRecommendedRealmOrder != null
  ) {
    withCrit *= computeOverlevelDamageMultiplier(
      input.attackerRealmOrder,
      input.defenderRecommendedRealmOrder,
    );
  }

  const final = Math.max(1, Math.floor(withCrit));

  return {
    raw,
    final,
    isCrit,
    blocked: base - raw,
  };
}

/** Speed stat → movement pixels/sec (base 100 speed = 180 px/s). */
export function moveSpeedPxPerSec(speed: number): number {
  return 180 * (speed / 100);
}
