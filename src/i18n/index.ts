/** Small, typed localization boundary. English is the complete MVP fallback;
 * locale packs may override only keys that have been translated. */
export type SupportedLocale = 'id-ID' | 'en';
export const DEFAULT_LOCALE: SupportedLocale = 'id-ID';

export type LocalePack = Readonly<Record<string, string>>;

export function resolveLocale(value: string | null | undefined): SupportedLocale {
  return value?.toLowerCase().startsWith('id') ? 'id-ID' : 'en';
}

export function createTranslator(
  english: LocalePack,
  indonesian: Partial<LocalePack> = {},
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  return (key: string): string => {
    if (locale === 'id-ID' && indonesian[key]) return indonesian[key];
    return english[key] ?? key;
  };
}
