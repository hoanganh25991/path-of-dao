import { getBundledLocaleStrings } from '@/core/i18n/loadLocale';

export type Locale = 'en' | 'vi';
export type LocalePreference = 'system' | Locale;

/** Map browser language to a supported locale — vi → vi, everything else → en. */
export function detectSystemLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi')) {
    return 'vi';
  }
  return 'en';
}

export function resolveLocale(preference: LocalePreference): Locale {
  if (preference === 'system') return detectSystemLocale();
  return preference;
}

/** Lightweight string loader with formatting helpers (sub-plan 24). */
export class I18nManager {
  private static activeLocale: Locale = 'en';
  private static strings: Record<string, string> = getBundledLocaleStrings('en');

  static async load(preference: LocalePreference): Promise<void> {
    const locale = resolveLocale(preference);
    I18nManager.activeLocale = locale;
    I18nManager.strings = getBundledLocaleStrings(locale);
    if (Object.keys(I18nManager.strings).length === 0) {
      I18nManager.strings = getBundledLocaleStrings('en');
    }
  }

  /** Set an explicit locale (en/vi). */
  static async setLocale(locale: Locale): Promise<void> {
    await I18nManager.load(locale);
  }

  static get locale(): Locale {
    return I18nManager.activeLocale;
  }

  static t(key: string, params?: Record<string, string | number>): string {
    let value = I18nManager.strings[key];
    if (value === undefined) {
      return import.meta.env.DEV ? `[missing:${key}]` : key;
    }
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  static formatNumber(value: number): string {
    const localeTag = I18nManager.activeLocale === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(localeTag).format(value);
  }

  static formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes > 0) {
      return I18nManager.t('system.duration.minutes', { m: minutes, s: remainder });
    }
    return I18nManager.t('system.duration.seconds', { s: seconds });
  }
}
