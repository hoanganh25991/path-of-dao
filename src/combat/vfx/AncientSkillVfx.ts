import Phaser from 'phaser';
import type { InsightIntentId, SkillKind } from '@/progression/SkillDefinition';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';
import { spawnPixelSparks } from '@/combat/skills/VFXLibrary';
import { getIntentVisual } from '@/ui/skills/SkillIcon';

const ANCIENT_AMP = 4.5;
const RING_TEX = 32;

export function getAncientSkillAmp(isGodMode: boolean): number {
  return isGodMode ? ANCIENT_AMP : 1;
}

/** Screen shake + pixel burst when an ancient unleashes a skill. */
export function burstAncientSkill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intent: InsightIntentId,
  kind: SkillKind,
): void {
  const visual = getIntentVisual(intent);
  const camera = scene.cameras.main;
  const intensity = kind === 'heal' ? 0.006 : kind === 'bolt' ? 0.014 : 0.018;
  camera.shake(180, intensity);

  const tint = parseInt(visual.glow.slice(1), 16);
  const endScale = kind === 'arc' ? 6 : 4.5;
  const burst = scene.add
    .image(Math.round(x), Math.round(y), VFX_TEXTURE_KEYS.ring)
    .setOrigin(0.5)
    .setScale(0.4)
    .setTint(tint)
    .setAlpha(0.9)
    .setDepth(50);
  scene.tweens.add({
    targets: burst,
    scaleX: (endScale * RING_TEX) / RING_TEX,
    scaleY: (endScale * RING_TEX) / RING_TEX,
    alpha: 0,
    duration: 320,
    ease: 'Cubic.easeOut',
    onComplete: () => burst.destroy(),
  });

  spawnPixelSparks(scene, x, y, parseInt(visual.color.slice(1), 16), 8, kind === 'arc' ? 48 : 36, 49);
}
