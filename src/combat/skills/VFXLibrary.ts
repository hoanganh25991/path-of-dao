import type Phaser from 'phaser';
import type { InsightIntentId, SkillDefinition } from '@/progression/SkillDefinition';
import { VFX_TEXTURE_KEYS, snapVfxPosition } from '@/combat/art/pixelVfxDraw';
import { skillVfxPower } from '@/combat/skills/skillVfxPower';
import { getIntentVisual } from '@/ui/skills/SkillIcon';

const SLASH_OFFSET_PX = 26;
const SLASH_VISIBLE_MS = 100;
const SLASH_TEX_SIZE = 64;
const RING_TEX_SIZE = 32;
const AOE_FLAME_TEX = 48;
const VOID_CRACK_TEX = 48;
const LIGHTNING_BOLT_TEX = 32;
const TIME_RIPPLE_TEX = 40;
const LIFE_BLOOM_TEX = 40;
const ICE_SPIKE_TEX = 36;

function projectileTexture(intent: InsightIntentId): string {
  switch (intent) {
    case 'flame':
      return VFX_TEXTURE_KEYS.flameOrb;
    case 'lightning':
      return VFX_TEXTURE_KEYS.lightningBolt;
    case 'void':
      return VFX_TEXTURE_KEYS.voidShard;
    case 'time':
      return VFX_TEXTURE_KEYS.timeOrb;
    case 'sword':
      return VFX_TEXTURE_KEYS.arrow;
    default:
      return VFX_TEXTURE_KEYS.bolt;
  }
}

function projectileScale(intent: InsightIntentId, power: number): number {
  const base = intent === 'lightning' ? 1.25 : intent === 'flame' ? 1.15 : intent === 'void' ? 1.2 : 1.05;
  return base * (0.9 + power * 0.12);
}

/** Brief impact burst when a skill projectile connects. */
export function playSkillImpactVfx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intent: InsightIntentId,
  power: number,
): void {
  const { glow, color } = getIntentVisual(intent);
  const tint = parseColor(glow);
  const core = parseColor(color);
  const radius = 28 + power * 10;

  switch (intent) {
    case 'void':
      VFXLibrary.voidCrack(scene, x, y, radius);
      break;
    case 'flame':
      VFXLibrary.flamePetal(scene, x, y, radius * 0.85);
      break;
    case 'lightning':
      VFXLibrary.lightningBolt(scene, x, y, radius);
      scene.cameras.main.shake(60, 0.004 + power * 0.001);
      break;
    case 'time':
      VFXLibrary.timeRipple(scene, x, y, radius);
      break;
    case 'life':
      VFXLibrary.lifeBloom(scene, x, y, radius * 0.9);
      break;
    default:
      expandRing(scene, x, y, tint, 0.4, 2.2 + power * 0.35, 200, 22, 0.85);
  }

  spawnPixelSparks(scene, x, y, tint, Math.floor(3 + power * 1.5), 12 + power * 4, 24);
  spawnPixelSparks(scene, x, y, core, Math.floor(2 + power), 8 + power * 3, 23);
}

/** Traveling trail behind elemental projectiles. */
export function spawnProjectileTrail(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intent: InsightIntentId,
  power: number,
): void {
  const { glow } = getIntentVisual(intent);
  const tint = parseColor(glow);

  switch (intent) {
    case 'flame':
      spawnPixelSparks(scene, x, y, 0xff6020, 1 + Math.floor(power * 0.4), 6, 19);
      spawnPixelSparks(scene, x, y - 2, tint, 1, 4, 18);
      break;
    case 'lightning':
      spawnPixelSparks(scene, x, y, 0xffe040, 2, 10 + power * 2, 20);
      break;
    case 'void':
      spawnPixelSparks(scene, x, y, tint, 1, 5, 18);
      break;
    case 'time':
      expandRing(scene, x, y, tint, 0.15, 0.55 + power * 0.08, 120, 17, 0.35);
      break;
    default:
      spawnPixelSparks(scene, x, y, tint, 1, 5, 18);
  }
}

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
    power = 1,
  ): void {
    const { glow } = getIntentVisual(intent);
    const tint = parseColor(glow);
    const scale = (reach / SLASH_TEX_SIZE) * 1.15 * (0.95 + power * 0.1);
    const cx = x + facing * SLASH_OFFSET_PX;
    const cy = y;
    const slash = scene.add
      .image(Math.round(cx), Math.round(cy), VFX_TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setOrigin(0.08, 0.5)
      .setScale(scale)
      .setDepth(21)
      .setTint(tint);
    scene.time.delayedCall(SLASH_VISIBLE_MS * (power > 1.5 ? 1.4 : 1), () => slash.destroy());

    const hitX = x + facing * (reach * 0.55);
    spawnPixelSparks(scene, hitX, cy, tint, Math.floor(2 + power * 1.2), 12 + power * 3, 22);

    switch (intent) {
      case 'void':
        VFXLibrary.voidCrack(scene, hitX, cy, 36 + power * 14);
        break;
      case 'sword':
        expandRing(scene, hitX, cy, tint, 0.35, 1.8 + power * 0.4, 160, 20, 0.75);
        break;
      case 'flame':
        VFXLibrary.flamePetal(scene, hitX, cy, 28 + power * 10);
        break;
      default:
        expandRing(scene, hitX, cy, tint, 0.3, 1.4 + power * 0.25, 140, 20, 0.6);
    }
  },

  intentProjectile(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: number,
    intent: InsightIntentId,
    power = 1,
  ): Phaser.Physics.Arcade.Image {
    const { glow } = getIntentVisual(intent);
    const texture = projectileTexture(intent);
    const scale = projectileScale(intent, power);
    const originY = intent === 'lightning' ? 0.85 : 0.5;
    const bolt = scene.physics.add
      .image(Math.round(x + facing * 20), Math.round(y), texture)
      .setFlipX(facing < 0)
      .setOrigin(0.5, originY)
      .setScale(scale)
      .setTint(parseColor(glow))
      .setDepth(21);
    if (intent === 'lightning') {
      bolt.setRotation(facing < 0 ? 0.15 : -0.15);
    }
    snapVfxPosition(bolt);
    return bolt;
  },

  /** @deprecated Use intentProjectile — kept for tests. */
  spiritBolt(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: number,
    intent: InsightIntentId,
    amp = 1,
  ): Phaser.Physics.Arcade.Image {
    return VFXLibrary.intentProjectile(scene, x, y, facing, intent, amp);
  },

  healBloom(scene: Phaser.Scene, x: number, y: number, intent: InsightIntentId, power = 1): void {
    const { glow } = getIntentVisual(intent);
    const tint = parseColor(glow);
    const radius = 38 + power * 12;
    VFXLibrary.lifeBloom(scene, x, y - 8, radius);
    expandRing(scene, x, y - 20, tint, 0.5 + power * 0.05, 2.8 + power * 0.5, 360 + power * 40, 22, 0.9);
    spawnPixelSparks(scene, x, y - 28, tint, Math.floor(4 + power * 2), 16 + power * 5, 23);
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

  lightningBolt(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene, x, y,
      VFX_TEXTURE_KEYS.lightningBolt, LIGHTNING_BOLT_TEX,
      radius, 0xffe080, 280, 21, 0.5, 1.0,
    );
    spawnPixelSparks(scene, x, y, 0xffe040, 5, radius * 0.6, 22);
  },

  timeRipple(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene, x, y,
      VFX_TEXTURE_KEYS.timeRipple, TIME_RIPPLE_TEX,
      radius, 0x90d8ff, 400, 20, 0.6, 1.1,
    );
    spawnPixelSparks(scene, x, y, 0x70c0e0, 4, radius * 0.4, 21);
  },

  lifeBloom(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene, x, y,
      VFX_TEXTURE_KEYS.lifeBloom, LIFE_BLOOM_TEX,
      radius, 0x80ffb0, 360, 22, 0.5, 1.0,
    );
    spawnPixelSparks(scene, x, y, 0x60e890, 6, radius * 0.45, 23);
  },

  iceSpike(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    expandSprite(
      scene, x, y,
      VFX_TEXTURE_KEYS.iceSpike, ICE_SPIKE_TEX,
      radius, 0xc0e8ff, 340, 19, 0.5, 0.95,
    );
    spawnPixelSparks(scene, x, y, 0x90c8e0, 4, radius * 0.4, 20);
  },
};

export function playSkillCastVfx(
  scene: Phaser.Scene,
  skill: SkillDefinition,
  x: number,
  y: number,
  godAmp = 1,
): void {
  const power = skillVfxPower(skill.id, godAmp);
  VFXLibrary.playCast(scene, x, y, skill.intent, power);

  const castRadius = 40 + power * 12;
  switch (skill.vfx?.cast) {
    case 'vfx_void_cast':
      VFXLibrary.voidCrack(scene, x, y - 16, castRadius);
      break;
    case 'vfx_lightning_cast':
      VFXLibrary.lightningBolt(scene, x, y - 12, castRadius);
      break;
    case 'vfx_time_cast':
      VFXLibrary.timeRipple(scene, x, y - 12, castRadius + 4);
      break;
    case 'vfx_life_cast':
      VFXLibrary.lifeBloom(scene, x, y - 14, castRadius + 2);
      break;
    case 'vfx_sword_cast':
      expandRing(scene, x, y - 14, parseColor(getIntentVisual('sword').glow), 0.4, 2 + power * 0.35, 200, 20, 0.8);
      break;
    case 'vfx_ice_cast':
      VFXLibrary.iceSpike(scene, x, y - 12, castRadius - 2);
      break;
    case 'vfx_flame_cast':
      VFXLibrary.flamePetal(scene, x, y - 14, castRadius + 6);
      break;
  }

  if (power >= 2) {
    scene.cameras.main.shake(90, 0.003 + power * 0.0015);
  }
}

/** Heavenly thunder — vertical bolt from sky to ground (not a sideways projectile). */
export function playVerticalThunderStrike(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  fallHeight: number,
  power: number,
): void {
  const topY = groundY - fallHeight;
  const gfx = scene.add.graphics().setDepth(24);
  const width = 2 + Math.min(4, Math.floor(power));
  gfx.lineStyle(width, 0xfff0a0, 1);
  gfx.fillStyle(0xffffff, 0.9);

  let cx = Math.round(x);
  let cy = Math.round(topY);
  gfx.beginPath();
  gfx.moveTo(cx, cy);
  const segments = 5 + Math.floor(power * 1.2);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const ny = Math.round(topY + (groundY - topY) * t);
    const nx = Math.round(x + (Math.random() - 0.5) * 28 * (1 - t * 0.35));
    gfx.lineTo(nx, ny);
    cx = nx;
    cy = ny;
  }
  gfx.strokePath();
  gfx.fillCircle(cx, cy, 2 + Math.floor(power * 0.5));

  scene.tweens.add({
    targets: gfx,
    alpha: 0,
    duration: 160 + power * 20,
    ease: 'Quad.easeOut',
    onComplete: () => gfx.destroy(),
  });

  VFXLibrary.lightningBolt(scene, x, groundY, 30 + power * 10);
  spawnPixelSparks(scene, x, groundY, 0xffe040, 4 + Math.floor(power * 1.5), 18 + power * 5, 25);
  scene.cameras.main.shake(70, 0.004 + power * 0.0015);
}

/** Chain arc between two struck targets. */
export function playThunderChainLink(
  scene: Phaser.Scene,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  power: number,
): void {
  const gfx = scene.add.graphics().setDepth(23);
  gfx.lineStyle(2, 0xffe880, 0.95);

  let cx = Math.round(x1);
  let cy = Math.round(y1);
  gfx.beginPath();
  gfx.moveTo(cx, cy);
  const segments = 4 + Math.floor(power);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const nx = Math.round(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18);
    const ny = Math.round(y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10);
    gfx.lineTo(nx, ny);
  }
  gfx.strokePath();

  scene.tweens.add({
    targets: gfx,
    alpha: 0,
    duration: 140,
    onComplete: () => gfx.destroy(),
  });
  spawnPixelSparks(scene, x2, y2, 0xffe040, 2 + Math.floor(power * 0.5), 10 + power * 3, 24);
}
