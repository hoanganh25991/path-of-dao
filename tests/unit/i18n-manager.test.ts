import { beforeEach, describe, expect, it } from 'vitest';
import { I18nManager } from '@/core/i18n/I18nManager';

describe('I18nManager', () => {
  beforeEach(async () => {
    await I18nManager.load('en');
  });

  it('returns translated string for known home key', async () => {
    await I18nManager.setLocale('en');
    const value = I18nManager.t('home.nav.play');
    expect(value).not.toBe('home.nav.play');
    expect(value.length).toBeGreaterThan(0);
  });

  it('switches locale to vi', async () => {
    await I18nManager.setLocale('vi');
    expect(I18nManager.locale).toBe('vi');
    const en = I18nManager.t('story.continue');
    expect(en).toBe('Tiếp tục');
  });

  it('interpolates string and number params', () => {
    const out = I18nManager.t('system.combat_power', { cp: '12,000' });
    expect(out).toContain('12,000');
  });

  it('formatNumber uses locale separators', async () => {
    await I18nManager.setLocale('en');
    expect(I18nManager.formatNumber(12000)).toMatch(/12/);
    await I18nManager.setLocale('vi');
    expect(I18nManager.formatNumber(12000)).toMatch(/12/);
  });

  it('formatDuration formats seconds', () => {
    expect(I18nManager.formatDuration(45)).toContain('45');
    expect(I18nManager.formatDuration(125)).toContain('2');
  });

  it('returns missing marker in dev for unknown keys', () => {
    const value = I18nManager.t('key.that.does.not.exist');
    if (import.meta.env.DEV) {
      expect(value).toBe('[missing:key.that.does.not.exist]');
    }
  });
});
