const DEFAULT_MELEE_REACH_PADDING_PX = 12;

export interface MeleeArcShape {
  kind: 'arc';
  radius: number;
  startAngle: number;
  endAngle: number;
  x: number;
  y: number;
}

/**
 * Forward melee arc rooted on the attacker — not ahead of them.
 * A forward pivot offset leaves a close-range dead zone where sprites overlap but hits miss.
 * Radius includes the old pivot offset so max reach stays the same.
 */
export function buildMeleeArcShape(
  x: number,
  y: number,
  facing: 1 | -1,
  reachPx: number,
  halfArcRad: number,
  pivotOffsetPx: number,
  reachPaddingPx = DEFAULT_MELEE_REACH_PADDING_PX,
): MeleeArcShape {
  return {
    kind: 'arc',
    x,
    y,
    radius: reachPx + reachPaddingPx + pivotOffsetPx,
    startAngle: facing > 0 ? -halfArcRad : Math.PI - halfArcRad,
    endAngle: facing > 0 ? halfArcRad : Math.PI + halfArcRad,
  };
}

/** Circle–circle overlap for hurtbox vs circular hitbox samples. */
export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const distSq = dx * dx + dy * dy;
  const sum = ar + br;
  return distSq <= sum * sum;
}

/** Point-in-sector test for arc hitboxes (angles in radians, inclusive sweep). */
export function arcContains(
  ax: number,
  ay: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  px: number,
  py: number,
): boolean {
  const dx = px - ax;
  const dy = py - ay;
  const distSq = dx * dx + dy * dy;
  if (distSq > radius * radius) return false;

  const angle = Math.atan2(dy, dx);
  return angleInSweep(angle, startAngle, endAngle);
}

/** Normalize angle into [start, end] handling wrap across ±π. */
export function angleInSweep(angle: number, start: number, end: number): boolean {
  const twoPi = Math.PI * 2;
  let a = angle;
  let s = start;
  let e = end;

  while (a < s) a += twoPi;
  while (e < s) e += twoPi;
  if (a > e) a -= twoPi;

  return a >= s && a <= e;
}

const ARC_CIRCLE_SAMPLES = 8;

/** Arc sector vs circular hurtbox — samples hurtbox circumference. */
export function arcOverlapsCircle(
  ax: number,
  ay: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  cx: number,
  cy: number,
  cr: number,
): boolean {
  const dx = cx - ax;
  const dy = cy - ay;
  const dist = Math.hypot(dx, dy);
  if (dist > radius + cr) return false;

  if (arcContains(ax, ay, radius + cr, startAngle, endAngle, cx, cy)) return true;

  for (let i = 0; i < ARC_CIRCLE_SAMPLES; i++) {
    const a = (i / ARC_CIRCLE_SAMPLES) * Math.PI * 2;
    const px = cx + Math.cos(a) * cr;
    const py = cy + Math.sin(a) * cr;
    if (arcContains(ax, ay, radius, startAngle, endAngle, px, py)) return true;
  }
  return false;
}
