import { normalizeLanguageSetting, resolveLocale } from "@t3tools/client-runtime/locales";

import gtConfig from "../../gt.config.json";

export const DEFAULT_LOCALE = gtConfig.defaultLocale;
export const SUPPORTED_LOCALES: ReadonlyArray<string> = [DEFAULT_LOCALE, ...gtConfig.locales];

export function resolveWebLocaleSelection(language: string, browserLocales: ReadonlyArray<string>) {
  const normalized = normalizeLanguageSetting(language);
  const catalogLocale = resolveLocale(
    normalized,
    browserLocales,
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
  );
  // Undefined formats with the host locale: "system", and English over a regional English browser.
  const keepEnglishRegion =
    normalized === DEFAULT_LOCALE && /^en(?:-|$)/i.test(browserLocales[0] ?? "");
  const formattingLocale =
    normalized === catalogLocale && !keepEnglishRegion ? normalized : undefined;
  return { catalogLocale, formattingLocale };
}
