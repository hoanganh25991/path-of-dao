import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

export type QualityTier = 'low' | 'mid' | 'high';
export type QualityPreference = 'auto' | QualityTier;

export interface QualitySettings {
  tier: QualityTier;
  pixelRatioCap: number;
  auraParticles: number;
  juiceEnabled: boolean;
  screenShake: boolean;
  shadowMap: boolean;
}

const TIER_SETTINGS: Record<QualityTier, Omit<QualitySettings, 'tier'>> = {
  low: {
    pixelRatioCap: 1,
    auraParticles: 0,
    juiceEnabled: false,
    screenShake: false,
    shadowMap: false,
  },
  mid: {
    pixelRatioCap: 1.5,
    auraParticles: 12,
    juiceEnabled: true,
    screenShake: true,
    shadowMap: false,
  },
  high: {
    pixelRatioCap: 2,
    auraParticles: 24,
    juiceEnabled: true,
    screenShake: true,
    shadowMap: true,
  },
};

/** Heuristic device tier for auto quality (sub-plan 26). */
export function detectQualityTier(ua = navigator.userAgent): QualityTier {
  const cores = navigator.hardwareConcurrency ?? 4;
  const isLegacyAndroid = /Android [1-8]\./.test(ua);
  const isLowMemory =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number' &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2;

  if (cores <= 4 || isLegacyAndroid || isLowMemory) return 'low';
  if (cores <= 6) return 'mid';
  return 'high';
}

export function resolveQualityTier(preference: QualityPreference): QualityTier {
  if (preference === 'auto') return detectQualityTier();
  return preference;
}

export function getQualitySettings(preference: QualityPreference = 'auto'): QualitySettings {
  const tier = resolveQualityTier(preference);
  return { tier, ...TIER_SETTINGS[tier] };
}

export function getQualitySettingsFromSave(save: PlayerSaveV1 | null): QualitySettings {
  const preference = save?.settings.quality ?? 'auto';
  return getQualitySettings(preference);
}
