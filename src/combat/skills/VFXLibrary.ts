import type Phaser from 'phaser';
import type { InsightIntentId, SkillDefinition } from '@/progression/SkillDefinition';
import { VFX_TEXTURE_KEYS, snapVfxPosition } from '@/combat/art/pixelVfxDraw';
import { getIntentVisual } from '@/ui/skills/SkillIcon';

const SLASH_OFFSET_PX = 26;
const SLASH_VISIBLE_MS = 100;
const SLASH_TEX_SIZE = 64;
const RING_TEX_SIZE = 32;
const AOE_FLAME_TEX = 48;
const VOID_CRACK_TEX = 48;

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

function expandRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  startScale: number,
  endScale: number,
  durationMs: number,
  depth = 20,
  alpha = 1,
): void {
  const ring = scene.add
    .image(Math.round(x), Math.round(y), VFX_TEXTURE_KEYS.ring)
    .setOrigin(0.5)
    .setScale(startScale)
    .setTint(tint)
    .setAlpha(alpha)
    .setDepth(depth);
  scene.tweens.add({
    targets: ring,
    scaleX: endScale,
    scaleY: endScale,
    alpha: 0,
    duration: durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}

function expandSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  texSize: number,
  displayRadius: number,
  tint: number,
  durationMs: number,
  depth = 20,
  startMul = 0.35,
  endMul = 0.9,
): void {
  const targetScale = (displayRadius * 2) / texSize;
  const img = scene.add
    .image(Math.round(x), Math.round(y), texture)
    .setOrigin(0.5)
    .setScale(targetScale * startMul)
    .setTint(tint)
    .setDepth(depth);
  scene.tweens.add({
    targets: img,
    scaleX: targetScale * endMul,
    scaleY: targetScale * endMul,
    alpha: 0,
    duration: durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => img.destroy(),
  });
}

/** Scatter pixel sparks from a point. */
export function spawnPixelSparks(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  count: number,
  spread = 36,
  depth = 22,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = spread * (0.4 + Math.random() * 0.6);
    const spark = scene.add
      .image(Math.round(x), Math.round(y), VFX_TEXTURE_KEYS.spark)
      .setOrigin(0.5)
      .setScale(1 + Math.random() * 0.5)
      .setTint(tint)
      .setDepth(depth);
    scene.tweens.add({
      targets: spark,
      x: Math.round(x + Math.cos(angle) * dist),
      y: Math.round(y + Math.sin(angle) * dist),
      alpha: 0,
      scale: 0.25,
      duration: 200 + Math.random() * 120,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}

/** Brief hit feedback sparks at contact point. */
export function playHitSparks(
  scene: Phaser.Scene,
  x: number,
  y: number,
  isCrit: boolean,
  intentTint = 0xffffff,
): void {
  spawnPixelSparks(scene, x, y, isCrit ? 0xffd54a : intentTint, isCrit ? 6 : 3, isCrit ? 28 : 18, 25);
}

/** Reusable cultivation VFX presets — hard-edged pixel sprites. */
export const VFXLibrary = {
  playCast(scene: Phaser.Scene, x: number, y: number, intent: InsightIntentId, amp = 1): void {
    const { glow } = getIntentVisual(intent);
    const tint = parseColor(glow);
    const end = (2.2 * amp * RING_TEX_SIZE) / RING_TEX_SIZE;
    expandRing(scene, x, y - 20, tint, 0.5 * amp, end, 220, 20, 0.85);
    spawnPixelSparks(scene, x, y - 20, tint, 4, 16 * amp, 21);
  },

  slashArc(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: number,
    reach: number,
    intent: InsightIntentId,
    amp = 1,
  ): void {
    const { glow } = getIntentVisual(intent);
    const scale = (reach / SLASH_TEX_SIZE) * 1.15 * amp;
    const slash = scene.add
      .image(Math.round(x + facing * SLASH_OFFSET_PX), Math.round(y), VFX_TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setOrigin(0.08, 0.5)
      .setScale(scale)
      .setDepth(21)
      .setTint(parseColor(glow));
    scene.time.delayedCall(SLASH_VISIBLE_MS * (amp > 1 ? 1.4 : 1), () => slash.destroy());
    spawnPixelSparks(
      scene,
      x + facing * (reach * 0.55),
      y,
      parseColor(glow),
      amp > 1 ? 5 : 3,
      14,
      22,
    );
  },

  spiritBolt(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: number,
    intent: InsightIntentId,
    amp = 1,
  ): Phaser.Physics.Arcade.Image {
    const { glow } = getIntentVisual(intent);
    const bolt = scene.physics.add
      .image(Math.round(x + facing * 20), Math.round(y), VFX_TEXTURE_KEYS.bolt)
      .setFlipX(facing < 0)
      .setOrigin(0.5)
      .setScale(amp > 1 ? 1.35 * amp : 1.1)
      .setTint(parseColor(glow))
      .setDepth(21);
    snapVfxPosition(bolt);
    return bolt;
  },

  healBloom(scene: Phaser.Scene, x: number, y: number, intent: InsightIntentId): void {
    const { glow } = getIntentVisual(intent);
    const tint = parseColor(glow);
    expandRing(scene, x, y - 20, tint, 0.6, 3.8, 400, 22, 0.9);
    spawnPixelSparks(scene, x, y - 28, tint, 6, 22, 23);
  },

  flamePetal(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene,
      x,
      y,
      VFX_TEXTURE_KEYS.aoeFlame,
      AOE_FLAME_TEX,
      radius,
      0xff8030,
      320,
      20,
    );
    spawnPixelSparks(scene, x, y, 0xffb040, 5, radius * 0.5, 21);
  },

  voidCrack(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene,
      x,
      y,
      VFX_TEXTURE_KEYS.voidCrack,
      VOID_CRACK_TEX,
      radius,
      0xc0a0ff,
      380,
      19,
      0.4,
      0.85,
    );
    spawnPixelSparks(scene, x, y, 0x9060ff, 4, radius * 0.35, 19);
  },
};

export function playSkillCastVfx(
  scene: Phaser.Scene,
  skill: SkillDefinition,
  x: number,
  y: number,
  amp = 1,
): void {
  VFXLibrary.playCast(scene, x, y, skill.intent, amp);
  if (skill.vfx?.cast === 'vfx_void_cast') {
    VFXLibrary.voidCrack(scene, x, y - 16, 48 * amp);
  }
}
