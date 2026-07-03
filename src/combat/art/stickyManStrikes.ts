import type { StickPose } from '@/combat/art/stickyManPalette';
import { seg } from '@/combat/art/stickyManPalette';
import { smoothPoseStrip } from '@/combat/art/stickyManPoseMath';

/** Unarmed strike picked per combo step — punches and kicks rotate randomly. */
export const LIGHT_STRIKE_KINDS = ['jab', 'cross', 'frontKick', 'roundKick'] as const;
export const HEAVY_STRIKE_KINDS = [
  'heavyHaymaker',
  'heavyUppercut',
  'heavyBody',
  'heavyKick',
] as const;
export const UNARMED_STRIKE_KINDS = [...LIGHT_STRIKE_KINDS, ...HEAVY_STRIKE_KINDS] as const;

export type LightStrikeKind = (typeof LIGHT_STRIKE_KINDS)[number];
export type HeavyStrikeKind = (typeof HEAVY_STRIKE_KINDS)[number];
export type UnarmedStrikeKind = (typeof UNARMED_STRIKE_KINDS)[number];

export const STRIKE_ANIM: Record<UnarmedStrikeKind, string> = {
  jab: 'hero_strike_jab',
  cross: 'hero_strike_cross',
  frontKick: 'hero_strike_front_kick',
  roundKick: 'hero_strike_round_kick',
  heavyHaymaker: 'hero_strike_heavy_haymaker',
  heavyUppercut: 'hero_strike_heavy_uppercut',
  heavyBody: 'hero_strike_heavy_body',
  heavyKick: 'hero_strike_heavy_kick',
};

const JAB_KEYS: StickPose[] = [
  { lean: -5, shiftX: -4, limbs: { armBack: seg(-18, -12), armFront: seg(20, 14), legBack: seg(-12, -8), legFront: seg(10, 6) } },
  { lean: 8, shiftX: 6, limbs: { armBack: seg(-10, -6), armFront: seg(-44, -34), legBack: seg(-16, -10), legFront: seg(14, 9) } },
  { lean: 2, shiftX: 1, limbs: { armBack: seg(-8, -5), armFront: seg(-22, -16), legBack: seg(-12, -7), legFront: seg(12, 8) } },
];

const CROSS_KEYS: StickPose[] = [
  { lean: -4, shiftX: -3, limbs: { armBack: seg(24, 18), armFront: seg(26, 20), legBack: seg(-14, -9), legFront: seg(10, 6) } },
  { lean: 9, shiftX: 7, limbs: { armBack: seg(-8, -4), armFront: seg(-54, -44), legBack: seg(-18, -11), legFront: seg(18, 12) } },
  { lean: 3, shiftX: 2, limbs: { armBack: seg(-12, -8), armFront: seg(-28, -20), legBack: seg(-10, -6), legFront: seg(12, 8) } },
];

const FRONT_KICK_KEYS: StickPose[] = [
  { lean: -4, shiftX: -3, limbs: { armBack: seg(-12, -8), armFront: seg(14, 10), legBack: seg(-14, -9), legFront: seg(8, 5) } },
  { lean: 4, shiftX: 3, bob: -1, limbs: { armBack: seg(-20, -14), armFront: seg(22, 16), legBack: seg(-18, -12), legFront: seg(-35, -25) } },
  { lean: 7, shiftX: 5, limbs: { armBack: seg(-24, -18), armFront: seg(28, 20), legBack: seg(-12, -8), legFront: seg(-58, -48) } },
  { lean: 2, shiftX: 1, limbs: { armBack: seg(-14, -10), armFront: seg(16, 12), legBack: seg(-12, -8), legFront: seg(12, 8) } },
];

const ROUND_KICK_KEYS: StickPose[] = [
  { lean: -6, shiftX: -5, limbs: { armBack: seg(20, 14), armFront: seg(18, 12), legBack: seg(-16, -10), legFront: seg(6, 4) } },
  { lean: 2, shiftX: 0, bob: 1, limbs: { armBack: seg(-8, -5), armFront: seg(24, 18), legBack: seg(-10, -6), legFront: seg(-20, -12) } },
  { lean: 8, shiftX: 4, limbs: { armBack: seg(-16, -10), armFront: seg(30, 22), legBack: seg(-8, -5), legFront: seg(-62, -38) } },
  { lean: 3, shiftX: 1, limbs: { armBack: seg(-12, -8), armFront: seg(14, 10), legBack: seg(-12, -8), legFront: seg(10, 6) } },
];

const HEAVY_HAYMAKER_KEYS: StickPose[] = [
  { lean: -9, shiftX: -7, limbs: { armBack: seg(38, 30), armFront: seg(40, 32), legBack: seg(-18, -12), legFront: seg(6, 4) } },
  { lean: 11, shiftX: 8, limbs: { armBack: seg(-14, -9), armFront: seg(-74, -64), legBack: seg(-22, -14), legFront: seg(22, 14) } },
  { lean: 4, shiftX: 2, limbs: { armBack: seg(-16, -11), armFront: seg(-34, -26), legBack: seg(-12, -8), legFront: seg(14, 10) } },
];

const HEAVY_UPPERCUT_KEYS: StickPose[] = [
  { bob: 2, lean: -6, shiftX: -4, limbs: { armBack: seg(-30, -22), armFront: seg(36, 26), legBack: seg(-16, -10), legFront: seg(10, 6) } },
  { bob: 3, lean: 5, shiftX: 3, limbs: { armBack: seg(-16, -10), armFront: seg(-18, -6), legBack: seg(-20, -14), legFront: seg(16, 10) } },
  { bob: -2, lean: 10, shiftX: 6, limbs: { armBack: seg(10, 14), armFront: seg(-50, -18), legBack: seg(-6, -4), legFront: seg(22, 14) } },
  { bob: 0, lean: 3, shiftX: 1, limbs: { armBack: seg(-10, -6), armFront: seg(-28, -16), legBack: seg(-10, -6), legFront: seg(14, 10) } },
];

const HEAVY_BODY_KEYS: StickPose[] = [
  { bob: 1, lean: -5, shiftX: -4, limbs: { armBack: seg(-18, -12), armFront: seg(28, 20), legBack: seg(-14, -9), legFront: seg(8, 5) } },
  { bob: 3, lean: 4, shiftX: 3, limbs: { armBack: seg(-6, -4), armFront: seg(8, 4), legBack: seg(-22, -14), legFront: seg(18, 12) } },
  { bob: 2, lean: 11, shiftX: 8, limbs: { armBack: seg(8, 5), armFront: seg(-58, -36), legBack: seg(-10, -6), legFront: seg(24, 16) } },
  { bob: 0, lean: 3, shiftX: 2, limbs: { armBack: seg(-12, -8), armFront: seg(-26, -18), legBack: seg(-12, -8), legFront: seg(14, 10) } },
];

const HEAVY_KICK_KEYS: StickPose[] = [
  { lean: -7, shiftX: -5, limbs: { armBack: seg(-22, -16), armFront: seg(26, 18), legBack: seg(-16, -10), legFront: seg(8, 5) } },
  { lean: 3, shiftX: 2, bob: 1, limbs: { armBack: seg(-28, -20), armFront: seg(32, 24), legBack: seg(-20, -14), legFront: seg(-28, -18) } },
  { lean: 9, shiftX: 6, limbs: { armBack: seg(-18, -12), armFront: seg(34, 26), legBack: seg(-8, -5), legFront: seg(-68, -52) } },
  { lean: 3, shiftX: 1, limbs: { armBack: seg(-12, -8), armFront: seg(16, 12), legBack: seg(-12, -8), legFront: seg(12, 8) } },
];

/** Smoothed pose strips — 2 eased in-betweens per keyframe gap. */
export const STRIKE_POSES: Record<UnarmedStrikeKind, StickPose[]> = {
  jab: smoothPoseStrip(JAB_KEYS, 2),
  cross: smoothPoseStrip(CROSS_KEYS, 2),
  frontKick: smoothPoseStrip(FRONT_KICK_KEYS, 2),
  roundKick: smoothPoseStrip(ROUND_KICK_KEYS, 2),
  heavyHaymaker: smoothPoseStrip(HEAVY_HAYMAKER_KEYS, 2),
  heavyUppercut: smoothPoseStrip(HEAVY_UPPERCUT_KEYS, 2),
  heavyBody: smoothPoseStrip(HEAVY_BODY_KEYS, 2),
  heavyKick: smoothPoseStrip(HEAVY_KICK_KEYS, 2),
};

export function isKickStrike(kind: UnarmedStrikeKind): boolean {
  return kind === 'frontKick' || kind === 'roundKick' || kind === 'heavyKick';
}

export function pickLightStrike(seed: number): LightStrikeKind {
  return LIGHT_STRIKE_KINDS[seed % LIGHT_STRIKE_KINDS.length]!;
}

export function pickHeavyStrike(seed: number): HeavyStrikeKind {
  return HEAVY_STRIKE_KINDS[seed % HEAVY_STRIKE_KINDS.length]!;
}
