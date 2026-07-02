import {
  distance,
  returnToSpawn,
  velocityToward,
  type AIDecider,
  type AIDecision,
  type AIEnemyState,
  type AIPlayerState,
} from '@/combat/ai/AITypes';

/** Preferred band: [attackRange - KITE_BAND_PX, attackRange]. */
export const KITE_BAND_PX = 60;

/** Keep distance: flee when too close, shoot in band, approach when far. */
export class RangedKiterAI implements AIDecider {
  decide(enemy: AIEnemyState, player: AIPlayerState, _dtMs = 0): AIDecision {
    if (!player.alive) return returnToSpawn(enemy);

    const dist = distance(enemy.x, enemy.y, player.x, player.y);
    if (dist > enemy.aggroRange) return returnToSpawn(enemy);

    const minRange = Math.max(40, enemy.attackRange - KITE_BAND_PX);

    if (dist < minRange) {
      // flee directly away from the player
      const v = velocityToward(player.x, player.y, enemy.x, enemy.y, enemy.speedPxPerSec);
      return { vx: v.vx, vy: v.vy, attack: false };
    }

    if (dist <= enemy.attackRange) {
      return { vx: 0, vy: 0, attack: enemy.cooldownReady };
    }

    const v = velocityToward(enemy.x, enemy.y, player.x, player.y, enemy.speedPxPerSec);
    return { ...v, attack: false };
  }
}
