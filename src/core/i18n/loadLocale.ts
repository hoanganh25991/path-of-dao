import type { Locale } from '@/core/i18n/I18nManager';

/** Merges locale JSON shards (used by I18nManager + validators). */
export function mergeLocaleShards(
  shards: Record<string, string>[],
): Record<string, string> {
  return Object.assign({}, ...shards);
}

/** Runtime glob index — mirrors I18nManager eager load. */
export function getBundledLocaleStrings(locale: Locale): Record<string, string> {
  const modules = import.meta.glob('../../../content/locales/*/*.json', {
    eager: true,
    import: 'default',
  }) as Record<string, Record<string, string>>;

  const shards: Record<string, string>[] = [];
  for (const [path, strings] of Object.entries(modules)) {
    if (!path.includes(`/locales/${locale}/`)) continue;
    shards.push(strings);
  }
  return mergeLocaleShards(shards);
}
