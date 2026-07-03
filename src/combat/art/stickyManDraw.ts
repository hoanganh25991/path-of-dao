import type { StickPalette, StickPose, SegmentAngles } from '@/combat/art/stickyManPalette';
import { limbEnd, seg } from '@/combat/art/stickyManPalette';
import { smoothPoseStrip } from '@/combat/art/stickyManPoseMath';
import { STRIKE_POSES, UNARMED_STRIKE_KINDS } from '@/combat/art/stickyManStrikes';

const HEAD_R = 4;
const UPPER_ARM = 5;
const LOWER_ARM = 5;
const WRIST_LEN = 2;
const FIST_LEN = 2;
/** Max leg segment caps — legs use the space freed by a short torso. */
const LEG_UPPER_MAX = 9;
const LEG_LOWER_MAX = 9;
const ANKLE_LEN = 2;
const FOOT_LEN = 3;
/** Shoulder → hip span — compact torso; legs dominate the silhouette. */
const TORSO_HEIGHT = 10;
const CHEST_DEPTH = 6;
const CHEST_WIDTH = 3; // half-width (7px total)
const HEAD_TOP = 2;
const NECK_GAP = 2;

interface DrawScale {
  s: number;
  upperArm: number;
  lowerArm: number;
  upperLeg: number;
  lowerLeg: number;
  headR: number;
}

const NORMAL: DrawScale = {
  s: 1,
  upperArm: UPPER_ARM,
  lowerArm: LOWER_ARM,
  upperLeg: LEG_UPPER_MAX,
  lowerLeg: LEG_LOWER_MAX,
  headR: HEAD_R,
};

/** Split hip→foot room into thigh + shin (foot is drawn as 2 segments after shin). */
function legSegmentsForRoom(legRoom: number): { upper: number; lower: number } {
  const footRoom = ANKLE_LEN + FOOT_LEN;
  const remain = Math.max(4, legRoom - footRoom);
  const upper = Math.min(LEG_UPPER_MAX, Math.round(remain * 0.5));
  const lower = Math.max(2, remain - upper);
  return { upper, lower };
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

const WOOD_SHAFT = '#8b6914';
const WOOD_HIGHLIGHT = '#c8a050';
const STEEL_EDGE = '#c8d8e8';

/** Melee weapon held at the front hand — distinct silhouettes per type. */
function drawMeleeWeapon(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  lowerAngleDeg: number,
  kind: 'sword' | 'lance' | 'stick',
  palette: StickPalette,
): void {
  const aim = lowerAngleDeg - 38;
  const rad = (aim * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  if (kind === 'sword') {
    const len = 13;
    const tx = hx + cos * len;
    const ty = hy + sin * len;
    // cross-guard perpendicular to blade
    const gx = -sin;
    const gy = cos;
    pixelLine(ctx, hx + gx * 3, hy + gy * 3, hx - gx * 3, hy - gy * 3, palette.accent, 2);
    pixelLine(ctx, hx, hy, tx, ty, palette.outline, 3);
    pixelLine(ctx, hx + cos, hy + sin, tx - cos, ty - sin, STEEL_EDGE, 1);
    px(ctx, tx, ty, palette.highlight ?? STEEL_EDGE);
    px(ctx, tx - cos, ty - sin, palette.highlight ?? palette.accent);
    px(ctx, hx - cos * 0.5, hy - sin * 0.5, palette.shadow);
    return;
  }

  if (kind === 'lance') {
    const len = 20;
    const tx = hx + cos * len;
    const ty = hy + sin * len;
    // long shaft — wood with steel tip
    pixelLine(ctx, hx, hy, tx, ty, palette.outline, 3);
    pixelLine(ctx, hx + cos, hy + sin, tx - cos * 2, ty - sin * 2, WOOD_SHAFT, 2);
    pixelLine(ctx, hx + cos, hy + sin, tx - cos * 3, ty - sin * 3, WOOD_HIGHLIGHT, 1);
    // spearhead wedge
    const tipX = tx + cos * 2;
    const tipY = ty + sin * 2;
    pixelLine(ctx, tx - sin * 2, ty + cos * 2, tipX, tipY, palette.outline, 2);
    pixelLine(ctx, tx + sin * 2, ty - cos * 2, tipX, tipY, palette.outline, 2);
    px(ctx, tipX, tipY, palette.highlight ?? STEEL_EDGE);
    return;
  }

  // stick / staff — short, thick club
  const len = 10;
  const tx = hx + cos * len;
  const ty = hy + sin * len;
  pixelLine(ctx, hx, hy, tx, ty, palette.outline, 4);
  pixelLine(ctx, hx + cos, hy + sin, tx - cos, ty - sin, WOOD_SHAFT, 2);
  px(ctx, tx, ty, WOOD_HIGHLIGHT);
  px(ctx, tx - cos, ty - sin, WOOD_SHAFT);
}

/** Hand = wrist segment + fist segment (2 parts, no Y-fork). */
function drawHand2Seg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  palette: StickPalette,
  fillColor: string,
): { endX: number; endY: number; lowerAngle: number } {
  const wrist = limbEnd(x, y, angleDeg, WRIST_LEN);
  pixelLine(ctx, x, y, wrist.x, wrist.y, palette.outline, 2);
  pixelLine(ctx, x, y, wrist.x, wrist.y, fillColor, 1);
  drawJoint(ctx, wrist.x, wrist.y, palette);

  const fistAngle = angleDeg - 6;
  const fist = limbEnd(wrist.x, wrist.y, fistAngle, FIST_LEN);
  pixelLine(ctx, wrist.x, wrist.y, fist.x, fist.y, palette.outline, 2);
  pixelLine(ctx, wrist.x, wrist.y, fist.x, fist.y, fillColor, 1);
  px(ctx, fist.x, fist.y, palette.outline, 2);
  px(ctx, fist.x, fist.y, fillColor, 1);

  return { endX: fist.x, endY: fist.y, lowerAngle: fistAngle };
}

/** Foot = ankle segment + toe segment (2 parts). */
function drawFoot2Seg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  palette: StickPalette,
  fillColor: string,
): void {
  const ankle = limbEnd(x, y, angleDeg, ANKLE_LEN);
  pixelLine(ctx, x, y, ankle.x, ankle.y, palette.outline, 2);
  pixelLine(ctx, x, y, ankle.x, ankle.y, fillColor, 1);
  drawJoint(ctx, ankle.x, ankle.y, palette);

  const footAngle = angleDeg - 14;
  const toe = limbEnd(ankle.x, ankle.y, footAngle, FOOT_LEN);
  pixelLine(ctx, ankle.x, ankle.y, toe.x, toe.y, palette.outline, 2);
  pixelLine(ctx, ankle.x, ankle.y, toe.x, toe.y, fillColor, 1);
  px(ctx, toe.x, toe.y, palette.outline, 2);
}

function drawSegmentLimb(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angles: SegmentAngles,
  upperLen: number,
  lowerLen: number,
  palette: StickPalette,
  fillColor: string,
  thickness = 2,
  end: 'hand' | 'foot' = 'hand',
): { endX: number; endY: number; lowerAngle: number } {
  drawJoint(ctx, ox, oy, palette);

  const elbow = limbEnd(ox, oy, angles.upper, upperLen);
  pixelLine(ctx, ox, oy, elbow.x, elbow.y, palette.outline, thickness + 1);
  pixelLine(ctx, ox, oy, elbow.x, elbow.y, fillColor, thickness);
  drawJoint(ctx, elbow.x, elbow.y, palette);

  const knee = limbEnd(elbow.x, elbow.y, angles.lower, lowerLen);
  pixelLine(ctx, elbow.x, elbow.y, knee.x, knee.y, palette.outline, thickness + 1);
  pixelLine(ctx, elbow.x, elbow.y, knee.x, knee.y, fillColor, thickness);

  if (end === 'foot') {
    drawFoot2Seg(ctx, knee.x, knee.y, angles.lower, palette, fillColor);
    return { endX: knee.x, endY: knee.y, lowerAngle: angles.lower };
  }

  return drawHand2Seg(ctx, knee.x, knee.y, angles.lower, palette, fillColor);
}

function drawNarrowTorso(
  ctx: CanvasRenderingContext2D,
  cx: number,
  shoulderY: number,
  hipY: number,
  lean: number,
  palette: StickPalette,
): void {
  const leanX = Math.round(lean * 0.35);
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

  // Lower robe panel (chest to hip) — narrow waist above pelvis
  for (let y = chestBot + 1; y <= Math.round(hipY) - 4; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      px(ctx, x + dx, y, Math.abs(dx) === 2 ? palette.outline : dx === -1 ? palette.shadow : palette.fill);
    }
  }

  // Pelvis block — compact hip mass above legs
  for (let y = Math.round(hipY) - 2; y <= Math.round(hipY); y++) {
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

  const shift = pose.shiftX ?? 0;
  const bob = pose.bob ?? 0;
  const lean = pose.lean ?? 0;
  const footY = h - 1;
  const leanX = Math.round(lean * 0.35);
  const torsoCx = w / 2 + shift;
  const shoulderCx = torsoCx + leanX;
  const hipCx = torsoCx + Math.round(lean * 0.22);

  drawGroundShadow(ctx, torsoCx + Math.round(lean * 0.12), footY);

  // Top-down layout: head → torso (fixed) → legs fill the rest to the feet.
  const headY = HEAD_TOP + scale.headR;
  const shoulderY = headY + scale.headR + NECK_GAP - bob + lean * 0.1;
  const hipY = shoulderY + TORSO_HEIGHT;
  const legRoom = Math.max(8, footY - hipY);
  const legLen = legSegmentsForRoom(legRoom);
  const drawScale: DrawScale = { ...scale, upperLeg: legLen.upper, lowerLeg: legLen.lower };

  const hipBackX = hipCx - 4;
  const hipFrontX = hipCx + 4;
  const shoulderBackX = shoulderCx - 6;
  const shoulderFrontX = shoulderCx + 6;

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
    palette,
    legFillBack,
    2,
    'foot',
  );

  // --- back arm (outside narrow torso) ---
  drawSegmentLimb(
    ctx,
    shoulderBackX,
    shoulderY,
    pose.limbs.armBack,
    scale.upperArm,
    scale.lowerArm,
    palette,
    armFill,
    2,
    'hand',
  );

  if (variant === 'archer') {
    drawArcherCape(ctx, torsoCx, shoulderY, hipY, palette);
  }

  // --- narrow torso (all characters) ---
  drawNarrowTorso(ctx, torsoCx, shoulderY, hipY, lean, palette);

  if (variant === 'slime') {
    drawSlimeBlob(ctx, torsoCx, chestY, palette);
  }
  if (variant === 'boss') {
    drawBossRunes(ctx, torsoCx + Math.round(lean * 0.2), shoulderY, hipY, palette);
  }

  // --- front leg (slimmer stroke) ---
  drawSegmentLimb(
    ctx,
    hipFrontX,
    hipY,
    pose.limbs.legFront,
    drawScale.upperLeg,
    drawScale.lowerLeg,
    palette,
    legFillFront,
    2,
    'foot',
  );

  // --- front arm ---
  const frontArm = drawSegmentLimb(
    ctx,
    shoulderFrontX,
    shoulderY,
    pose.limbs.armFront,
    scale.upperArm,
    scale.lowerArm,
    palette,
    armFill,
    2,
    'hand',
  );

  // --- head ---
  drawHead(ctx, torsoCx + Math.round(lean * 0.18), headY, scale.headR, palette, variant);

  // --- props (weapon types read clearly in silhouette) ---
  if (pose.prop === 'sword' || pose.prop === 'lance' || pose.prop === 'stick') {
    drawMeleeWeapon(ctx, frontArm.endX, frontArm.endY, frontArm.lowerAngle, pose.prop, palette);
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
    px(ctx, torsoCx - 3, headY - scale.headR - 2, palette.accent);
    px(ctx, torsoCx - 2, headY - scale.headR - 4, palette.highlight ?? palette.accent);
    px(ctx, torsoCx - 1, headY - scale.headR - 2, palette.accent);
    px(ctx, torsoCx, headY - scale.headR - 5, palette.highlight ?? palette.accent);
    px(ctx, torsoCx + 1, headY - scale.headR - 2, palette.accent);
    px(ctx, torsoCx + 2, headY - scale.headR - 4, palette.highlight ?? palette.accent);
    px(ctx, torsoCx + 3, headY - scale.headR - 2, palette.accent);
    for (let dx = -3; dx <= 3; dx++) px(ctx, torsoCx + dx, headY - scale.headR - 1, palette.accent);
  }
  if (pose.prop === 'aura') {
    const ay = hipY - 6;
    const ar = 14 * scale.s;
    for (let a = 0; a < 24; a++) {
      const rad = (a / 24) * Math.PI * 2;
      const x = torsoCx + Math.cos(rad) * ar;
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
    lean: -5,
    shiftX: -4,
    limbs: { armBack: seg(-52, -42), armFront: seg(48, 38), legBack: seg(-16, -10), legFront: seg(10, 6) },
  },
  { lean: 6, shiftX: 4, limbs: { armBack: seg(-8, -5), armFront: seg(45, 35), legBack: seg(-14, -8), legFront: seg(12, 8) } },
  { lean: 8, shiftX: 5, limbs: { armBack: seg(5, 10), armFront: seg(-58, -48), legBack: seg(-10, -6), legFront: seg(16, 10) } },
  { lean: 2, shiftX: 1, limbs: { armBack: seg(-12, -8), armFront: seg(-40, -30), legBack: seg(-12, -8), legFront: seg(10, 6) } },
];

export const POSES_ATTACK_2: StickPose[] = [
  { lean: -4, shiftX: -3, limbs: { armBack: seg(25, 18), armFront: seg(40, 30), legBack: seg(-16, -10), legFront: seg(10, 6) } },
  { lean: 7, shiftX: 5, limbs: { armBack: seg(-5, 0), armFront: seg(-58, -48), legBack: seg(-8, -5), legFront: seg(18, 12) } },
  { lean: 2, shiftX: 1, limbs: { armBack: seg(-18, -12), armFront: seg(-38, -28), legBack: seg(-10, -6), legFront: seg(12, 8) } },
];

export const POSES_ATTACK_3: StickPose[] = [
  { lean: -5, shiftX: -4, limbs: { armBack: seg(-35, -25), armFront: seg(50, 40), legBack: seg(-20, -12), legFront: seg(8, 5) } },
  { lean: 8, shiftX: 6, limbs: { armBack: seg(12, 8), armFront: seg(-68, -58), legBack: seg(-5, -3), legFront: seg(24, 16) } },
  { lean: 9, shiftX: 6, limbs: { armBack: seg(18, 12), armFront: seg(-72, -62), legBack: seg(-3, -2), legFront: seg(26, 18) } },
  { lean: 3, shiftX: 1, limbs: { armBack: seg(-22, -15), armFront: seg(-32, -22), legBack: seg(-12, -8), legFront: seg(14, 10) } },
];

export const POSES_ATTACK_1_SMOOTH = smoothPoseStrip(POSES_ATTACK_1, 1);
export const POSES_ATTACK_2_SMOOTH = smoothPoseStrip(POSES_ATTACK_2, 1);
export const POSES_ATTACK_3_SMOOTH = smoothPoseStrip(POSES_ATTACK_3, 1);

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

export const HERO_FRAME_COUNT_UNARMED =
  POSES_IDLE.length +
  POSES_WALK.length +
  POSES_HIT.length +
  UNARMED_STRIKE_KINDS.reduce((n, kind) => n + STRIKE_POSES[kind].length, 0);

export const HERO_FRAME_COUNT_ARMED =
  POSES_IDLE.length +
  POSES_WALK.length +
  POSES_ATTACK_1_SMOOTH.length +
  POSES_ATTACK_2_SMOOTH.length +
  POSES_ATTACK_3_SMOOTH.length +
  POSES_HIT.length;

/** @deprecated use HERO_FRAME_COUNT_UNARMED or buildHeroFrames().length */
export const HERO_FRAME_COUNT = HERO_FRAME_COUNT_UNARMED;

export type HeroCombatStyle = 'unarmed' | 'sword' | 'lance' | 'stick';

export function applyWeaponProp(poses: StickPose[], prop: 'sword' | 'lance' | 'stick'): StickPose[] {
  return poses.map((pose) => ({ ...pose, prop }));
}

export function heroFrameOffset(
  style: HeroCombatStyle,
  group: 'idle' | 'walk' | 'attack1' | 'attack2' | 'attack3' | 'hit',
): number {
  let o = 0;
  if (group === 'idle') return o;
  o += POSES_IDLE.length;
  if (group === 'walk') return o;
  o += POSES_WALK.length;

  if (style === 'unarmed') {
    if (group === 'hit') return o;
    return o;
  }

  if (group === 'attack1') return o;
  o += POSES_ATTACK_1_SMOOTH.length;
  if (group === 'attack2') return o;
  o += POSES_ATTACK_2_SMOOTH.length;
  if (group === 'attack3') return o;
  o += POSES_ATTACK_3_SMOOTH.length;
  if (group === 'hit') return o;
  return o;
}

export function buildHeroFrames(style: HeroCombatStyle = 'unarmed'): StickPose[] {
  const base = [...POSES_IDLE, ...POSES_WALK];
  if (style === 'unarmed') {
    return [...base, ...POSES_HIT, ...UNARMED_STRIKE_KINDS.flatMap((kind) => STRIKE_POSES[kind])];
  }
  return [
    ...base,
    ...applyWeaponProp(POSES_ATTACK_1_SMOOTH, style),
    ...applyWeaponProp(POSES_ATTACK_2_SMOOTH, style),
    ...applyWeaponProp(POSES_ATTACK_3_SMOOTH, style),
    ...POSES_HIT,
  ];
}

export { NORMAL };
