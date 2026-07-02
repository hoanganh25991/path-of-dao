import {
  distance,
  returnToSpawn,
  velocityToward,
  type AIDecider,
  type AIDecision,
  type AIEnemyState,
  type AIPlayerState,
} from '@/combat/ai/AITypes';

/** Chase the player when aggroed; attack in melee range; else walk home. */
export class MeleeChaserAI implements AIDecider {
  decide(enemy: AIEnemyState, player: AIPlayerState, _dtMs = 0): AIDecision {
    if (!player.alive) return returnToSpawn(enemy);

    const dist = distance(enemy.x, enemy.y, player.x, player.y);
    if (dist > enemy.aggroRange) return returnToSpawn(enemy);

    if (dist <= enemy.attackRange) {
      return { vx: 0, vy: 0, attack: enemy.cooldownReady };
    }

    const v = velocityToward(enemy.x, enemy.y, player.x, player.y, enemy.speedPxPerSec);
    return { ...v, attack: false };
  }
}
