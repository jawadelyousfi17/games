import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

/**
 * Supported UI locales. Add new ones by importing the matching messages/{locale}.json.
 */
export type Locale = "en" | "fr";

const dictionaries = { en, fr } as const;

/**
 * Default locale used when none is provided.
 * Kept simple: pages can pass `getMessages('fr')` later when locale routing lands.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Returns the full message dictionary for a locale.
 * Falls back to the default locale when an unknown key is provided.
 */
export function getMessages(locale: Locale = DEFAULT_LOCALE) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Resolves a dotted message key (e.g. "hero.title1") against a locale dictionary.
 * Returns the key itself if no match is found, so missing strings stay visible.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = getMessages(locale) as unknown as Record<string, unknown>;
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as object)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : key;
}
