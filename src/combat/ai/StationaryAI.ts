import {
  distance,
  IDLE_DECISION,
  type AIDecider,
  type AIDecision,
  type AIEnemyState,
  type AIPlayerState,
} from '@/combat/ai/AITypes';

/** Never moves; fires its (AoE) attack whenever the player is in range. */
export class StationaryAI implements AIDecider {
  decide(enemy: AIEnemyState, player: AIPlayerState, _dtMs = 0): AIDecision {
    if (!player.alive) return IDLE_DECISION;

    const dist = distance(enemy.x, enemy.y, player.x, player.y);
    if (dist <= enemy.attackRange && enemy.cooldownReady) {
      return { vx: 0, vy: 0, attack: true };
    }
    return IDLE_DECISION;
  }
}
