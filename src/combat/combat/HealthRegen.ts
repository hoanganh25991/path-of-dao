/**
 * Passive HP recovery — cultivation qi mends the body when not fully exerted.
 *
 * ## Formula
 *
 * ```
 * baseRegenPerSec = (2 + level × 0.35) × (1 + (realmOrder − 1) × 0.25)
 * ```
 *
 * Examples (approx):
 * - L1 Mortal Body (order 1): ~1.2 HP/s while walking
 * - L10 Foundation (order 2): ~2.8 HP/s while walking
 * - L20 Core Formation (order 3): ~4.9 HP/s while walking
 *
 * ## State multipliers (× baseRegenPerSec)
 *
 * | State              | Multiplier | Notes                                      |
 * |--------------------|------------|--------------------------------------------|
 * | meditate / sit     | 6×         | Seated cultivation — fastest recovery      |
 * | walk / idle        | 0.5×       | Light passive regen while traveling        |
 * | combat / attack    | 0.3×       | Qi diverted to techniques; minimal recovery  |
 *
 * `finalRegenPerSec = baseRegenPerSec × stateMultiplier`
 *
 * Mana uses the same state multipliers, scaled by `manaMax / hpMax` so both pools
 * refill at a similar pace during Gather Qi.
 */

export type HealthRegenState = 'meditate' | 'walk' | 'combat';

/** Multipliers applied to {@link computeBaseRegenPerSec}. */
export const REGEN_STATE_MULTIPLIER: Record<HealthRegenState, number> = {
  meditate: 6,
  walk: 0.5,
  combat: 0.3,
};

export function computeBaseRegenPerSec(realmOrder: number, level: number): number {
  const realm = Math.max(1, realmOrder);
  const lvl = Math.max(1, level);
  const levelTerm = 2 + lvl * 0.35;
  const realmTerm = 1 + (realm - 1) * 0.25;
  return levelTerm * realmTerm;
}

export function computeHealthRegenPerSec(opts: {
  realmOrder: number;
  level: number;
  state: HealthRegenState;
}): number {
  const base = computeBaseRegenPerSec(opts.realmOrder, opts.level);
  return base * REGEN_STATE_MULTIPLIER[opts.state];
}

/** Mana regen mirrors HP regen, scaled to pool size. */
export function computeManaRegenPerSec(opts: {
  realmOrder: number;
  level: number;
  state: HealthRegenState;
  hpMax: number;
  manaMax: number;
}): number {
  if (opts.hpMax <= 0 || opts.manaMax <= 0) return 0;
  const hpRate = computeHealthRegenPerSec(opts);
  return hpRate * (opts.manaMax / opts.hpMax);
}

/** Map player state machine id to regen bucket. */
export function regenStateFromPlayerState(
  state: 'idle' | 'move' | 'attack' | 'dodge' | 'hitstun' | 'dead' | 'meditate',
): HealthRegenState | null {
  if (state === 'dead') return null;
  if (state === 'meditate') return 'meditate';
  if (state === 'attack') return 'combat';
  return 'walk';
}
