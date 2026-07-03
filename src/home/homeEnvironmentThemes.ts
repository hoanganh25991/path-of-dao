import { getMapConfig } from '@/combat/map/MapLoader';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getJourneyHomeMapId } from '@/progression/WorldProgression';

export type HomeSignatureKind =
  | 'ruined_pillar'
  | 'mist_pine'
  | 'canyon_spire'
  | 'moon_stone'
  | 'desert_cactus'
  | 'storm_crystal'
  | 'ice_spire'
  | 'void_shard'
  | 'gate_fragment'
  | 'throne_spike';

export interface HomeEnvironmentTheme {
  chapterId: string;
  background: number;
  fogColor: number;
  fogDensity: number;
  sky: { color: number; emissive: number; emissiveIntensity: number };
  lights: {
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    key: number;
    keyIntensity: number;
    rim: number;
    rimIntensity: number;
  };
  island: {
    rock: number;
    underside: number;
    platform: number;
    ring: number;
    ringEmissive: number;
  };
  foliage: { trunk: number; leaf: number };
  lantern: { color: number; emissive: number; emissiveIntensity: number };
  cloud: { color: number; opacity: number };
  signature: HomeSignatureKind;
}

const DEFAULT_THEME: HomeEnvironmentTheme = {
  chapterId: 'chapter.01.fallen_village',
  background: 0x0d1b2a,
  fogColor: 0x1a1a2e,
  fogDensity: 0.035,
  sky: { color: 0x1b3a5c, emissive: 0x0a1628, emissiveIntensity: 0.6 },
  lights: {
    hemiSky: 0x8ecae6,
    hemiGround: 0x1a1a2e,
    hemiIntensity: 0.55,
    key: 0xfff4e0,
    keyIntensity: 1.15,
    rim: 0x6ec6ff,
    rimIntensity: 0.35,
  },
  island: {
    rock: 0x3d4f3a,
    underside: 0x2a2a3a,
    platform: 0x5c4a32,
    ring: 0xc9a84c,
    ringEmissive: 0x6a5520,
  },
  foliage: { trunk: 0x4a3728, leaf: 0x2d5a27 },
  lantern: { color: 0xffb347, emissive: 0xff8c00, emissiveIntensity: 0.9 },
  cloud: { color: 0xc8d8e8, opacity: 0.18 },
  signature: 'ruined_pillar',
};

const HOME_THEMES_BY_CHAPTER: Record<string, HomeEnvironmentTheme> = {
  'chapter.01.fallen_village': {
    ...DEFAULT_THEME,
    background: 0x1a1520,
    fogColor: 0x2a2030,
    sky: { color: 0x3d2a35, emissive: 0x1a1018, emissiveIntensity: 0.55 },
    lights: {
      hemiSky: 0xc9a882,
      hemiGround: 0x1a1520,
      hemiIntensity: 0.5,
      key: 0xffd9a0,
      keyIntensity: 1.0,
      rim: 0x8866aa,
      rimIntensity: 0.3,
    },
    island: {
      rock: 0x4a4038,
      underside: 0x2a2228,
      platform: 0x6a5040,
      ring: 0xb89050,
      ringEmissive: 0x5a4020,
    },
    foliage: { trunk: 0x3a2820, leaf: 0x3a5028 },
    lantern: { color: 0xff9944, emissive: 0xcc5500, emissiveIntensity: 1.0 },
    cloud: { color: 0xd8c8b8, opacity: 0.14 },
    signature: 'ruined_pillar',
  },
  'chapter.02.mist_forest': {
    chapterId: 'chapter.02.mist_forest',
    background: 0x0f1a18,
    fogColor: 0x1a3028,
    fogDensity: 0.048,
    sky: { color: 0x1a3a32, emissive: 0x0a2018, emissiveIntensity: 0.65 },
    lights: {
      hemiSky: 0x7ec8a8,
      hemiGround: 0x0f1a18,
      hemiIntensity: 0.58,
      key: 0xd8f0e0,
      keyIntensity: 0.85,
      rim: 0x44aa88,
      rimIntensity: 0.4,
    },
    island: {
      rock: 0x2a4038,
      underside: 0x1a2820,
      platform: 0x3a5048,
      ring: 0x5a9080,
      ringEmissive: 0x2a5040,
    },
    foliage: { trunk: 0x3a3028, leaf: 0x1a5a38 },
    lantern: { color: 0x88ffcc, emissive: 0x22aa66, emissiveIntensity: 0.85 },
    cloud: { color: 0xa8d8c8, opacity: 0.22 },
    signature: 'mist_pine',
  },
  'chapter.03.stone_canyon': {
    chapterId: 'chapter.03.stone_canyon',
    background: 0x1a1008,
    fogColor: 0x3a2010,
    fogDensity: 0.032,
    sky: { color: 0x4a2818, emissive: 0x1a0a04, emissiveIntensity: 0.7 },
    lights: {
      hemiSky: 0xffaa66,
      hemiGround: 0x2a1808,
      hemiIntensity: 0.52,
      key: 0xffcc88,
      keyIntensity: 1.05,
      rim: 0xcc6644,
      rimIntensity: 0.38,
    },
    island: {
      rock: 0x6a4030,
      underside: 0x3a2018,
      platform: 0x7a5040,
      ring: 0xcc8860,
      ringEmissive: 0x6a4020,
    },
    foliage: { trunk: 0x4a3020, leaf: 0x5a5030 },
    lantern: { color: 0xff8844, emissive: 0xcc4400, emissiveIntensity: 0.95 },
    cloud: { color: 0xe8c8a0, opacity: 0.12 },
    signature: 'canyon_spire',
  },
  'chapter.04.moon_lake': {
    chapterId: 'chapter.04.moon_lake',
    background: 0x080818,
    fogColor: 0x101830,
    fogDensity: 0.04,
    sky: { color: 0x1a2850, emissive: 0x080818, emissiveIntensity: 0.75 },
    lights: {
      hemiSky: 0xaaccff,
      hemiGround: 0x080818,
      hemiIntensity: 0.5,
      key: 0xd8e8ff,
      keyIntensity: 0.75,
      rim: 0x6688cc,
      rimIntensity: 0.45,
    },
    island: {
      rock: 0x283848,
      underside: 0x181828,
      platform: 0x384858,
      ring: 0x88aacc,
      ringEmissive: 0x334466,
    },
    foliage: { trunk: 0x283038, leaf: 0x2a4858 },
    lantern: { color: 0xaaccff, emissive: 0x4466aa, emissiveIntensity: 1.0 },
    cloud: { color: 0x8898bb, opacity: 0.16 },
    signature: 'moon_stone',
  },
  'chapter.05.burning_desert': {
    chapterId: 'chapter.05.burning_desert',
    background: 0x201008,
    fogColor: 0x402818,
    fogDensity: 0.028,
    sky: { color: 0x5a3018, emissive: 0x200804, emissiveIntensity: 0.8 },
    lights: {
      hemiSky: 0xffcc88,
      hemiGround: 0x301808,
      hemiIntensity: 0.6,
      key: 0xffeeaa,
      keyIntensity: 1.2,
      rim: 0xff8844,
      rimIntensity: 0.35,
    },
    island: {
      rock: 0x8a6040,
      underside: 0x4a3020,
      platform: 0x9a7050,
      ring: 0xddaa66,
      ringEmissive: 0x8a6030,
    },
    foliage: { trunk: 0x5a4030, leaf: 0x6a7040 },
    lantern: { color: 0xffaa44, emissive: 0xdd6600, emissiveIntensity: 1.05 },
    cloud: { color: 0xf0d0a0, opacity: 0.1 },
    signature: 'desert_cactus',
  },
  'chapter.06.thunder_peaks': {
    chapterId: 'chapter.06.thunder_peaks',
    background: 0x0a0818,
    fogColor: 0x201838,
    fogDensity: 0.042,
    sky: { color: 0x281848, emissive: 0x100820, emissiveIntensity: 0.7 },
    lights: {
      hemiSky: 0x9988cc,
      hemiGround: 0x0a0818,
      hemiIntensity: 0.48,
      key: 0xccc8ff,
      keyIntensity: 0.9,
      rim: 0x6644cc,
      rimIntensity: 0.5,
    },
    island: {
      rock: 0x3a3048,
      underside: 0x201828,
      platform: 0x4a4058,
      ring: 0x8878cc,
      ringEmissive: 0x443888,
    },
    foliage: { trunk: 0x302838, leaf: 0x3a4858 },
    lantern: { color: 0xbb88ff, emissive: 0x6644cc, emissiveIntensity: 1.1 },
    cloud: { color: 0x9080b0, opacity: 0.2 },
    signature: 'storm_crystal',
  },
  'chapter.07.frozen_palace': {
    chapterId: 'chapter.07.frozen_palace',
    background: 0x081018,
    fogColor: 0x182838,
    fogDensity: 0.045,
    sky: { color: 0x284058, emissive: 0x081018, emissiveIntensity: 0.65 },
    lights: {
      hemiSky: 0xc8e8ff,
      hemiGround: 0x081018,
      hemiIntensity: 0.55,
      key: 0xe8f8ff,
      keyIntensity: 0.85,
      rim: 0x88bbdd,
      rimIntensity: 0.42,
    },
    island: {
      rock: 0x506878,
      underside: 0x283848,
      platform: 0x688898,
      ring: 0xa8d8f0,
      ringEmissive: 0x406880,
    },
    foliage: { trunk: 0x405058, leaf: 0x608898 },
    lantern: { color: 0xccf0ff, emissive: 0x66aacc, emissiveIntensity: 1.0 },
    cloud: { color: 0xd0e8f8, opacity: 0.2 },
    signature: 'ice_spire',
  },
  'chapter.08.abyss_rift': {
    chapterId: 'chapter.08.abyss_rift',
    background: 0x040008,
    fogColor: 0x180820,
    fogDensity: 0.05,
    sky: { color: 0x180828, emissive: 0x040008, emissiveIntensity: 0.85 },
    lights: {
      hemiSky: 0x664488,
      hemiGround: 0x040008,
      hemiIntensity: 0.42,
      key: 0xaa88cc,
      keyIntensity: 0.7,
      rim: 0xcc44aa,
      rimIntensity: 0.55,
    },
    island: {
      rock: 0x281830,
      underside: 0x100818,
      platform: 0x382040,
      ring: 0x8844aa,
      ringEmissive: 0x440066,
    },
    foliage: { trunk: 0x281820, leaf: 0x402848 },
    lantern: { color: 0xcc66ff, emissive: 0x8800aa, emissiveIntensity: 1.15 },
    cloud: { color: 0x604070, opacity: 0.15 },
    signature: 'void_shard',
  },
  'chapter.09.heavenly_gate': {
    chapterId: 'chapter.09.heavenly_gate',
    background: 0x101018,
    fogColor: 0x282830,
    fogDensity: 0.035,
    sky: { color: 0x383850, emissive: 0x181820, emissiveIntensity: 0.7 },
    lights: {
      hemiSky: 0xfff0cc,
      hemiGround: 0x181820,
      hemiIntensity: 0.58,
      key: 0xffffee,
      keyIntensity: 1.1,
      rim: 0xccaa66,
      rimIntensity: 0.45,
    },
    island: {
      rock: 0x585868,
      underside: 0x303038,
      platform: 0x787888,
      ring: 0xeedd88,
      ringEmissive: 0xaa8844,
    },
    foliage: { trunk: 0x484038, leaf: 0x586858 },
    lantern: { color: 0xffeeaa, emissive: 0xccaa44, emissiveIntensity: 1.05 },
    cloud: { color: 0xf0e8d0, opacity: 0.14 },
    signature: 'gate_fragment',
  },
  'chapter.10.void_throne': {
    chapterId: 'chapter.10.void_throne',
    background: 0x000004,
    fogColor: 0x080810,
    fogDensity: 0.055,
    sky: { color: 0x080818, emissive: 0x000004, emissiveIntensity: 0.9 },
    lights: {
      hemiSky: 0x444466,
      hemiGround: 0x000004,
      hemiIntensity: 0.4,
      key: 0x8888aa,
      keyIntensity: 0.65,
      rim: 0x4422aa,
      rimIntensity: 0.6,
    },
    island: {
      rock: 0x181828,
      underside: 0x080810,
      platform: 0x282838,
      ring: 0x5544aa,
      ringEmissive: 0x221066,
    },
    foliage: { trunk: 0x181820, leaf: 0x282838 },
    lantern: { color: 0x8866ff, emissive: 0x4422cc, emissiveIntensity: 1.2 },
    cloud: { color: 0x404058, opacity: 0.12 },
    signature: 'throne_spike',
  },
};

export function getHomeThemeForMap(mapId: string): HomeEnvironmentTheme {
  try {
    const { chapterId } = getMapConfig(mapId);
    return HOME_THEMES_BY_CHAPTER[chapterId] ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function getHomeThemeForSave(save: PlayerSaveV1): HomeEnvironmentTheme {
  return getHomeThemeForMap(getJourneyHomeMapId(save));
}
