import type { LimbAngles, SegmentAngles, StickPose } from '@/combat/art/stickyManPalette';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smoothstep easing — soft acceleration/deceleration between key poses. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerpSeg(a: SegmentAngles, b: SegmentAngles, t: number): SegmentAngles {
  return { upper: lerp(a.upper, b.upper, t), lower: lerp(a.lower, b.lower, t) };
}

function lerpLimbs(a: LimbAngles, b: LimbAngles, t: number): LimbAngles {
  return {
    armBack: lerpSeg(a.armBack, b.armBack, t),
    armFront: lerpSeg(a.armFront, b.armFront, t),
    legBack: lerpSeg(a.legBack, b.legBack, t),
    legFront: lerpSeg(a.legFront, b.legFront, t),
  };
}

export function lerpPose(a: StickPose, b: StickPose, t: number): StickPose {
  const e = easeInOut(t);
  return {
    bob: lerp(a.bob ?? 0, b.bob ?? 0, e),
    lean: lerp(a.lean ?? 0, b.lean ?? 0, e),
    shiftX: lerp(a.shiftX ?? 0, b.shiftX ?? 0, e),
    limbs: lerpLimbs(a.limbs, b.limbs, e),
    prop: t < 0.5 ? a.prop : b.prop,
  };
}

/** Expand sparse keyframes into a smooth animation strip. */
export function smoothPoseStrip(keyframes: StickPose[], framesBetween = 2): StickPose[] {
  if (keyframes.length === 0) return [];
  if (keyframes.length === 1) return [...keyframes];
  const out: StickPose[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]!;
    const b = keyframes[i + 1]!;
    const steps = framesBetween + 1;
    for (let s = 0; s < steps; s++) {
      out.push(lerpPose(a, b, s / steps));
    }
  }
  out.push(keyframes[keyframes.length - 1]!);
  return out;
}
