/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectSystemLocale, I18nManager, resolveLocale } from '@/core/i18n/I18nManager';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveLocale', () => {
  it('maps explicit preferences directly', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('vi')).toBe('vi');
  });

  it('maps system preference from navigator.language', () => {
    vi.stubGlobal('navigator', { language: 'vi-VN' });
    expect(resolveLocale('system')).toBe('vi');

    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(resolveLocale('system')).toBe('en');

    vi.stubGlobal('navigator', { language: 'ja-JP' });
    expect(resolveLocale('system')).toBe('en');
  });

  it('detectSystemLocale maps vi prefix to vi and others to en', () => {
    vi.stubGlobal('navigator', { language: 'vi' });
    expect(detectSystemLocale()).toBe('vi');

    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(detectSystemLocale()).toBe('en');
  });
});

describe('I18nManager locale preference', () => {
  it('loads resolved locale from system preference', async () => {
    vi.stubGlobal('navigator', { language: 'vi-VN' });
    await I18nManager.load('system');
    expect(I18nManager.locale).toBe('vi');
    expect(I18nManager.t('home.nav.play')).toBe('Chơi');
  });

  it('loads explicit en preference regardless of navigator', async () => {
    vi.stubGlobal('navigator', { language: 'vi-VN' });
    await I18nManager.load('en');
    expect(I18nManager.locale).toBe('en');
    expect(I18nManager.t('home.nav.play')).toBe('Play');
  });
});
