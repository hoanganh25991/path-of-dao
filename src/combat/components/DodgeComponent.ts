import { EventBus } from '@/core/EventBus';
import { DODGE_SPEED_PX_PER_SEC } from '@/combat/state/PlayerStateMachine';
import type { MoveVector } from '@/combat/components/MovementComponent';
import type { Player } from '@/combat/entities/Player';

const AFTERIMAGE_INTERVAL_MS = 50;
const AFTERIMAGE_FADE_MS = 150;
const DODGE_ALPHA = 0.6;

/** Dodge roll: fixed-direction burst, i-frames, alpha + afterimage trail. */
export class DodgeComponent {
  private direction: MoveVector = { x: 1, y: 0 };
  private afterimageAccumulatorMs = 0;
  private wasDodging = false;

  constructor(private readonly player: Player) {}

  /** Roll along the move vector, or facing when the stick is neutral. */
  tryStart(move: MoveVector): boolean {
    if (!this.player.sm.tryDodge()) return false;

    const length = Math.hypot(move.x, move.y);
    this.direction =
      length > 0.1
        ? { x: move.x / length, y: move.y / length }
        : { x: this.player.facing, y: 0 };

    this.afterimageAccumulatorMs = 0;
    this.player.sprite.setAlpha(DODGE_ALPHA);
    EventBus.emit('player:dodge-started', undefined);
    return true;
  }

  update(dtMs: number): void {
    const dodging = this.player.sm.state === 'dodge';

    if (dodging) {
      this.player.body.setVelocity(
        this.direction.x * DODGE_SPEED_PX_PER_SEC,
        this.direction.y * DODGE_SPEED_PX_PER_SEC,
      );

      this.afterimageAccumulatorMs += dtMs;
      while (this.afterimageAccumulatorMs >= AFTERIMAGE_INTERVAL_MS) {
        this.afterimageAccumulatorMs -= AFTERIMAGE_INTERVAL_MS;
        this.spawnAfterimage();
      }
    } else if (this.wasDodging) {
      this.player.sprite.setAlpha(1);
    }

    this.wasDodging = dodging;
  }

  private spawnAfterimage(): void {
    const { sprite, scene } = this.player;
    const ghost = scene.add
      .image(sprite.x, sprite.y, sprite.texture.key)
      .setOrigin(sprite.originX, sprite.originY)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setFlipX(sprite.flipX)
      .setAlpha(0.35)
      .setDepth(sprite.depth - 1);

    scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: AFTERIMAGE_FADE_MS,
      onComplete: () => ghost.destroy(),
    });
  }
}
