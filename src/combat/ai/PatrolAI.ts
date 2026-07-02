import {
  distance,
  velocityToward,
  type AIDecider,
  type AIDecision,
  type AIEnemyState,
  type AIPlayerState,
} from '@/combat/ai/AITypes';
import { MeleeChaserAI } from '@/combat/ai/MeleeChaserAI';

const WAYPOINT_REACHED_PX = 6;

/** Loop waypoints (offsets from spawn) until the player enters aggro range. */
export class PatrolAI implements AIDecider {
  private readonly chase = new MeleeChaserAI();
  private waypointIndex = 0;

  constructor(
    private readonly waypointOffsets: ReadonlyArray<{ x: number; y: number }> = [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
    ],
  ) {}

  decide(enemy: AIEnemyState, player: AIPlayerState, dtMs: number): AIDecision {
    const aggroed =
      player.alive && distance(enemy.x, enemy.y, player.x, player.y) <= enemy.aggroRange;
    if (aggroed) {
      return this.chase.decide(enemy, player, dtMs);
    }

    const offset = this.waypointOffsets[this.waypointIndex] ?? { x: 0, y: 0 };
    const targetX = enemy.spawnX + offset.x;
    const targetY = enemy.spawnY + offset.y;

    if (distance(enemy.x, enemy.y, targetX, targetY) <= WAYPOINT_REACHED_PX) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypointOffsets.length;
      return { vx: 0, vy: 0, attack: false };
    }

    const v = velocityToward(enemy.x, enemy.y, targetX, targetY, enemy.speedPxPerSec * 0.6);
    return { ...v, attack: false };
  }
}
