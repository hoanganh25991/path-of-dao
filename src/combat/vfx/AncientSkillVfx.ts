import Phaser from 'phaser';
import type { InsightIntentId, SkillKind } from '@/progression/SkillDefinition';
import { getIntentVisual } from '@/ui/skills/SkillIcon';

const ANCIENT_AMP = 2.8;

export function getAncientSkillAmp(isGodMode: boolean): number {
  return isGodMode ? ANCIENT_AMP : 1;
}

/** Screen shake + radial burst when an ancient unleashes a skill. */
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

  const burst = scene.add.circle(x, y, 8, parseInt(visual.glow.slice(1), 16), 0.55);
  burst.setDepth(50);
  burst.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: burst,
    scaleX: kind === 'arc' ? 6 : 4.5,
    scaleY: kind === 'arc' ? 6 : 4.5,
    alpha: 0,
    duration: 320,
    ease: 'Cubic.easeOut',
    onComplete: () => burst.destroy(),
  });

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
    const dist = 28 + Math.random() * 36;
    const spark = scene.add.circle(
      x + Math.cos(angle) * dist * 0.2,
      y + Math.sin(angle) * dist * 0.2,
      3 + Math.random() * 4,
      parseInt(visual.color.slice(1), 16),
      0.85,
    );
    spark.setDepth(49);
    spark.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.2,
      duration: 260 + Math.random() * 120,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}
