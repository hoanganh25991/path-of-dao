import type { StickPalette, StickPose } from '@/combat/art/stickyManPalette';
import { limbEnd } from '@/combat/art/stickyManPalette';

const LIMB = 3;
const ARM_LEN = 10;
const LEG_LEN = 11;
const HEAD_R = 4;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = LIMB,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Draw one sticky-man frame (right-facing; flipX for left). */
export function drawStickyFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: StickPalette,
  pose: StickPose,
): void {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const bob = pose.bob ?? 0;
  const hipY = h - 6 + bob;
  const shoulderY = hipY - 12 + (pose.lean ?? 0) * 0.15;
  const neckY = shoulderY - 4;
  const headY = neckY - HEAD_R - 1;

  const { armBack, armFront, legBack, legFront } = pose.limbs;

  // Back leg + arm (behind torso)
  const backHip = limbEnd(cx, hipY, armBack > 0 ? legBack + 8 : legBack, LEG_LEN);
  strokeLine(ctx, cx, hipY, backHip.x, backHip.y, palette.outline, LIMB + 1);
  strokeLine(ctx, cx, hipY, backHip.x, backHip.y, palette.fill, LIMB);

  const backHand = limbEnd(cx, shoulderY, armBack, ARM_LEN);
  strokeLine(ctx, cx, shoulderY, backHand.x, backHand.y, palette.outline, LIMB + 1);
  strokeLine(ctx, cx, shoulderY, backHand.x, backHand.y, palette.skin, LIMB - 1);

  // Torso
  strokeLine(ctx, cx, hipY, cx, shoulderY, palette.outline, LIMB + 2);
  strokeLine(ctx, cx, hipY, cx, shoulderY, palette.fill, LIMB);

  // Front leg
  const frontFoot = limbEnd(cx, hipY, legFront, LEG_LEN);
  strokeLine(ctx, cx, hipY, frontFoot.x, frontFoot.y, palette.outline, LIMB + 1);
  strokeLine(ctx, cx, hipY, frontFoot.x, frontFoot.y, palette.fill, LIMB);

  // Front arm
  const frontHand = limbEnd(cx, shoulderY, armFront, ARM_LEN);
  strokeLine(ctx, cx, shoulderY, frontHand.x, frontHand.y, palette.outline, LIMB + 1);
  strokeLine(ctx, cx, shoulderY, frontHand.x, frontHand.y, palette.skin, LIMB - 1);

  // Head
  ctx.fillStyle = palette.outline;
  ctx.beginPath();
  ctx.arc(cx, headY, HEAD_R + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(cx, headY, HEAD_R, 0, Math.PI * 2);
  ctx.fill();

  // Face dot (facing right)
  px(ctx, cx + 2, headY, palette.highlight ?? palette.outline);
  px(ctx, cx + 2, headY + 1, palette.highlight ?? palette.outline);

  // Belt / accent
  ctx.fillStyle = palette.accent;
  ctx.fillRect(Math.floor(cx - 3), Math.floor(hipY - 2), 6, 2);

  if (pose.prop === 'sword' && frontHand) {
    strokeLine(ctx, frontHand.x, frontHand.y, frontHand.x + 8, frontHand.y - 6, palette.accent, 2);
  }
  if (pose.prop === 'bow') {
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(frontHand.x + 2, frontHand.y, 6, -1.2, 1.2);
    ctx.stroke();
  }
  if (pose.prop === 'crown') {
    ctx.fillStyle = palette.accent;
    px(ctx, cx - 2, headY - HEAD_R - 2, palette.accent);
    px(ctx, cx, headY - HEAD_R - 3, palette.highlight ?? palette.accent);
    px(ctx, cx + 2, headY - HEAD_R - 2, palette.accent);
  }
  if (pose.prop === 'aura') {
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, hipY - 4, 14, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function buildSheetCanvas(
  frames: StickPose[],
  w: number,
  h: number,
  palette: StickPalette,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w * frames.length;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  frames.forEach((pose, i) => {
    ctx.save();
    ctx.translate(i * w, 0);
    drawStickyFrame(ctx, w, h, palette, pose);
    ctx.restore();
  });
  return canvas;
}

/** Standard humanoid animation keyframes (right-facing). */
export const POSES_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: -25, armFront: 25, legBack: -8, legFront: 8 } },
  { bob: -1, limbs: { armBack: -22, armFront: 22, legBack: -6, legFront: 6 } },
  { bob: 0, limbs: { armBack: -25, armFront: 25, legBack: -8, legFront: 8 } },
  { bob: 1, limbs: { armBack: -28, armFront: 28, legBack: -10, legFront: 10 } },
];

export const POSES_WALK: StickPose[] = [
  { limbs: { armBack: -35, armFront: 35, legBack: -28, legFront: 22 } },
  { bob: -1, limbs: { armBack: -20, armFront: 20, legBack: -10, legFront: 32 } },
  { limbs: { armBack: 20, armFront: -20, legBack: 28, legFront: -22 } },
  { bob: 1, limbs: { armBack: 35, armFront: -35, legBack: 10, legFront: -32 } },
  { limbs: { armBack: -35, armFront: 35, legBack: -28, legFront: 22 } },
  { bob: -1, limbs: { armBack: -20, armFront: 20, legBack: -10, legFront: 32 } },
];

export const POSES_ATTACK_1: StickPose[] = [
  { limbs: { armBack: -10, armFront: 50, legBack: -12, legFront: 10 }, prop: 'sword' },
  { lean: -4, limbs: { armBack: 5, armFront: -55, legBack: -8, legFront: 14 }, prop: 'sword' },
  { limbs: { armBack: -15, armFront: -40, legBack: -10, legFront: 12 }, prop: 'sword' },
];

export const POSES_ATTACK_2: StickPose[] = [
  { limbs: { armBack: 30, armFront: 40, legBack: -14, legFront: 8 }, prop: 'sword' },
  { lean: -3, limbs: { armBack: -5, armFront: -58, legBack: -6, legFront: 16 }, prop: 'sword' },
  { limbs: { armBack: -20, armFront: -35, legBack: -8, legFront: 10 }, prop: 'sword' },
];

export const POSES_ATTACK_3: StickPose[] = [
  { limbs: { armBack: -40, armFront: 55, legBack: -18, legFront: 6 }, prop: 'sword' },
  { lean: -6, limbs: { armBack: 10, armFront: -70, legBack: -4, legFront: 22 }, prop: 'sword' },
  { lean: -8, limbs: { armBack: 15, armFront: -75, legBack: -2, legFront: 24 }, prop: 'sword' },
  { limbs: { armBack: -25, armFront: -30, legBack: -10, legFront: 12 }, prop: 'sword' },
];

export const POSES_HIT: StickPose[] = [
  { lean: 6, limbs: { armBack: 45, armFront: 50, legBack: 18, legFront: -10 } },
  { bob: 2, lean: 8, limbs: { armBack: 50, armFront: 55, legBack: 22, legFront: -14 } },
];

export const POSES_SLIME_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: -15, armFront: 15, legBack: -12, legFront: 12 } },
  { bob: 2, limbs: { armBack: -18, armFront: 18, legBack: -14, legFront: 14 } },
];

export const POSES_SLIME_WALK: StickPose[] = [
  { bob: 1, limbs: { armBack: -30, armFront: 30, legBack: -25, legFront: 20 } },
  { bob: 3, limbs: { armBack: 25, armFront: -25, legBack: 22, legFront: -25 } },
  { bob: 1, limbs: { armBack: -30, armFront: 30, legBack: -25, legFront: 20 } },
  { bob: 3, limbs: { armBack: 25, armFront: -25, legBack: 22, legFront: -25 } },
];

export const POSES_ARCHER_IDLE: StickPose[] = [
  { limbs: { armBack: -20, armFront: 10, legBack: -8, legFront: 8 }, prop: 'bow' },
  { bob: -1, limbs: { armBack: -18, armFront: 8, legBack: -6, legFront: 6 }, prop: 'bow' },
];

export const POSES_ARCHER_WALK: StickPose[] = [
  { limbs: { armBack: -25, armFront: 15, legBack: -22, legFront: 18 }, prop: 'bow' },
  { limbs: { armBack: -15, armFront: 12, legBack: 18, legFront: -22 }, prop: 'bow' },
  { limbs: { armBack: -25, armFront: 15, legBack: -22, legFront: 18 }, prop: 'bow' },
  { limbs: { armBack: -15, armFront: 12, legBack: 18, legFront: -22 }, prop: 'bow' },
];

export const POSES_ARCHER_ATTACK: StickPose[] = [
  { limbs: { armBack: -5, armFront: 5, legBack: -10, legFront: 10 }, prop: 'bow' },
  { lean: -4, limbs: { armBack: 8, armFront: -45, legBack: -8, legFront: 14 }, prop: 'bow' },
];

export const POSES_TOTEM_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: -10, armFront: 10, legBack: -6, legFront: 6 }, prop: 'crown' },
  { bob: -1, limbs: { armBack: -12, armFront: 12, legBack: -8, legFront: 8 }, prop: 'crown' },
  { bob: 0, limbs: { armBack: -10, armFront: 10, legBack: -6, legFront: 6 }, prop: 'aura' },
  { bob: 1, limbs: { armBack: -14, armFront: 14, legBack: -10, legFront: 10 }, prop: 'crown' },
];

export const POSES_TOTEM_ATTACK: StickPose[] = [
  { limbs: { armBack: -30, armFront: -30, legBack: -12, legFront: 12 }, prop: 'aura' },
  { lean: -2, limbs: { armBack: -55, armFront: -55, legBack: -8, legFront: 10 }, prop: 'aura' },
];

export const HERO_FRAME_COUNT =
  POSES_IDLE.length +
  POSES_WALK.length +
  POSES_ATTACK_1.length +
  POSES_ATTACK_2.length +
  POSES_ATTACK_3.length +
  POSES_HIT.length;

export function heroFrameOffset(
  group: 'idle' | 'walk' | 'attack1' | 'attack2' | 'attack3' | 'hit',
): number {
  let o = 0;
  if (group === 'idle') return o;
  o += POSES_IDLE.length;
  if (group === 'walk') return o;
  o += POSES_WALK.length;
  if (group === 'attack1') return o;
  o += POSES_ATTACK_1.length;
  if (group === 'attack2') return o;
  o += POSES_ATTACK_2.length;
  if (group === 'attack3') return o;
  o += POSES_ATTACK_3.length;
  return o;
}

export function buildHeroFrames(): StickPose[] {
  return [
    ...POSES_IDLE,
    ...POSES_WALK,
    ...POSES_ATTACK_1,
    ...POSES_ATTACK_2,
    ...POSES_ATTACK_3,
    ...POSES_HIT,
  ];
}
