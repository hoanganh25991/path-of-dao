/** Shared palette tokens for procedural sticky-man pixel art. */
export interface StickPalette {
  outline: string;
  skin: string;
  fill: string;
  /** Shadow side of robe / body */
  shadow: string;
  accent: string;
  highlight?: string;
  /** Hero only — compact white crown hair (top of head, not long). */
  hair?: string;
  hairShadow?: string;
  hairHi?: string;
}

/** Cultivator hero — slate-grey robe, warm skin, gold sash, white crown hair. */
export const PALETTE_HERO: StickPalette = {
  outline: '#0c0c14',
  skin: '#ffd5a8',
  fill: '#b8c4d4',
  shadow: '#687888',
  accent: '#d4a840',
  highlight: '#fff8e8',
  hair: '#f0f4f8',
  hairShadow: '#a8b4c4',
  hairHi: '#ffffff',
};

/** Slime minion — bright jelly green. */
export const PALETTE_SLIME: StickPalette = {
  outline: '#0a2010',
  skin: '#9ef56a',
  fill: '#52c452',
  shadow: '#2e8a32',
  accent: '#c8ff90',
  highlight: '#e8ffb8',
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

// ─── New map-specific palettes ───

/** Ch1 — Fallen Village / ragged mortal */
export const PALETTE_VILLAGER: StickPalette = {
  outline: '#1c1010',
  skin: '#d4b080',
  fill: '#706040',
  shadow: '#484028',
  accent: '#b09050',
  highlight: '#d4c090',
};

/** Ch1 — Wolf beast */
export const PALETTE_WOLF: StickPalette = {
  outline: '#141018',
  skin: '#687080',
  fill: '#485058',
  shadow: '#303038',
  accent: '#d0d0d8',
  highlight: '#f0f0f8',
};

/** Ch1 — Heng Yue disciple (blue-white) */
export const PALETTE_DISCIPLE: StickPalette = {
  outline: '#0c1020',
  skin: '#e8d4b8',
  fill: '#6888b0',
  shadow: '#385070',
  accent: '#c8d8e8',
  highlight: '#f0f8ff',
};

/** Ch2 — Mist Forest / ghostly spirits (pale green-blue) */
export const PALETTE_MIST_SPIRIT: StickPalette = {
  outline: '#082018',
  skin: '#90d8b0',
  fill: '#48a878',
  shadow: '#287050',
  accent: '#b8ffd8',
  highlight: '#e0ffe8',
};

/** Ch2 — Ethereal wisp (pale blue, translucent feel) */
export const PALETTE_WISP: StickPalette = {
  outline: '#081828',
  skin: '#88b8e0',
  fill: '#4880b0',
  shadow: '#285878',
  accent: '#b0d8ff',
  highlight: '#d8f0ff',
};

/** Ch2 — Spirit fox (white beast, pure white fur) */
export const PALETTE_SPIRIT_FOX: StickPalette = {
  outline: '#181820',
  skin: '#c8c8d8',
  fill: '#e8e8f0',
  shadow: '#a0a0b0',
  accent: '#f8f8ff',
  highlight: '#ffffff',
};

/** Ch3 — Stone Canyon / bandit (brown leather) */
export const PALETTE_BANDIT: StickPalette = {
  outline: '#1c1410',
  skin: '#c8a078',
  fill: '#886848',
  shadow: '#584030',
  accent: '#d4a060',
  highlight: '#f0d4a0',
};

/** Ch3 — Zhao guard (steel + red trim) */
export const PALETTE_GUARD: StickPalette = {
  outline: '#101020',
  skin: '#e0c8a8',
  fill: '#788898',
  shadow: '#485068',
  accent: '#d04030',
  highlight: '#f0e8e0',
};

/** Ch5 — Burning Desert / fire beast (red-orange) */
export const PALETTE_SCORPION: StickPalette = {
  outline: '#1c0808',
  skin: '#e06030',
  fill: '#b04020',
  shadow: '#782818',
  accent: '#ff9050',
  highlight: '#ffc890',
};

/** Ch5 — Desert spirit (orange-gold) */
export const PALETTE_DESERT_SPIRIT: StickPalette = {
  outline: '#201008',
  skin: '#e8a040',
  fill: '#c07828',
  shadow: '#885018',
  accent: '#ffc860',
  highlight: '#ffE8a0',
};

/** Ch5 — Sand demon (fiery red-black) */
export const PALETTE_SAND_DEMON: StickPalette = {
  outline: '#1c0808',
  skin: '#d06030',
  fill: '#a04020',
  shadow: '#682010',
  accent: '#ff7040',
  highlight: '#ffb080',
};

/** Ch6 — Thunder Peaks / storm beast (grey-blue) */
export const PALETTE_STORM_HAWK: StickPalette = {
  outline: '#0c1020',
  skin: '#8898b0',
  fill: '#587088',
  shadow: '#384858',
  accent: '#c8e0ff',
  highlight: '#e8f0ff',
};

/** Ch6 — Lightning spirit (yellow-white) */
export const PALETTE_LIGHTNING: StickPalette = {
  outline: '#181808',
  skin: '#f0e880',
  fill: '#d4c840',
  shadow: '#989020',
  accent: '#fff8b0',
  highlight: '#ffffff',
};

/** Ch7 — Frozen Palace / ice (pale blue-white) */
export const PALETTE_ICE: StickPalette = {
  outline: '#081020',
  skin: '#a0b8d8',
  fill: '#6090b8',
  shadow: '#386888',
  accent: '#c8e0ff',
  highlight: '#e8f4ff',
};

/** Ch7 — Frost shade (ghostly ice blue) */
export const PALETTE_FROST_SHADE: StickPalette = {
  outline: '#081828',
  skin: '#88b8d8',
  fill: '#4890b8',
  shadow: '#286888',
  accent: '#b0d8ff',
  highlight: '#d8f0ff',
};

/** Ch8 — Abyss Rift / demon (dark purple) */
export const PALETTE_RIFT_SPAWN: StickPalette = {
  outline: '#180818',
  skin: '#8848a0',
  fill: '#582870',
  shadow: '#381850',
  accent: '#d080ff',
  highlight: '#e8b8ff',
};

/** Ch8 — Corrupted cultivator (dark red) */
export const PALETTE_CORRUPTED: StickPalette = {
  outline: '#200810',
  skin: '#a03830',
  fill: '#782020',
  shadow: '#501018',
  accent: '#d05040',
  highlight: '#ff9080',
};

/** Ch9 — Heavenly Gate / celestial (gold-white) */
export const PALETTE_CELESTIAL: StickPalette = {
  outline: '#101020',
  skin: '#e8e0d0',
  fill: '#c8c8d8',
  shadow: '#8890a0',
  accent: '#d4a840',
  highlight: '#f0e8c8',
};

/** Ch10 — Void shade (deep purple-black) */
export const PALETTE_VOID_SHADE: StickPalette = {
  outline: '#080810',
  skin: '#5858a0',
  fill: '#383878',
  shadow: '#202050',
  accent: '#8888d0',
  highlight: '#b0b0e8',
};

/** Ch10 — Void weaver (void black with violet glow) */
export const PALETTE_VOID_WEAVER: StickPalette = {
  outline: '#080808',
  skin: '#484878',
  fill: '#282850',
  shadow: '#101830',
  accent: '#7060c0',
  highlight: '#a090e0',
};

/** Ch6 — Tribulation elite (storm gold, heavenly tribulation glow) */
export const PALETTE_TRIBULATION: StickPalette = {
  outline: '#181008',
  skin: '#c8a060',
  fill: '#a08840',
  shadow: '#685828',
  accent: '#ffd860',
  highlight: '#fff0a0',
};

/** Ch4 — Moon Lake / ancient guardian (deep blue-green) */
export const PALETTE_ANCIENT_GUARDIAN: StickPalette = {
  outline: '#081818',
  skin: '#508888',
  fill: '#306868',
  shadow: '#204848',
  accent: '#60c0c0',
  highlight: '#a0e8e8',
};

/** Ch4 — Moon Lake spirit (ghostly blue-green, ethereal water) */
export const PALETTE_MOON_SPIRIT: StickPalette = {
  outline: '#081818',
  skin: '#60a8a8',
  fill: '#389098',
  shadow: '#206068',
  accent: '#88e8e0',
  highlight: '#c8fff8',
};

export const FRAME_W = 32;
/** Tall enough for crown/topknot + full leg swing without clipping. */
export const FRAME_H = 56;
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
  /** Torso tilt — positive shifts weight forward when facing right. */
  lean?: number;
  /** Whole-body horizontal offset (+ = toward strike when facing right). */
  shiftX?: number;
  /** Lower hip/shoulders/head toward the ground — seated lotus (feet stay anchored). */
  hipDrop?: number;
  limbs: LimbAngles;
  prop?: 'sword' | 'lance' | 'stick' | 'bow' | 'crown' | 'aura';
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
