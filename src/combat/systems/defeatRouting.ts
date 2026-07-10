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
 * - Cultivators (fodder/elite) and bosses sit gather-qi via `beginRecovery()`.
 * - Bosses additionally stay down for the session (no re-aggro) — see `shouldStayDownOnDefeat`.
 */
export function shouldDespawnOnDefeat(cultivator: DefeatRoutable): boolean {
  return cultivator.isBeast;
}

/**
 * Boss cultivators sit gather-qi after defeat but never return to combat this visit.
 */
export function shouldStayDownOnDefeat(cultivator: DefeatRoutable): boolean {
  return cultivator.isBoss && !cultivator.isBeast;
}
