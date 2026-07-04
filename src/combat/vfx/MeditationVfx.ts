import type Phaser from 'phaser';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';

const WISP_SPAWN_MS = 200;
const WISP_TRAVEL_MS = 520;
const WISP_COUNT_CAP = 6;
const SPIRIT_TINT = 0x80ffb0;
const AURA_TINT = 0x60c888;

interface Wisp {
  sprite: Phaser.GameObjects.Image;
  bornMs: number;
}

/** Subtle spirit wisps flowing inward while meditating — mobile-friendly budget. */
export class MeditationVfx {
  private readonly wisps: Wisp[] = [];
  private spawnAccumulatorMs = 0;
  private aura: Phaser.GameObjects.Image | null = null;
  private active = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  start(x: number, y: number): void {
    if (this.active) return;
    this.active = true;
    this.spawnAccumulatorMs = 0;

    this.aura = this.scene.add
      .image(Math.round(x), Math.round(y - 18), VFX_TEXTURE_KEYS.ring)
      .setOrigin(0.5)
      .setScale(0.55)
      .setTint(AURA_TINT)
      .setAlpha(0.28)
      .setDepth(this.depth - 1);

    this.scene.tweens.add({
      targets: this.aura,
      scaleX: 0.72,
      scaleY: 0.72,
      alpha: 0.42,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stop(): void {
    this.active = false;
    this.aura?.destroy();
    this.aura = null;
    for (const wisp of this.wisps) wisp.sprite.destroy();
    this.wisps.length = 0;
    this.spawnAccumulatorMs = 0;
  }

  update(dtMs: number, x: number, y: number): void {
    if (!this.active) return;

    this.aura?.setPosition(Math.round(x), Math.round(y - 18));

    this.spawnAccumulatorMs += dtMs;
    while (this.spawnAccumulatorMs >= WISP_SPAWN_MS && this.wisps.length < WISP_COUNT_CAP) {
      this.spawnAccumulatorMs -= WISP_SPAWN_MS;
      this.spawnWisp(x, y);
    }

    const targetY = y - 14;
    const alive: Wisp[] = [];
    for (const wisp of this.wisps) {
      wisp.bornMs += dtMs;
      const t = Math.min(1, wisp.bornMs / WISP_TRAVEL_MS);
      const start = wisp.sprite.getData('start') as { x: number; y: number };
      wisp.sprite.setPosition(
        Math.round(start.x + (x - start.x) * t),
        Math.round(start.y + (targetY - start.y) * t),
      );
      wisp.sprite.setAlpha(0.85 * (1 - t * 0.9));
      wisp.sprite.setScale(0.7 + t * 0.35);
      if (t < 1) alive.push(wisp);
      else wisp.sprite.destroy();
    }
    this.wisps.length = 0;
    this.wisps.push(...alive);
  }

  destroy(): void {
    this.stop();
  }

  private spawnWisp(x: number, y: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 28 + Math.random() * 22;
    const sx = x + Math.cos(angle) * dist;
    const sy = y - 10 + Math.sin(angle) * dist * 0.6;

    const sprite = this.scene.add
      .image(Math.round(sx), Math.round(sy), VFX_TEXTURE_KEYS.spark)
      .setOrigin(0.5)
      .setScale(0.65)
      .setTint(SPIRIT_TINT)
      .setAlpha(0.8)
      .setDepth(this.depth);

    sprite.setData('start', { x: sx, y: sy });
    this.wisps.push({ sprite, bornMs: 0 });
  }
}
