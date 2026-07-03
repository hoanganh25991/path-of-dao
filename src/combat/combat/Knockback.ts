export const KNOCKBACK_DURATION_MS = 150;

export interface KnockbackState {
  remainingMs: number;
  vx: number;
  vy: number;
}

/** Push target away from the hit origin. */
export function startKnockback(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  force: number,
): KnockbackState {
  const angle = Math.atan2(targetY - fromY, targetX - fromX);
  return {
    remainingMs: KNOCKBACK_DURATION_MS,
    vx: Math.cos(angle) * force,
    vy: Math.sin(angle) * force,
  };
}

export function tickKnockback(state: KnockbackState, dtMs: number): KnockbackState | null {
  const remainingMs = state.remainingMs - dtMs;
  if (remainingMs <= 0) return null;
  return { ...state, remainingMs };
}
