import type Phaser from 'phaser';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';

const WISP_SPAWN_MS = 120;
const WISP_TRAVEL_MS = 500;
const WISP_COUNT_CAP = 10;
const WISPS_PER_BURST = 2;
const SPIRIT_TINT = 0x80ffb0;

interface Wisp {
  sprite: Phaser.GameObjects.Image;
  bornMs: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

/** Fade in after leaving the outer edge so spawn points never read as a ring. */
function wispAlpha(t: number): number {
  if (t < 0.1) return 0;
  if (t < 0.28) return 0.85 * ((t - 0.1) / 0.18);
  if (t < 0.8) return 0.85;
  return 0.85 * (1 - (t - 0.8) / 0.2);
}

/** Subtle spirit wisps flowing inward while meditating — mobile-friendly budget. */
export class MeditationVfx {
  private readonly wisps: Wisp[] = [];
  private spawnAccumulatorMs = 0;
  private active = false;
  private spawnSector = Math.floor(Math.random() * 8);

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  start(_x: number, _y: number): void {
    if (this.active) return;
    this.active = true;
    this.spawnAccumulatorMs = 0;
    this.spawnSector = Math.floor(Math.random() * 8);
  }

  stop(): void {
    this.active = false;
    for (const wisp of this.wisps) wisp.sprite.destroy();
    this.wisps.length = 0;
    this.spawnAccumulatorMs = 0;
  }

  update(dtMs: number, x: number, y: number): void {
    if (!this.active) return;

    this.spawnAccumulatorMs += dtMs;
    while (this.spawnAccumulatorMs >= WISP_SPAWN_MS && this.wisps.length < WISP_COUNT_CAP) {
      this.spawnAccumulatorMs -= WISP_SPAWN_MS;
      const burst = Math.min(WISPS_PER_BURST, WISP_COUNT_CAP - this.wisps.length);
      for (let i = 0; i < burst; i++) this.spawnWisp(x, y);
    }

    const alive: Wisp[] = [];
    for (const wisp of this.wisps) {
      wisp.bornMs += dtMs;
      const t = Math.min(1, wisp.bornMs / WISP_TRAVEL_MS);
      const px = Math.round(wisp.startX + (wisp.targetX - wisp.startX) * t);
      const py = Math.round(wisp.startY + (wisp.targetY - wisp.startY) * t);
      wisp.sprite.setPosition(px, py);
      wisp.sprite.setAlpha(wispAlpha(t));
      wisp.sprite.setScale(0.5 + t * 0.35);
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
    // One compass sector per burst — avoids a full 360° ring of particles.
    const sector = this.spawnSector;
    this.spawnSector = (sector + 1 + Math.floor(Math.random() * 3)) % 8;
    const baseAngle = (sector / 8) * Math.PI * 2;
    const angle = baseAngle + (Math.random() - 0.5) * 0.7;
    const dist = 44 + Math.sqrt(Math.random()) * 42;
    const startX = x + Math.cos(angle) * dist;
    const startY = y - 14 + Math.sin(angle) * dist * 0.55;

    const targetX = x + (Math.random() - 0.5) * 10;
    const targetY = y - 20 - Math.random() * 10;

    const sprite = this.scene.add
      .image(Math.round(startX), Math.round(startY), VFX_TEXTURE_KEYS.qiStream)
      .setOrigin(0.5)
      .setScale(0.5 + Math.random() * 0.2)
      .setTint(SPIRIT_TINT)
      .setAlpha(0)
      .setRotation(Math.atan2(targetY - startY, targetX - startX))
      .setDepth(this.depth);

    this.wisps.push({ sprite, bornMs: 0, startX, startY, targetX, targetY });
  }
}
