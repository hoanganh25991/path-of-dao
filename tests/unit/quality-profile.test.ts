import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectQualityTier,
  getQualitySettings,
  resolveQualityTier,
} from '@/app/QualityProfile';

describe('QualityProfile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects low tier on legacy Android UA', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 Android 8.0' });
    expect(detectQualityTier('Mozilla/5.0 Android 8.0')).toBe('low');
  });

  it('detects high tier on capable desktop UA', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 Macintosh' });
    expect(detectQualityTier('Mozilla/5.0 Macintosh')).toBe('high');
  });

  it('honours explicit preference over auto detect', () => {
    expect(resolveQualityTier('low')).toBe('low');
    expect(resolveQualityTier('high')).toBe('high');
  });

  it('disables juice and shake on low tier', () => {
    const low = getQualitySettings('low');
    expect(low.juiceEnabled).toBe(false);
    expect(low.screenShake).toBe(false);

    const high = getQualitySettings('high');
    expect(high.juiceEnabled).toBe(true);
    expect(high.screenShake).toBe(true);
  });
});
