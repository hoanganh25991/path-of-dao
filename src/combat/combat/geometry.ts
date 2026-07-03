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
