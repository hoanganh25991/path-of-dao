import Phaser from 'phaser';
import { arcContains, circlesOverlap } from '@/combat/combat/geometry';
import { resolveHit } from '@/combat/combat/CombatResolver';
import { Hitbox, type HitboxConfig, type HitboxShape } from '@/combat/combat/Hitbox';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import { updateHitFlashes } from '@/combat/combat/HitFlash';
import { DamageNumberPool } from '@/combat/vfx/DamageNumber';

const ARC_SAMPLE_COUNT = 3;
const HURTBOX_SAMPLE_RADIUS = 4;

/** Spawns, tracks, and resolves active hitboxes against registered hurtboxes. */
export class HitboxManager {
  private readonly hitboxes: Hitbox[] = [];
  private readonly targets: HurtboxEntity[] = [];
  readonly damageNumbers: DamageNumberPool;
  private debugGfx: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.damageNumbers = new DamageNumberPool(scene);
    if (import.meta.env.DEV) {
      this.debugGfx = scene.add.graphics().setDepth(100);
    }
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

    this.drawDebug();
  }

  destroy(): void {
    this.hitboxes.length = 0;
    this.targets.length = 0;
    this.damageNumbers.destroy();
    this.debugGfx?.destroy();
    this.debugGfx = null;
  }

  get activeHitboxCount(): number {
    return this.hitboxes.length;
  }

  private overlaps(hitbox: Hitbox, target: HurtboxEntity): boolean {
    const { shape } = hitbox;
    const tx = target.x;
    const ty = target.y;
    const tr = target.hurtRadius;

    switch (shape.kind) {
      case 'circle':
        return circlesOverlap(shape.x, shape.y, shape.radius, tx, ty, tr);
      case 'arc':
        if (arcContains(shape.x, shape.y, shape.radius, shape.startAngle, shape.endAngle, tx, ty)) {
          return true;
        }
        // Also sample hurtbox edge points for partial overlap.
        for (let i = 0; i < ARC_SAMPLE_COUNT; i++) {
          const a = shape.startAngle + ((shape.endAngle - shape.startAngle) * i) / (ARC_SAMPLE_COUNT - 1);
          const sx = tx + Math.cos(a) * tr;
          const sy = ty + Math.sin(a) * tr;
          if (arcContains(shape.x, shape.y, shape.radius, shape.startAngle, shape.endAngle, sx, sy)) {
            return true;
          }
        }
        return false;
      case 'rect': {
        const halfW = shape.width / 2;
        const halfH = shape.height / 2;
        const closestX = Phaser.Math.Clamp(tx, shape.x - halfW, shape.x + halfW);
        const closestY = Phaser.Math.Clamp(ty, shape.y - halfH, shape.y + halfH);
        return circlesOverlap(closestX, closestY, HURTBOX_SAMPLE_RADIUS, tx, ty, tr);
      }
    }
  }

  private drawDebug(): void {
    if (!this.debugGfx) return;
    this.debugGfx.clear();

    for (const hitbox of this.hitboxes) {
      const color = hitbox.team === 'player' ? 0x44ff88 : 0xff4444;
      const { shape } = hitbox;
      this.debugGfx.lineStyle(1, color, 0.85);

      if (shape.kind === 'circle') {
        this.debugGfx.strokeCircle(shape.x, shape.y, shape.radius);
      } else if (shape.kind === 'arc') {
        this.debugGfx.beginPath();
        this.debugGfx.arc(shape.x, shape.y, shape.radius, shape.startAngle, shape.endAngle, false);
        this.debugGfx.strokePath();
        this.debugGfx.lineBetween(shape.x, shape.y, shape.x + Math.cos(shape.startAngle) * shape.radius, shape.y + Math.sin(shape.startAngle) * shape.radius);
        this.debugGfx.lineBetween(shape.x, shape.y, shape.x + Math.cos(shape.endAngle) * shape.radius, shape.y + Math.sin(shape.endAngle) * shape.radius);
      } else {
        this.debugGfx.strokeRect(shape.x - shape.width / 2, shape.y - shape.height / 2, shape.width, shape.height);
      }
    }
  }
}
