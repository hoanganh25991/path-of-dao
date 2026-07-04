/** Cultivation-driven AOE growth — skills and basic attacks widen as realm/level rise. */

const REALM_STEP = 0.38;
const LEVEL_STEP = 0.08;
const BASIC_ATTACK_REALM_BONUS = 0.35;

/** General skill / effect radius multiplier from cultivation progress. */
export function computeAoeScale(realmOrder: number, level: number): number {
  const realm = Math.max(1, realmOrder);
  const lvl = Math.max(1, level);
  const realmFactor = 1 + (realm - 1) * REALM_STEP;
  const levelFactor = 1 + Math.floor((lvl - 1) / 3) * LEVEL_STEP;
  return realmFactor * levelFactor;
}

/** Basic attack combo gets extra arc reach — power-fantasy wipe on return visits. */
export function computeBasicAttackAoeScale(realmOrder: number, level: number): number {
  const base = computeAoeScale(realmOrder, level);
  const realm = Math.max(1, realmOrder);
  return base * (1 + (realm - 1) * BASIC_ATTACK_REALM_BONUS);
}

/** Widen melee arc in radians from scale (caps to ~270°). */
export function scaledMeleeHalfArc(baseHalfArc: number, aoeScale: number): number {
  const widened = baseHalfArc * (0.8 + aoeScale * 0.45);
  return Math.min(Math.PI * 0.75, widened);
}
