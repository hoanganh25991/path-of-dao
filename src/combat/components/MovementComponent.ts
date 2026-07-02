import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import type { Player } from '@/combat/entities/Player';

export interface MoveVector {
  x: number;
  y: number;
}

/** Clamp diagonal input so magnitude never exceeds 1 (sub-plan 07 §4). */
export function normalizeMove(move: MoveVector): MoveVector {
  const length = Math.hypot(move.x, move.y);
  if (length <= 1) return { x: move.x, y: move.y };
  return { x: move.x / length, y: move.y / length };
}

/** Applies input velocity + facing while the state machine allows movement. */
export class MovementComponent {
  constructor(private readonly player: Player) {}

  update(move: MoveVector): void {
    const { sm, body, sprite } = this.player;

    if (sm.state === 'dodge') return; // DodgeComponent owns velocity

    if (!sm.canAct) {
      body.setVelocity(0, 0);
      return;
    }

    const speed = moveSpeedPxPerSec(this.player.stats.resolved.speed);
    body.setVelocity(move.x * speed, move.y * speed);

    if (Math.abs(move.x) > 0.1) {
      this.player.facing = move.x > 0 ? 1 : -1;
      sprite.setFlipX(this.player.facing < 0);
    }
  }
}
