export type Locale = 'en' | 'vi';

const localeModules = import.meta.glob('../../../content/locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;

function indexLocales(): Map<Locale, Record<string, string>> {
  const map = new Map<Locale, Record<string, string>>();
  for (const [path, strings] of Object.entries(localeModules)) {
    const match = path.match(/locales\/(en|vi)\//);
    if (!match) continue;
    const locale = match[1] as Locale;
    map.set(locale, { ...(map.get(locale) ?? {}), ...strings });
  }
  return map;
}

const localeIndex = indexLocales();

/** Lightweight string loader — full i18n pass in sub-plan 24. */
export class I18nManager {
  private static activeLocale: Locale = 'en';
  private static strings: Record<string, string> = localeIndex.get('en') ?? {};

  static async load(locale: Locale): Promise<void> {
    I18nManager.activeLocale = locale;
    I18nManager.strings = localeIndex.get(locale) ?? localeIndex.get('en') ?? {};
  }

  static get locale(): Locale {
    return I18nManager.activeLocale;
  }

  static t(key: string, params?: Record<string, string>): string {
    let value = I18nManager.strings[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, replacement);
      }
    }
    return value;
  }
}
