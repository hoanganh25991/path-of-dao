/** Shared palette tokens for procedural sticky-man pixel art. */
export interface StickPalette {
  outline: string;
  skin: string;
  fill: string;
  /** Shadow side of robe / body */
  shadow: string;
  accent: string;
  highlight?: string;
}

/** Cultivator hero — teal robe, warm skin, gold sash. */
export const PALETTE_HERO: StickPalette = {
  outline: '#0c0c14',
  skin: '#ffd5a8',
  fill: '#2a8a6a',
  shadow: '#1a5a48',
  accent: '#e8b830',
  highlight: '#fff8e8',
};

/** Slime minion — bright jelly green. */
export const PALETTE_SLIME: StickPalette = {
  outline: '#0a2010',
  skin: '#9ef56a',
  fill: '#52c452',
  shadow: '#2e8a32',
  accent: '#c8ff90',
  highlight: '#1a4018',
};

/** Archer — violet cloak, tan bow. */
export const PALETTE_ARCHER: StickPalette = {
  outline: '#18082a',
  skin: '#e8c8ff',
  fill: '#6a48a0',
  shadow: '#402868',
  accent: '#d4a860',
  highlight: '#ffffff',
};

/** Totem boss — stone grey + ember glow. */
export const PALETTE_TOTEM: StickPalette = {
  outline: '#080810',
  skin: '#9898a8',
  fill: '#686878',
  shadow: '#404050',
  accent: '#ff5038',
  highlight: '#ffb060',
};

export const FRAME_W = 32;
export const FRAME_H = 44;
export const BOSS_FRAME_W = 48;
export const BOSS_FRAME_H = 60;
export const DISPLAY_SCALE = 2;

/** Two-segment limb: upper (shoulder/hip → elbow/knee) + lower (→ hand/foot). */
export interface SegmentAngles {
  upper: number;
  lower: number;
}

export interface LimbAngles {
  armBack: SegmentAngles;
  armFront: SegmentAngles;
  legBack: SegmentAngles;
  legFront: SegmentAngles;
}

export interface StickPose {
  bob?: number;
  lean?: number;
  limbs: LimbAngles;
  prop?: 'sword' | 'bow' | 'crown' | 'aura';
}

export function limbEnd(
  ox: number,
  oy: number,
  angleDeg: number,
  length: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: ox + Math.sin(rad) * length,
    y: oy + Math.cos(rad) * length,
  };
}

/** Shorthand for symmetric idle limbs. */
export function seg(upper: number, lower: number): SegmentAngles {
  return { upper, lower };
}
