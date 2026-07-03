import type Phaser from 'phaser';
import type { InsightIntentId, SkillDefinition } from '@/progression/SkillDefinition';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { getIntentVisual } from '@/ui/skills/SkillIcon';

const SLASH_OFFSET_PX = 26;
const SLASH_VISIBLE_MS = 100;

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

/** Reusable cultivation VFX presets (sub-plan 19 §7). */
export const VFXLibrary = {
  playCast(scene: Phaser.Scene, x: number, y: number, intent: InsightIntentId, amp = 1): void {
    const { glow } = getIntentVisual(intent);
    const ring = scene.add.circle(x, y - 20, 10, parseColor(glow), 0.45);
    ring.setDepth(20);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.2 * amp,
      scaleY: 2.2 * amp,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
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
    const scale = (reach / 64) * 1.1;
    const slash = scene.add
      .image(x + facing * SLASH_OFFSET_PX, y, TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setScale(scale * amp)
      .setDepth(21)
      .setTint(parseColor(glow));
    scene.time.delayedCall(SLASH_VISIBLE_MS * (amp > 1 ? 1.4 : 1), () => slash.destroy());
  },

  spiritBolt(scene: Phaser.Scene, x: number, y: number, facing: number, intent: InsightIntentId, amp = 1): Phaser.Physics.Arcade.Image {
    const { glow } = getIntentVisual(intent);
    return scene.physics.add
      .image(x + facing * 20, y, TEXTURE_KEYS.bolt)
      .setFlipX(facing < 0)
      .setScale(amp > 1 ? 1.6 * amp * 0.45 : 1)
      .setTint(parseColor(glow))
      .setDepth(21);
  },

  healBloom(scene: Phaser.Scene, x: number, y: number, intent: InsightIntentId): void {
    const { glow } = getIntentVisual(intent);
    const ring = scene.add.circle(x, y - 20, 12, parseColor(glow), 0.5);
    ring.setDepth(22);
    scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
  },

  flamePetal(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    const ring = scene.add.circle(x, y, radius * 0.35, 0xff8030, 0.35);
    ring.setDepth(20);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 320,
      onComplete: () => ring.destroy(),
    });
  },

  voidCrack(scene: Phaser.Scene, x: number, y: number, radius: number): void {
    const crack = scene.add.circle(x, y, radius * 0.4, 0x9060ff, 0.28);
    crack.setDepth(19);
    scene.tweens.add({
      targets: crack,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 380,
      onComplete: () => crack.destroy(),
    });
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
