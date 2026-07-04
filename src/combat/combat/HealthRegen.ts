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
 * - L1 Mortal Body (order 1): ~2.4 HP/s at walk baseline
 * - L10 Foundation (order 2): ~5.5 HP/s at walk baseline
 * - L20 Core Formation (order 3): ~9.8 HP/s at walk baseline
 *
 * ## State multipliers (× baseRegenPerSec)
 *
 * | State              | Multiplier | Notes                                      |
 * |--------------------|------------|--------------------------------------------|
 * | meditate / sit     | 12×        | Seated cultivation — fastest recovery      |
 * | walk / idle        | 1×         | Moderate passive regen while traveling       |
 * | combat / attack    | 0.3×       | Qi diverted to techniques; minimal recovery  |
 *
 * `finalRegenPerSec = baseRegenPerSec × stateMultiplier`
 */

export type HealthRegenState = 'meditate' | 'walk' | 'combat';

/** Multipliers applied to {@link computeBaseRegenPerSec}. */
export const REGEN_STATE_MULTIPLIER: Record<HealthRegenState, number> = {
  meditate: 12,
  walk: 1,
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

/** Map player state machine id to regen bucket. */
export function regenStateFromPlayerState(
  state: 'idle' | 'move' | 'attack' | 'dodge' | 'hitstun' | 'dead' | 'meditate',
): HealthRegenState | null {
  if (state === 'dead') return null;
  if (state === 'meditate') return 'meditate';
  if (state === 'attack') return 'combat';
  return 'walk';
}
