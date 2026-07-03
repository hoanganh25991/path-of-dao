import type { StickPalette, StickPose, SegmentAngles } from '@/combat/art/stickyManPalette';
import { limbEnd, seg } from '@/combat/art/stickyManPalette';

const HEAD_R = 4;
const UPPER_ARM = 5;
const LOWER_ARM = 6;
const HAND_FORK = 3;
/** Max leg segment caps — actual length fills remaining space below the torso. */
const LEG_UPPER_MAX = 7;
const LEG_LOWER_MAX = 8;
const FOOT_FORK_MAX = 3;
/** Shoulder → hip span (robe / spine length). */
const TORSO_HEIGHT = 26;
const CHEST_DEPTH = 16;
const CHEST_WIDTH = 3; // half-width (7px total)
const HEAD_TOP = 2;
const NECK_GAP = 3;

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
  upperLeg: LEG_UPPER_MAX,
  lowerLeg: LEG_LOWER_MAX,
  headR: HEAD_R,
  handFork: HAND_FORK,
  footFork: FOOT_FORK_MAX,
};

/** Split remaining hip→foot distance into upper / lower / fork segments. */
function legSegmentsForRoom(legRoom: number): { upper: number; lower: number; fork: number } {
  const fork = Math.min(FOOT_FORK_MAX, Math.max(2, Math.round(legRoom * 0.14)));
  const remain = Math.max(4, legRoom - fork);
  const upper = Math.min(LEG_UPPER_MAX, Math.round(remain * 0.48));
  const lower = Math.max(2, remain - upper);
  return { upper, lower, fork };
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function drawGroundShadow(ctx: CanvasRenderingContext2D, cx: number, footY: number): void {
  for (let dx = -5; dx <= 5; dx++) {
    const edge = Math.abs(dx) >= 4;
    px(ctx, cx + dx, footY, edge ? '#0a0c10' : '#12141a');
  }
  px(ctx, cx, footY - 1, '#0e1014');
}

/** Hard-edged arc for bows / props — no canvas anti-aliasing. */
function pixelArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startRad: number,
  endRad: number,
  color: string,
  thickness = 2,
): void {
  const steps = Math.max(10, Math.ceil(Math.abs(endRad - startRad) * r * 1.4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startRad + (endRad - startRad) * t;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    for (let ox = 0; ox < thickness; ox++) {
      for (let oy = 0; oy < thickness; oy++) {
        px(ctx, x + ox - Math.floor(thickness / 2), y + oy - Math.floor(thickness / 2), color);
      }
    }
  }
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
  thickness = 2,
): { endX: number; endY: number; lowerAngle: number } {
  const elbow = limbEnd(ox, oy, angles.upper, upperLen);
  const end = limbEnd(elbow.x, elbow.y, angles.lower, lowerLen);

  pixelLine(ctx, ox, oy, elbow.x, elbow.y, palette.outline, thickness + 1);
  pixelLine(ctx, ox, oy, elbow.x, elbow.y, fillColor, thickness);
  drawJoint(ctx, elbow.x, elbow.y, palette);

  pixelLine(ctx, elbow.x, elbow.y, end.x, end.y, palette.outline, thickness + 1);
  pixelLine(ctx, elbow.x, elbow.y, end.x, end.y, fillColor, thickness);

  drawFork(ctx, end.x, end.y, angles.lower, forkLen, forkSpread, palette);

  return { endX: end.x, endY: end.y, lowerAngle: angles.lower };
}

function drawNarrowTorso(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  lean: number,
  palette: StickPalette,
): void {
  const leanX = Math.round(lean * 0.2);
  const x = cx + leanX;
  const chestBot = Math.round(shoulderY + CHEST_DEPTH);

  // Center spine
  for (let y = Math.round(shoulderY); y <= Math.round(hipY); y++) {
    px(ctx, x, y, palette.shadow);
    px(ctx, x + 1, y, palette.outline);
  }

  // 7px-wide upper chest plate (front +X lit, back −X shadow)
  for (let y = Math.round(shoulderY); y <= chestBot; y++) {
    for (let dx = -CHEST_WIDTH; dx <= CHEST_WIDTH; dx++) {
      px(ctx, x + dx, y, Math.abs(dx) === CHEST_WIDTH ? palette.outline : dx <= -1 ? palette.shadow : palette.fill);
    }
  }
  // Gold collar across the shoulders + a lit robe fold on the front seam.
  const shoulderRow = Math.round(shoulderY);
  for (let dx = -CHEST_WIDTH + 1; dx <= CHEST_WIDTH - 1; dx++) {
    px(ctx, x + dx, shoulderRow, palette.accent);
  }
  px(ctx, x + CHEST_WIDTH - 1, shoulderRow + 1, palette.highlight ?? palette.accent);
  for (let y = shoulderRow + 2; y <= chestBot - 1; y += 2) {
    px(ctx, x + 1, y, palette.highlight ?? palette.fill);
  }

  // Lower robe panel (chest to hip)
  for (let y = chestBot + 1; y <= Math.round(hipY) - 3; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      px(ctx, x + dx, y, Math.abs(dx) === 2 ? palette.outline : dx === -1 ? palette.shadow : palette.fill);
    }
  }

  // Pelvis block — reads as a body mass above the legs
  for (let y = Math.round(hipY) - 2; y <= Math.round(hipY) + 1; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      px(ctx, x + dx, y, Math.abs(dx) === 3 ? palette.outline : dx <= -1 ? palette.shadow : palette.fill);
    }
  }

  // Hip sash (5px)
  const sashY = Math.round(hipY - 2);
  for (let dx = -2; dx <= 2; dx++) {
    px(ctx, x + dx, sashY, palette.accent);
  }
}

function drawSlimeBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  chestY: number,
  palette: StickPalette,
): void {
  // Jelly belly — wider lower blob with specular highlights (hue-shifted rim).
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const norm = (dx * dx) / 34 + (dy * dy) / 22;
      if (norm <= 1) {
        const edge = norm > 0.72;
        const lit = dx >= 2 && dy <= 0;
        const shade = dx <= -2 && dy >= 1;
        const color = edge
          ? palette.outline
          : lit
            ? palette.accent
            : shade
              ? palette.shadow
              : palette.fill;
        px(ctx, cx + dx, chestY + dy, color);
      }
    }
  }
  // Specular streak (upper-left lit convention on +X front).
  px(ctx, cx + 3, chestY - 2, palette.highlight ?? palette.accent);
  px(ctx, cx + 2, chestY - 1, palette.accent);
  px(ctx, cx + 4, chestY - 1, palette.accent);
  // Subtle dither at the belly base.
  px(ctx, cx - 1, chestY + 4, palette.shadow);
  px(ctx, cx + 2, chestY + 5, palette.fill);
}

function drawArcherCape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  palette: StickPalette,
): void {
  const top = Math.round(shoulderY);
  const bot = Math.round(hipY + 2);
  // Filled cape panel (back-left) — reads as cloth, not just outline sticks.
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / Math.max(1, bot - top);
    const left = cx - 3 - Math.round(t * 6);
    const right = cx - 1;
    for (let x = left; x <= right; x++) {
      const edge = x === left || x === right;
      px(ctx, x, y, edge ? palette.outline : x <= left + 1 ? palette.shadow : palette.fill);
    }
  }
  // Trailing edge highlight on the outer fold.
  pixelLine(ctx, cx - 3, top, cx - 9, bot, palette.outline, 2);
  pixelLine(ctx, cx - 3, top, cx - 9, bot, palette.shadow, 1);
  pixelLine(ctx, cx - 2, top + 1, cx - 8, bot - 1, palette.highlight ?? palette.fill, 1);
}

function drawBossStonePlate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  palette: StickPalette,
): void {
  const top = Math.round(shoulderY + 2);
  const bot = Math.round(hipY - 3);
  for (let y = top; y <= bot; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      const edge = Math.abs(dx) === 3;
      const shade = dx <= -1;
      px(ctx, cx + dx, y, edge ? palette.outline : shade ? palette.shadow : palette.fill);
    }
  }
  // Horizontal stone bands.
  for (const y of [top + 2, top + 6, top + 10]) {
    if (y <= bot) {
      for (let dx = -2; dx <= 2; dx++) px(ctx, cx + dx, y, palette.shadow);
    }
  }
}

function drawBossRunes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  palette: StickPalette,
): void {
  drawBossStonePlate(ctx, cx, shoulderY, hipY, palette);
  // Ember rune zigzag down the stone plate.
  for (let y = Math.round(shoulderY + 5); y < Math.round(hipY - 4); y += 4) {
    const off = ((y / 4) | 0) % 2 === 0 ? -1 : 1;
    px(ctx, cx + off, y, palette.accent);
    px(ctx, cx + off, y + 1, palette.highlight ?? palette.accent);
    px(ctx, cx, y + 2, palette.accent);
  }
}

function drawHeadHero(
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
        let color: string;
        if (dist >= r - 0.5) {
          color = dx >= 1 && dy <= 0 ? palette.skin : palette.outline;
        } else if (dx >= 1 && dy <= 0) {
          color = palette.highlight ?? palette.skin;
        } else if (dx <= -2) {
          color = palette.shadow;
        } else {
          color = palette.skin;
        }
        px(ctx, cx + dx, headY + dy, color);
      }
    }
  }
  const bandY = headY - Math.round(r * 0.4);
  for (let dx = -r + 1; dx <= r - 1; dx++) {
    if (dx * dx + (bandY - headY) * (bandY - headY) <= (r - 0.6) * (r - 0.6)) {
      px(ctx, cx + dx, bandY, palette.accent);
    }
  }
  px(ctx, cx, bandY, palette.highlight ?? palette.accent);
  px(ctx, cx - 1, headY - r - 1, palette.accent);
  px(ctx, cx, headY - r - 1, palette.accent);
  px(ctx, cx, headY - r - 2, palette.highlight ?? palette.accent);
  px(ctx, cx + 1, headY - 1, palette.outline);
  px(ctx, cx + 2, headY - 1, palette.outline);
  px(ctx, cx + 2, headY + 1, palette.outline);
  px(ctx, cx + 3, headY, palette.highlight ?? palette.skin);
}

function drawHeadSlime(
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
        const lit = dx >= 1 && dy <= 0;
        px(
          ctx,
          cx + dx,
          headY + dy,
          dist >= r - 0.5 ? palette.outline : lit ? palette.accent : dx <= -1 ? palette.shadow : palette.skin,
        );
      }
    }
  }
  px(ctx, cx + 3, headY - 2, palette.accent);
  // Big goo eyes (readable at 1×).
  for (const ex of [cx - 1, cx + 2]) {
    px(ctx, ex, headY, palette.outline);
    px(ctx, ex + 1, headY, palette.outline);
    px(ctx, ex, headY + 1, palette.highlight ?? palette.accent);
    px(ctx, ex + 1, headY + 1, palette.highlight ?? palette.accent);
    px(ctx, ex + 1, headY, palette.outline);
  }
}

function drawHeadArcher(
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
        const hood = dy <= -1;
        let color: string;
        if (dist >= r - 0.5) {
          color = palette.outline;
        } else if (hood) {
          color = dx <= -1 ? palette.shadow : palette.fill;
        } else if (dx >= 1) {
          color = palette.highlight ?? palette.skin;
        } else if (dx <= -2) {
          color = palette.shadow;
        } else {
          color = palette.skin;
        }
        px(ctx, cx + dx, headY + dy, color);
      }
    }
  }
  // Hood trim + mask shadow over eyes.
  for (let dx = -r + 1; dx <= r - 1; dx++) {
    if (dx * dx <= (r - 1) * (r - 1)) px(ctx, cx + dx, headY - r + 1, palette.accent);
  }
  px(ctx, cx + 1, headY, palette.outline);
  px(ctx, cx + 2, headY, palette.outline);
  px(ctx, cx + 3, headY - 1, palette.highlight ?? palette.skin);
}

function drawHeadBoss(
  ctx: CanvasRenderingContext2D,
  cx: number,
  headY: number,
  headR: number,
  palette: StickPalette,
): void {
  const r = headR;
  // Squarer stone head — reads as totem, not human.
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) + Math.abs(dy) * 0.85 <= r + 0.2) {
        const edge = Math.abs(dx) === r || dy === -r || dy === r;
        const shade = dx <= -1 || dy >= 1;
        px(ctx, cx + dx, headY + dy, edge ? palette.outline : shade ? palette.shadow : palette.skin);
      }
    }
  }
  // Ember eyes.
  px(ctx, cx, headY - 1, palette.accent);
  px(ctx, cx + 1, headY - 1, palette.highlight ?? palette.accent);
  px(ctx, cx, headY, palette.accent);
  px(ctx, cx + 1, headY, palette.highlight ?? palette.accent);
  // Cracked stone seam.
  pixelLine(ctx, cx - 1, headY + 2, cx + 1, headY + 3, palette.shadow, 1);
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  headY: number,
  headR: number,
  palette: StickPalette,
  variant: 'hero' | 'slime' | 'archer' | 'boss' = 'hero',
): void {
  switch (variant) {
    case 'slime':
      drawHeadSlime(ctx, cx, headY, headR, palette);
      break;
    case 'archer':
      drawHeadArcher(ctx, cx, headY, headR, palette);
      break;
    case 'boss':
      drawHeadBoss(ctx, cx, headY, headR, palette);
      break;
    default:
      drawHeadHero(ctx, cx, headY, headR, palette);
  }
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
  const footY = h - 1;

  drawGroundShadow(ctx, cx + Math.round(lean * 0.15), footY);

  // Top-down layout: head → torso (fixed) → legs fill the rest to the feet.
  const headY = HEAD_TOP + scale.headR;
  const shoulderY = headY + scale.headR + NECK_GAP - bob + lean * 0.08;
  const hipY = shoulderY + TORSO_HEIGHT;
  const legRoom = Math.max(8, footY - hipY);
  const legLen = legSegmentsForRoom(legRoom);
  const drawScale: DrawScale = { ...scale, upperLeg: legLen.upper, lowerLeg: legLen.lower, footFork: legLen.fork };

  const hipBackX = cx - 4;
  const hipFrontX = cx + 4;
  const shoulderBackX = cx - 6;
  const shoulderFrontX = cx + 6;

  const legFillBack = palette.shadow;
  const legFillFront = palette.fill;
  const armFill = variant === 'hero' ? palette.skin : palette.fill;
  const chestY = Math.round(shoulderY + 2);

  // --- back leg (slimmer stroke) ---
  drawSegmentLimb(
    ctx,
    hipBackX,
    hipY,
    pose.limbs.legBack,
    drawScale.upperLeg,
    drawScale.lowerLeg,
    drawScale.footFork,
    12,
    palette,
    legFillBack,
    2,
  );

  // --- back arm (outside narrow torso) ---
  drawSegmentLimb(
    ctx,
    shoulderBackX,
    shoulderY,
    pose.limbs.armBack,
    scale.upperArm,
    scale.lowerArm,
    scale.handFork,
    22,
    palette,
    armFill,
  );

  if (variant === 'archer') {
    drawArcherCape(ctx, cx, shoulderY, hipY, palette);
  }

  // --- narrow torso (all characters) ---
  drawNarrowTorso(ctx, cx, shoulderY, hipY, lean, palette);

  if (variant === 'slime') {
    drawSlimeBlob(ctx, cx, chestY, palette);
  }
  if (variant === 'boss') {
    drawBossRunes(ctx, cx + Math.round(lean * 0.2), shoulderY, hipY, palette);
  }

  // --- front leg (slimmer stroke) ---
  drawSegmentLimb(
    ctx,
    hipFrontX,
    hipY,
    pose.limbs.legFront,
    drawScale.upperLeg,
    drawScale.lowerLeg,
    drawScale.footFork,
    12,
    palette,
    legFillFront,
    2,
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
    22,
    palette,
    armFill,
  );

  // --- head ---
  drawHead(ctx, cx + Math.round(lean * 0.15), headY, scale.headR, palette, variant);

  // --- props ---
  if (pose.prop === 'sword') {
    const hx = frontArm.endX;
    const hy = frontArm.endY;
    const tx = hx + 12;
    const ty = hy - 11;
    // gold cross-guard
    pixelLine(ctx, hx - 2, hy + 1, hx + 3, hy - 2, palette.accent, 2);
    // blade: dark edge + bright glinting core
    pixelLine(ctx, hx, hy, tx, ty, palette.outline, 3);
    pixelLine(ctx, hx, hy, tx, ty, palette.highlight ?? palette.accent, 1);
    px(ctx, tx, ty, palette.highlight ?? palette.accent);
    px(ctx, tx - 1, ty + 1, palette.highlight ?? palette.accent);
  }
  if (pose.prop === 'bow') {
    const bx = frontArm.endX + 2;
    const by = frontArm.endY;
    pixelArc(ctx, bx, by, 7, -1.15, 1.15, palette.outline, 2);
    pixelArc(ctx, bx, by, 6, -1.1, 1.1, palette.accent, 1);
    pixelLine(ctx, bx, by - 6, bx, by + 6, palette.highlight ?? palette.accent, 1);
    if (pose.limbs.armFront.upper < -20) {
      pixelLine(ctx, bx - 8, by, bx + 2, by, palette.accent, 1);
      px(ctx, bx + 2, by, palette.highlight ?? palette.accent);
    }
  }
  if (pose.prop === 'crown') {
    px(ctx, cx - 3, headY - scale.headR - 2, palette.accent);
    px(ctx, cx - 2, headY - scale.headR - 4, palette.highlight ?? palette.accent);
    px(ctx, cx - 1, headY - scale.headR - 2, palette.accent);
    px(ctx, cx, headY - scale.headR - 5, palette.highlight ?? palette.accent);
    px(ctx, cx + 1, headY - scale.headR - 2, palette.accent);
    px(ctx, cx + 2, headY - scale.headR - 4, palette.highlight ?? palette.accent);
    px(ctx, cx + 3, headY - scale.headR - 2, palette.accent);
    for (let dx = -3; dx <= 3; dx++) px(ctx, cx + dx, headY - scale.headR - 1, palette.accent);
  }
  if (pose.prop === 'aura') {
    const ay = hipY - 6;
    const ar = 14 * scale.s;
    for (let a = 0; a < 24; a++) {
      const rad = (a / 24) * Math.PI * 2;
      const x = cx + Math.cos(rad) * ar;
      const y = ay + Math.sin(rad) * ar * 1.3;
      px(ctx, x, y, a % 3 === 0 ? palette.highlight ?? palette.accent : palette.accent);
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
  { bob: 0, limbs: { armBack: seg(-38, -28), armFront: seg(38, 28), legBack: seg(-6, -5), legFront: seg(6, 5) } },
  { bob: -1, limbs: { armBack: seg(-36, -26), armFront: seg(36, 26), legBack: seg(-5, -4), legFront: seg(5, 4) } },
  { bob: 0, limbs: { armBack: seg(-38, -28), armFront: seg(38, 28), legBack: seg(-6, -5), legFront: seg(6, 5) } },
  { bob: 1, limbs: { armBack: seg(-40, -30), armFront: seg(40, 30), legBack: seg(-7, -5), legFront: seg(7, 5) } },
];

export const POSES_WALK: StickPose[] = [
  {
    lean: -1,
    limbs: {
      armBack: seg(-32, -22),
      armFront: seg(28, 18),
      legBack: seg(12, 8),
      legFront: seg(-18, -12),
    },
  },
  {
    bob: -1,
    limbs: {
      armBack: seg(-33, -23),
      armFront: seg(30, 20),
      legBack: seg(4, 2),
      legFront: seg(-12, -8),
    },
  },
  {
    lean: -1,
    limbs: {
      armBack: seg(-18, -12),
      armFront: seg(32, 22),
      legBack: seg(-18, -12),
      legFront: seg(12, 8),
    },
  },
  {
    limbs: {
      armBack: seg(34, 24),
      armFront: seg(-34, -24),
      legBack: seg(6, 4),
      legFront: seg(-6, -4),
    },
  },
  {
    bob: 1,
    lean: -0.5,
    limbs: {
      armBack: seg(12, 8),
      armFront: seg(-28, -18),
      legBack: seg(-10, -6),
      legFront: seg(10, 6),
    },
  },
  {
    limbs: {
      armBack: seg(-20, -14),
      armFront: seg(20, 14),
      legBack: seg(-2, -1),
      legFront: seg(2, 1),
    },
  },
];

export const POSES_ATTACK_1: StickPose[] = [
  {
    lean: 4,
    limbs: { armBack: seg(-52, -42), armFront: seg(48, 38), legBack: seg(-16, -10), legFront: seg(10, 6) },
    prop: 'sword',
  },
  { limbs: { armBack: seg(-8, -5), armFront: seg(45, 35), legBack: seg(-14, -8), legFront: seg(12, 8) }, prop: 'sword' },
  { lean: -5, limbs: { armBack: seg(5, 10), armFront: seg(-58, -48), legBack: seg(-10, -6), legFront: seg(16, 10) }, prop: 'sword' },
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

export const POSES_PALM_ATTACK_1: StickPose[] = [
  { lean: 2, limbs: { armBack: seg(-16, -10), armFront: seg(24, 18), legBack: seg(-14, -8), legFront: seg(10, 6) } },
  { limbs: { armBack: seg(-8, -5), armFront: seg(40, 30), legBack: seg(-12, -7), legFront: seg(12, 8) } },
  { lean: -2, limbs: { armBack: seg(6, 4), armFront: seg(-20, -14), legBack: seg(-10, -6), legFront: seg(14, 10) } },
];

export const POSES_PALM_ATTACK_2: StickPose[] = [
  { limbs: { armBack: seg(18, 12), armFront: seg(32, 24), legBack: seg(-16, -10), legFront: seg(10, 6) } },
  { lean: -2, limbs: { armBack: seg(-4, -2), armFront: seg(-48, -38), legBack: seg(-8, -5), legFront: seg(16, 10) } },
  { limbs: { armBack: seg(-14, -9), armFront: seg(-32, -24), legBack: seg(-10, -6), legFront: seg(12, 8) } },
];

export const POSES_PALM_ATTACK_3: StickPose[] = [
  { lean: 3, limbs: { armBack: seg(-28, -18), armFront: seg(44, 34), legBack: seg(-18, -11), legFront: seg(8, 5) } },
  { lean: -5, limbs: { armBack: seg(10, 6), armFront: seg(-58, -48), legBack: seg(-4, -2), legFront: seg(22, 14) } },
  { lean: -6, limbs: { armBack: seg(14, 8), armFront: seg(-62, -52), legBack: seg(-3, -2), legFront: seg(24, 16) } },
  { limbs: { armBack: seg(-18, -12), armFront: seg(-28, -20), legBack: seg(-12, -8), legFront: seg(14, 10) } },
];

export const POSES_HIT: StickPose[] = [
  { lean: 6, limbs: { armBack: seg(42, 35), armFront: seg(48, 40), legBack: seg(20, 14), legFront: seg(-12, -8) } },
  { bob: 2, lean: 8, limbs: { armBack: seg(48, 40), armFront: seg(52, 44), legBack: seg(24, 18), legFront: seg(-16, -10) } },
];

export const POSES_SLIME_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: seg(-38, -28), armFront: seg(38, 28), legBack: seg(-16, -12), legFront: seg(16, 12) } },
  { bob: 2, limbs: { armBack: seg(-42, -32), armFront: seg(42, 32), legBack: seg(-20, -16), legFront: seg(20, 16) } },
  { bob: 1, limbs: { armBack: seg(-36, -26), armFront: seg(36, 26), legBack: seg(-14, -10), legFront: seg(14, 10) } },
  { bob: 0, limbs: { armBack: seg(-40, -30), armFront: seg(40, 30), legBack: seg(-18, -14), legFront: seg(18, 14) } },
];

export const POSES_SLIME_WALK: StickPose[] = [
  {
    lean: -1,
    limbs: {
      armBack: seg(-30, -20),
      armFront: seg(26, 16),
      legBack: seg(14, 10),
      legFront: seg(-20, -14),
    },
  },
  {
    bob: 1,
    limbs: {
      armBack: seg(-32, -22),
      armFront: seg(28, 18),
      legBack: seg(2, 1),
      legFront: seg(-14, -10),
    },
  },
  {
    lean: -1,
    limbs: {
      armBack: seg(-16, -10),
      armFront: seg(30, 20),
      legBack: seg(-20, -14),
      legFront: seg(14, 10),
    },
  },
  {
    bob: -1,
    limbs: {
      armBack: seg(32, 22),
      armFront: seg(-32, -22),
      legBack: seg(8, 5),
      legFront: seg(-8, -5),
    },
  },
  {
    lean: -0.5,
    limbs: {
      armBack: seg(14, 10),
      armFront: seg(-26, -16),
      legBack: seg(-12, -8),
      legFront: seg(12, 8),
    },
  },
  {
    limbs: {
      armBack: seg(-22, -16),
      armFront: seg(22, 16),
      legBack: seg(-2, -1),
      legFront: seg(2, 1),
    },
  },
];

export const POSES_ARCHER_IDLE: StickPose[] = [
  { limbs: { armBack: seg(-36, -24), armFront: seg(20, 14), legBack: seg(-12, -8), legFront: seg(12, 8) }, prop: 'bow' },
  { bob: -1, limbs: { armBack: seg(-34, -22), armFront: seg(18, 12), legBack: seg(-10, -6), legFront: seg(10, 6) }, prop: 'bow' },
];

export const POSES_ARCHER_WALK: StickPose[] = [
  {
    lean: -1,
    limbs: {
      armBack: seg(-28, -18),
      armFront: seg(12, 8),
      legBack: seg(12, 8),
      legFront: seg(-18, -12),
    },
    prop: 'bow',
  },
  {
    limbs: {
      armBack: seg(-30, -20),
      armFront: seg(10, 6),
      legBack: seg(-6, -4),
      legFront: seg(6, 4),
    },
    prop: 'bow',
  },
  {
    lean: -1,
    limbs: {
      armBack: seg(-18, -12),
      armFront: seg(12, 8),
      legBack: seg(-18, -12),
      legFront: seg(12, 8),
    },
    prop: 'bow',
  },
  {
    limbs: {
      armBack: seg(10, 6),
      armFront: seg(-30, -20),
      legBack: seg(6, 4),
      legFront: seg(-6, -4),
    },
    prop: 'bow',
  },
];

export const POSES_ARCHER_ATTACK: StickPose[] = [
  { limbs: { armBack: seg(-28, -18), armFront: seg(28, 18), legBack: seg(-12, -8), legFront: seg(12, 8) }, prop: 'bow' },
  { limbs: { armBack: seg(-5, -3), armFront: seg(5, 3), legBack: seg(-12, -8), legFront: seg(12, 8) }, prop: 'bow' },
  { lean: -5, limbs: { armBack: seg(12, 8), armFront: seg(-52, -42), legBack: seg(-10, -6), legFront: seg(16, 10) }, prop: 'bow' },
];

export const POSES_TOTEM_IDLE: StickPose[] = [
  { bob: 0, limbs: { armBack: seg(-32, -22), armFront: seg(32, 22), legBack: seg(-10, -6), legFront: seg(10, 6) }, prop: 'crown' },
  { bob: -1, limbs: { armBack: seg(-34, -24), armFront: seg(34, 24), legBack: seg(-12, -8), legFront: seg(12, 8) }, prop: 'crown' },
  { bob: 0, limbs: { armBack: seg(-32, -22), armFront: seg(32, 22), legBack: seg(-10, -6), legFront: seg(10, 6) }, prop: 'aura' },
  { bob: 1, limbs: { armBack: seg(-36, -26), armFront: seg(36, 26), legBack: seg(-14, -10), legFront: seg(14, 10) }, prop: 'crown' },
];

export const POSES_TOTEM_ATTACK: StickPose[] = [
  { limbs: { armBack: seg(-22, -16), armFront: seg(-22, -16), legBack: seg(-14, -10), legFront: seg(14, 10) }, prop: 'aura' },
  { limbs: { armBack: seg(-28, -20), armFront: seg(-28, -20), legBack: seg(-14, -10), legFront: seg(14, 10) }, prop: 'aura' },
  { lean: -3, limbs: { armBack: seg(-58, -48), armFront: seg(-58, -48), legBack: seg(-10, -6), legFront: seg(12, 8) }, prop: 'aura' },
];

export const HERO_FRAME_COUNT =
  POSES_IDLE.length +
  POSES_WALK.length +
  POSES_ATTACK_1.length +
  POSES_ATTACK_2.length +
  POSES_ATTACK_3.length +
  POSES_HIT.length +
  POSES_PALM_ATTACK_1.length +
  POSES_PALM_ATTACK_2.length +
  POSES_PALM_ATTACK_3.length;

export function heroFrameOffset(
  group:
    | 'idle'
    | 'walk'
    | 'attack1'
    | 'attack2'
    | 'attack3'
    | 'hit'
    | 'palm1'
    | 'palm2'
    | 'palm3',
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
  if (group === 'hit') return o;
  o += POSES_HIT.length;
  if (group === 'palm1') return o;
  o += POSES_PALM_ATTACK_1.length;
  if (group === 'palm2') return o;
  o += POSES_PALM_ATTACK_2.length;
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
    ...POSES_PALM_ATTACK_1,
    ...POSES_PALM_ATTACK_2,
    ...POSES_PALM_ATTACK_3,
  ];
}

export { NORMAL };
