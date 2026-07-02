/**
 * Pure AI decision layer (sub-plan 08 §6) — no Phaser imports so archetype
 * behavior is unit-testable. AIBrain applies decisions to arcade bodies.
 */

export interface AIEnemyState {
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  speedPxPerSec: number;
  aggroRange: number;
  attackRange: number;
  /** True when the attack cooldown has elapsed. */
  cooldownReady: boolean;
}

export interface AIPlayerState {
  x: number;
  y: number;
  alive: boolean;
}

export interface AIDecision {
  vx: number;
  vy: number;
  /** Request an attack this frame (enemy handles telegraph/cooldown). */
  attack: boolean;
}

export interface AIDecider {
  decide(enemy: AIEnemyState, player: AIPlayerState, dtMs: number): AIDecision;
}

export const IDLE_DECISION: AIDecision = { vx: 0, vy: 0, attack: false };

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

/** Velocity of magnitude `speed` from (ax,ay) toward (bx,by). */
export function velocityToward(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  speed: number,
): { vx: number; vy: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1e-3) return { vx: 0, vy: 0 };
  return { vx: (dx / len) * speed, vy: (dy / len) * speed };
}

/** Walk back to spawn at half speed when out of combat. */
export function returnToSpawn(enemy: AIEnemyState): AIDecision {
  if (distance(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY) <= 8) {
    return IDLE_DECISION;
  }
  const v = velocityToward(
    enemy.x,
    enemy.y,
    enemy.spawnX,
    enemy.spawnY,
    enemy.speedPxPerSec * 0.5,
  );
  return { ...v, attack: false };
}
