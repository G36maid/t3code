export const SYSTEM_LANGUAGE = "system";

// Shown in their own language so a user can find theirs from any UI language.
const NATIVE_LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
  sv: "Svenska",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

export function nativeLanguageName(locale: string): string {
  return NATIVE_LANGUAGE_NAMES[locale] ?? locale;
}

const LEGACY_LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  zh: "zh-CN",
};

/** Maps retired saved language codes (such as `"zh"` before the `zh-CN`/`zh-TW` split) to their replacement. */
export function normalizeLanguageSetting(language: string): string {
  return LEGACY_LANGUAGE_ALIASES[language] ?? language;
}

// Traditional Chinese tags prefer their exact locale and otherwise fall back to zh-TW;
// other Chinese tags (bare `zh`, `zh-Hans`, `zh-SG`, …) prefer zh-CN regardless of supported order.
const TRADITIONAL_CHINESE = /^zh-(hant|tw|hk|mo)\b/;

function matchSupportedLocale(tag: string, supported: ReadonlyArray<string>): string | undefined {
  const normalized = tag.trim().toLowerCase().replaceAll("_", "-");
  const language = normalized.split("-")[0];
  if (!language) return undefined;
  const exact = supported.find((locale) => locale.toLowerCase() === normalized);
  if (exact) return exact;
  if (TRADITIONAL_CHINESE.test(normalized)) {
    return supported.find((locale) => locale.toLowerCase() === "zh-tw");
  }
  if (language === "zh") {
    return (
      supported.find((locale) => locale.toLowerCase() === "zh-cn") ??
      supported.find((locale) => locale.toLowerCase() === "zh")
    );
  }
  return supported.find((locale) => locale.toLowerCase().split("-")[0] === language);
}

/** Saved setting to active locale; "system" and unknown values follow the host's languages. */
export function resolveLocale(
  language: string,
  systemLocales: ReadonlyArray<string>,
  supported: ReadonlyArray<string>,
  fallback: string,
): string {
  return resolveLocaleSelection(language, systemLocales, supported, fallback).catalogLocale;
}

/** Keep the matching system tag for regional formats while loading a supported catalog. */
export function resolveLocaleSelection(
  language: string,
  systemLocales: ReadonlyArray<string>,
  supported: ReadonlyArray<string>,
  fallback: string,
): { readonly catalogLocale: string; readonly formattingLocale: string } {
  const explicit = supported.includes(language) ? language : normalizeLanguageSetting(language);
  if (supported.includes(explicit)) return { catalogLocale: explicit, formattingLocale: explicit };
  for (const tag of systemLocales) {
    const match = matchSupportedLocale(tag, supported);
    if (match) return { catalogLocale: match, formattingLocale: tag.trim().replaceAll("_", "-") };
  }
  return { catalogLocale: fallback, formattingLocale: fallback };
}
