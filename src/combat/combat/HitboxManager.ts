import Phaser from 'phaser';
import { arcOverlapsCircle, circlesOverlap } from '@/combat/combat/geometry';
import { resolveHit } from '@/combat/combat/CombatResolver';
import { Hitbox, type HitboxConfig, type HitboxShape } from '@/combat/combat/Hitbox';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import { updateHitFlashes } from '@/combat/combat/HitFlash';
import { DamageNumberPool } from '@/combat/vfx/DamageNumber';

/** Spawns, tracks, and resolves active hitboxes against registered hurtboxes. */
export class HitboxManager {
  private readonly hitboxes: Hitbox[] = [];
  private readonly targets: HurtboxEntity[] = [];
  readonly damageNumbers: DamageNumberPool;

  constructor(scene: Phaser.Scene) {
    this.damageNumbers = new DamageNumberPool(scene);
  }

  spawn(config: HitboxConfig): Hitbox {
    const hitbox = new Hitbox(config);
    this.hitboxes.push(hitbox);
    return hitbox;
  }

  getHitbox(id: string): Hitbox | undefined {
    return this.hitboxes.find((h) => h.id === id);
  }

  setHitboxShape(id: string, shape: HitboxShape): void {
    const hitbox = this.getHitbox(id);
    if (hitbox) hitbox.shape = shape;
  }

  /** Replace the target list each frame (alive enemies + player). */
  setTargets(targets: HurtboxEntity[]): void {
    this.targets.length = 0;
    this.targets.push(...targets);
  }

  update(dtMs: number): void {
    updateHitFlashes(dtMs);

    for (const hitbox of this.hitboxes) {
      hitbox.elapsedMs += dtMs;
      if (hitbox.expired) continue;

      for (const target of this.targets) {
        if (hitbox.expired) break;
        if (!this.overlaps(hitbox, target)) continue;
        resolveHit(hitbox, target, { damageNumbers: this.damageNumbers });
      }
    }

    for (let i = this.hitboxes.length - 1; i >= 0; i--) {
      if (this.hitboxes[i]?.expired) {
        this.hitboxes.splice(i, 1);
      }
    }
  }

  destroy(): void {
    this.hitboxes.length = 0;
    this.targets.length = 0;
    this.damageNumbers.destroy();
  }

  get activeHitboxCount(): number {
    return this.hitboxes.length;
  }

  private overlaps(hitbox: Hitbox, target: HurtboxEntity): boolean {
    const { shape } = hitbox;
    const tx = target.x;
    const ty = target.hurtCenterY;
    const tr = target.hurtRadius;

    switch (shape.kind) {
      case 'circle':
        return circlesOverlap(shape.x, shape.y, shape.radius, tx, ty, tr);
      case 'arc':
        return arcOverlapsCircle(
          shape.x,
          shape.y,
          shape.radius,
          shape.startAngle,
          shape.endAngle,
          tx,
          ty,
          tr,
        );
      case 'rect': {
        const halfW = shape.width / 2;
        const halfH = shape.height / 2;
        const closestX = Phaser.Math.Clamp(tx, shape.x - halfW, shape.x + halfW);
        const closestY = Phaser.Math.Clamp(ty, shape.y - halfH, shape.y + halfH);
        return circlesOverlap(closestX, closestY, 4, tx, ty, tr);
      }
    }
  }
}
