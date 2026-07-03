import type { StickPalette, StickPose, SegmentAngles } from '@/combat/art/stickyManPalette';
import { limbEnd, seg } from '@/combat/art/stickyManPalette';

const HEAD_R = 5;
const UPPER_ARM = 5;
const LOWER_ARM = 6;
const UPPER_LEG = 6;
const LOWER_LEG = 7;
const HAND_FORK = 3;
const FOOT_FORK = 3;

interface DrawScale {
  s: number;
  upperArm: number;
  lowerArm: number;
  upperLeg: number;
  lowerLeg: number;
  headR: number;
  handFork: number;
  footFork: number;
}

const NORMAL: DrawScale = {
  s: 1,
  upperArm: UPPER_ARM,
  lowerArm: LOWER_ARM,
  upperLeg: UPPER_LEG,
  lowerLeg: LOWER_LEG,
  headR: HEAD_R,
  handFork: HAND_FORK,
  footFork: FOOT_FORK,
};

const BOSS: DrawScale = {
  s: 1.35,
  upperArm: 7,
  lowerArm: 8,
  upperLeg: 8,
  lowerLeg: 9,
  headR: 6,
  handFork: 4,
  footFork: 4,
};

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function pixelLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  thickness = 2,
): void {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    for (let ox = 0; ox < thickness; ox++) {
      for (let oy = 0; oy < thickness; oy++) {
        px(ctx, x + ox - Math.floor(thickness / 2), y + oy - Math.floor(thickness / 2), color);
      }
    }
  }
}

function drawJoint(ctx: CanvasRenderingContext2D, x: number, y: number, palette: StickPalette): void {
  px(ctx, x, y, palette.outline, 2);
  px(ctx, x, y, palette.accent, 1);
}

/** Y-fork at limb tip — two small sticks (hand / foot). */
function drawFork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  forkLen: number,
  spread: number,
  palette: StickPalette,
): void {
  const a = limbEnd(x, y, angleDeg - spread, forkLen);
  const b = limbEnd(x, y, angleDeg + spread, forkLen);
  pixelLine(ctx, x, y, a.x, a.y, palette.outline, 2);
  pixelLine(ctx, x, y, b.x, b.y, palette.outline, 2);
  pixelLine(ctx, x, y, a.x, a.y, palette.skin, 1);
  pixelLine(ctx, x, y, b.x, b.y, palette.skin, 1);
}

function drawSegmentLimb(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angles: SegmentAngles,
  upperLen: number,
  lowerLen: number,
  forkLen: number,
  forkSpread: number,
  palette: StickPalette,
  fillColor: string,
): { endX: number; endY: number; lowerAngle: number } {
  const elbow = limbEnd(ox, oy, angles.upper, upperLen);
  const end = limbEnd(elbow.x, elbow.y, angles.lower, lowerLen);

  pixelLine(ctx, ox, oy, elbow.x, elbow.y, palette.outline, 3);
  pixelLine(ctx, ox, oy, elbow.x, elbow.y, fillColor, 2);
  drawJoint(ctx, elbow.x, elbow.y, palette);

  pixelLine(ctx, elbow.x, elbow.y, end.x, end.y, palette.outline, 3);
  pixelLine(ctx, elbow.x, elbow.y, end.x, end.y, fillColor, 2);

  drawFork(ctx, end.x, end.y, angles.lower, forkLen, forkSpread, palette);

  return { endX: end.x, endY: end.y, lowerAngle: angles.lower };
}

function drawTorso(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  lean: number,
  palette: StickPalette,
): void {
  const leanX = Math.round(lean * 0.2);
  const top = Math.round(shoulderY);
  const bot = Math.round(hipY);

  for (let y = top; y <= bot; y++) {
    const t = (y - top) / Math.max(1, bot - top);
    const half = Math.max(2, Math.round(4 - t));
    for (let x = -half; x <= half; x++) {
      const pxX = cx + leanX + x;
      px(ctx, pxX - 1, y, palette.outline);
      px(ctx, pxX, y, x <= -1 ? palette.shadow : palette.fill);
    }
  }

  const sashY = Math.round(hipY - 3);
  for (let x = -4; x <= 4; x++) {
    px(ctx, cx + leanX + x, sashY, palette.accent);
  }
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  headY: number,
  headR: number,
  palette: StickPalette,
): void {
  const r = headR;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const dist = Math.hypot(dx, dy);
        const color =
          dist >= r - 0.5 ? palette.outline : dx <= -1 ? palette.shadow : palette.skin;
        px(ctx, cx + dx, headY + dy, color);
      }
    }
  }
  // Eyes (2 px, facing +X)
  px(ctx, cx + 2, headY - 1, palette.outline);
  px(ctx, cx + 3, headY - 1, palette.highlight ?? palette.outline);
  px(ctx, cx + 2, headY, palette.outline);
}

function drawSlimeBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  palette: StickPalette,
): void {
  for (let dy = -4; dy <= 5; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      if ((dx * dx) / 36 + ((dy - 1) * (dy - 1)) / 25 <= 1) {
        px(ctx, cx + dx, shoulderY + dy, dx < -2 ? palette.shadow : palette.fill);
        if (Math.abs(dx) + Math.abs(dy) > 8) px(ctx, cx + dx, shoulderY + dy, palette.outline);
      }
    }
  }
  px(ctx, cx - 2, shoulderY - 1, palette.highlight ?? palette.outline);
  px(ctx, cx + 2, shoulderY - 1, palette.highlight ?? palette.outline);
}

/** Draw one sticky-man frame (right-facing; flipX for left). */
export function drawStickyFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: StickPalette,
  pose: StickPose,
  scale: DrawScale = NORMAL,
  variant: 'hero' | 'slime' | 'archer' | 'boss' = 'hero',
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const cx = w / 2;
  const bob = pose.bob ?? 0;
  const lean = pose.lean ?? 0;
  const hipY = h - 5 + bob;
  const shoulderY = hipY - 14 + lean * 0.12;
  const headY = shoulderY - scale.headR - 5;

  const hipBackX = cx - 3;
  const hipFrontX = cx + 3;
  const shoulderBackX = cx - 3;
  const shoulderFrontX = cx + 3;

  const legFill = variant === 'slime' ? palette.shadow : palette.shadow;
  const armFill = palette.skin;

  // --- back leg (2 segments + foot fork) ---
  drawSegmentLimb(
    ctx,
    hipBackX,
    hipY,
    pose.limbs.legBack,
    scale.upperLeg,
    scale.lowerLeg,
    scale.footFork,
    14,
    palette,
    legFill,
  );

  // --- back arm ---
  drawSegmentLimb(
    ctx,
    shoulderBackX,
    shoulderY,
    pose.limbs.armBack,
    scale.upperArm,
    scale.lowerArm,
    scale.handFork,
    18,
    palette,
    armFill,
  );

  // --- body ---
  if (variant === 'slime') {
    drawSlimeBlob(ctx, cx, shoulderY + 2, palette);
  } else {
    drawTorso(ctx, cx, shoulderY, hipY, lean, palette);
  }

  if (variant === 'archer') {
    // Cape triangle behind
    pixelLine(ctx, cx - 4, shoulderY, cx - 8, hipY + 4, palette.shadow, 2);
    pixelLine(ctx, cx - 4, shoulderY, cx, hipY + 2, palette.shadow, 2);
  }

  /** Y-fork at limb tip — two small sticks (hand / foot). */
  // --- front leg ---
  drawSegmentLimb(
    ctx,
    hipFrontX,
    hipY,
    pose.limbs.legFront,
    scale.upperLeg,
    scale.lowerLeg,
    scale.footFork,
    14,
    palette,
    legFill,
  );

  // --- front arm ---
  const frontArm = drawSegmentLimb(
    ctx,
    shoulderFrontX,
    shoulderY,
    pose.limbs.armFront,
    scale.upperArm,
    scale.lowerArm,
    scale.handFork,
    18,
    palette,
    armFill,
  );

  // --- head ---
  drawHead(ctx, cx + Math.round(lean * 0.15), headY, scale.headR, palette);

  // --- props ---
  if (pose.prop === 'sword') {
    pixelLine(
      ctx,
      frontArm.endX,
      frontArm.endY,
      frontArm.endX + 10,
      frontArm.endY - 8,
      palette.accent,
      2,
    );
    px(ctx, frontArm.endX + 10, frontArm.endY - 8, palette.highlight ?? palette.accent);
  }
  if (pose.prop === 'bow') {
    const bx = frontArm.endX + 2;
    const by = frontArm.endY;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 7, -1.1, 1.1);
    ctx.stroke();
    pixelLine(ctx, bx, by - 6, bx, by + 6, palette.highlight ?? palette.accent, 1);
  }
  if (pose.prop === 'crown') {
    px(ctx, cx - 2, headY - scale.headR - 2, palette.accent, 2);
    px(ctx, cx, headY - scale.headR - 4, palette.highlight ?? palette.accent, 2);
    px(ctx, cx + 2, headY - scale.headR - 2, palette.accent, 2);
  }
  if (pose.prop === 'aura') {
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, hipY - 6, 15 * scale.s, 20 * scale.s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (variant === 'boss') {
    // Rune stripe on torso
    for (let y = shoulderY + 2; y < hipY - 2; y += 3) {
      px(ctx, cx, y, palette.accent);
    }
  }
}

export function buildSheetCanvas(
  frames: StickPose[],
  w: number,
  h: number,
  palette: StickPalette,
  scale: DrawScale = NORMAL,
  variant: 'hero' | 'slime' | 'archer' | 'boss' = 'hero',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w * frames.length;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  frames.forEach((pose, i) => {
    ctx.save();
    ctx.translate(i * w, 0);
    drawStickyFrame(ctx, w, h, palette, pose, scale, variant);
    ctx.restore();
  });
  return canvas;
}

// --- poses (upper/lower angles: degrees from vertical-down, − = forward when facing right) ---

export const POSES_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: seg(-18, -12), armFront: seg(18, 12), legBack: seg(-10, -6), legFront: seg(10, 6) } },
  { bob: -1, limbs: { armBack: seg(-16, -10), armFront: seg(16, 10), legBack: seg(-8, -5), legFront: seg(8, 5) } },
  { bob: 0, limbs: { armBack: seg(-18, -12), armFront: seg(18, 12), legBack: seg(-10, -6), legFront: seg(10, 6) } },
  { bob: 1, limbs: { armBack: seg(-20, -14), armFront: seg(20, 14), legBack: seg(-12, -8), legFront: seg(12, 8) } },
];

export const POSES_WALK: StickPose[] = [
  { limbs: { armBack: seg(-40, -25), armFront: seg(35, 20), legBack: seg(-35, -20), legFront: seg(30, 45) } },
  { bob: -1, limbs: { armBack: seg(-25, -15), armFront: seg(20, 10), legBack: seg(-15, -8), legFront: seg(45, 30) } },
  { limbs: { armBack: seg(35, 20), armFront: seg(-40, -25), legBack: seg(30, 45), legFront: seg(-35, -20) } },
  { bob: 1, limbs: { armBack: seg(20, 10), armFront: seg(-25, -15), legBack: seg(45, 30), legFront: seg(-15, -8) } },
  { limbs: { armBack: seg(-40, -25), armFront: seg(35, 20), legBack: seg(-35, -20), legFront: seg(30, 45) } },
  { bob: -1, limbs: { armBack: seg(-25, -15), armFront: seg(20, 10), legBack: seg(-15, -8), legFront: seg(45, 30) } },
];

export const POSES_ATTACK_1: StickPose[] = [
  { limbs: { armBack: seg(-8, -5), armFront: seg(45, 35), legBack: seg(-14, -8), legFront: seg(12, 8) }, prop: 'sword' },
  { lean: -4, limbs: { armBack: seg(5, 10), armFront: seg(-55, -45), legBack: seg(-10, -6), legFront: seg(16, 10) }, prop: 'sword' },
  { limbs: { armBack: seg(-12, -8), armFront: seg(-40, -30), legBack: seg(-12, -8), legFront: seg(10, 6) }, prop: 'sword' },
];

export const POSES_ATTACK_2: StickPose[] = [
  { limbs: { armBack: seg(25, 18), armFront: seg(40, 30), legBack: seg(-16, -10), legFront: seg(10, 6) }, prop: 'sword' },
  { lean: -3, limbs: { armBack: seg(-5, 0), armFront: seg(-58, -48), legBack: seg(-8, -5), legFront: seg(18, 12) }, prop: 'sword' },
  { limbs: { armBack: seg(-18, -12), armFront: seg(-38, -28), legBack: seg(-10, -6), legFront: seg(12, 8) }, prop: 'sword' },
];

export const POSES_ATTACK_3: StickPose[] = [
  { limbs: { armBack: seg(-35, -25), armFront: seg(50, 40), legBack: seg(-20, -12), legFront: seg(8, 5) }, prop: 'sword' },
  { lean: -6, limbs: { armBack: seg(12, 8), armFront: seg(-68, -58), legBack: seg(-5, -3), legFront: seg(24, 16) }, prop: 'sword' },
  { lean: -8, limbs: { armBack: seg(18, 12), armFront: seg(-72, -62), legBack: seg(-3, -2), legFront: seg(26, 18) }, prop: 'sword' },
  { limbs: { armBack: seg(-22, -15), armFront: seg(-32, -22), legBack: seg(-12, -8), legFront: seg(14, 10) }, prop: 'sword' },
];

export const POSES_HIT: StickPose[] = [
  { lean: 6, limbs: { armBack: seg(42, 35), armFront: seg(48, 40), legBack: seg(20, 14), legFront: seg(-12, -8) } },
  { bob: 2, lean: 8, limbs: { armBack: seg(48, 40), armFront: seg(52, 44), legBack: seg(24, 18), legFront: seg(-16, -10) } },
];

export const POSES_SLIME_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: seg(-14, -10), armFront: seg(14, 10), legBack: seg(-14, -10), legFront: seg(14, 10) } },
  { bob: 2, limbs: { armBack: seg(-16, -12), armFront: seg(16, 12), legBack: seg(-16, -12), legFront: seg(16, 12) } },
];

export const POSES_SLIME_WALK: StickPose[] = [
  { bob: 1, limbs: { armBack: seg(-32, -22), armFront: seg(28, 18), legBack: seg(-30, -45), legFront: seg(25, 20) } },
  { bob: 3, limbs: { armBack: seg(28, 18), armFront: seg(-32, -22), legBack: seg(25, 20), legFront: seg(-30, -45) } },
  { bob: 1, limbs: { armBack: seg(-32, -22), armFront: seg(28, 18), legBack: seg(-30, -45), legFront: seg(25, 20) } },
  { bob: 3, limbs: { armBack: seg(28, 18), armFront: seg(-32, -22), legBack: seg(25, 20), legFront: seg(-30, -45) } },
];

export const POSES_ARCHER_IDLE: StickPose[] = [
  { limbs: { armBack: seg(-18, -12), armFront: seg(8, 5), legBack: seg(-10, -6), legFront: seg(10, 6) }, prop: 'bow' },
  { bob: -1, limbs: { armBack: seg(-16, -10), armFront: seg(6, 4), legBack: seg(-8, -5), legFront: seg(8, 5) }, prop: 'bow' },
];

export const POSES_ARCHER_WALK: StickPose[] = [
  { limbs: { armBack: seg(-28, -18), armFront: seg(12, 8), legBack: seg(-28, -18), legFront: seg(22, 35) }, prop: 'bow' },
  { limbs: { armBack: seg(-14, -10), armFront: seg(10, 6), legBack: seg(22, 35), legFront: seg(-28, -18) }, prop: 'bow' },
  { limbs: { armBack: seg(-28, -18), armFront: seg(12, 8), legBack: seg(-28, -18), legFront: seg(22, 35) }, prop: 'bow' },
  { limbs: { armBack: seg(-14, -10), armFront: seg(10, 6), legBack: seg(22, 35), legFront: seg(-28, -18) }, prop: 'bow' },
];

export const POSES_ARCHER_ATTACK: StickPose[] = [
  { limbs: { armBack: seg(-5, -3), armFront: seg(5, 3), legBack: seg(-12, -8), legFront: seg(12, 8) }, prop: 'bow' },
  { lean: -4, limbs: { armBack: seg(10, 6), armFront: seg(-48, -38), legBack: seg(-10, -6), legFront: seg(16, 10) }, prop: 'bow' },
];

export const POSES_TOTEM_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: seg(-8, -5), armFront: seg(8, 5), legBack: seg(-6, -4), legFront: seg(6, 4) }, prop: 'crown' },
  { bob: -1, limbs: { armBack: seg(-10, -6), armFront: seg(10, 6), legBack: seg(-8, -5), legFront: seg(8, 5) }, prop: 'crown' },
  { bob: 0, limbs: { armBack: seg(-8, -5), armFront: seg(8, 5), legBack: seg(-6, -4), legFront: seg(6, 4) }, prop: 'aura' },
  { bob: 1, limbs: { armBack: seg(-12, -8), armFront: seg(12, 8), legBack: seg(-10, -6), legFront: seg(10, 6) }, prop: 'crown' },
];

export const POSES_TOTEM_ATTACK: StickPose[] = [
  { limbs: { armBack: seg(-28, -20), armFront: seg(-28, -20), legBack: seg(-14, -10), legFront: seg(14, 10) }, prop: 'aura' },
  { lean: -2, limbs: { armBack: seg(-52, -42), armFront: seg(-52, -42), legBack: seg(-10, -6), legFront: seg(12, 8) }, prop: 'aura' },
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

export { BOSS, NORMAL };
