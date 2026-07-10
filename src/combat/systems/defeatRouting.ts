/** Minimal shape a spawn manager needs to route a defeated cultivator (combat-defeat-canon.md §1). */
export interface DefeatRoutable {
  readonly isBeast: boolean;
  readonly isBoss: boolean;
}

/**
 * True when a defeated opponent should despawn/return to pool instead of sitting
 * in place to gather-qi recover.
 *
 * - Beasts (`opponentKind: 'beast'`) never recover — they despawn on every defeat.
 * - Bosses stay down for the session once defeated (ordeal cleared, no re-aggro).
 * - Everyone else (fodder/elite cultivators) recovers in place via `beginRecovery()`.
 */
export function shouldDespawnOnDefeat(cultivator: DefeatRoutable): boolean {
  return cultivator.isBeast || cultivator.isBoss;
}
