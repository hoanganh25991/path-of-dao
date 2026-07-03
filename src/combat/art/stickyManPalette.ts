/** Shared palette tokens for procedural sticky-man pixel art. */
export interface StickPalette {
  outline: string;
  skin: string;
  fill: string;
  accent: string;
  /** Optional glow / eyes */
  highlight?: string;
}

export const PALETTE_HERO: StickPalette = {
  outline: '#1a1a2e',
  skin: '#f0d4a8',
  fill: '#3d6b4f',
  accent: '#c9a227',
  highlight: '#ffffff',
};

export const PALETTE_SLIME: StickPalette = {
  outline: '#1a3320',
  skin: '#7ed957',
  fill: '#4a9d4a',
  accent: '#2d6b2d',
  highlight: '#1c331c',
};

export const PALETTE_ARCHER: StickPalette = {
  outline: '#2a1c3d',
  skin: '#d4b8f0',
  fill: '#7a5aa8',
  accent: '#c9a86a',
  highlight: '#ffffff',
};

export const PALETTE_TOTEM: StickPalette = {
  outline: '#1a1018',
  skin: '#8a8a98',
  fill: '#5c5c68',
  accent: '#d94a3a',
  highlight: '#ff8a4a',
};

export const FRAME_W = 32;
export const FRAME_H = 40;
export const BOSS_FRAME_W = 48;
export const BOSS_FRAME_H = 56;
export const DISPLAY_SCALE = 2;

export interface LimbAngles {
  /** Degrees from vertical down; negative = forward (right-facing). */
  armBack: number;
  armFront: number;
  legBack: number;
  legFront: number;
}

export interface StickPose {
  /** Vertical bob in px */
  bob?: number;
  /** Torso lean degrees */
  lean?: number;
  limbs: LimbAngles;
  /** Draw weapon / boss crown */
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
