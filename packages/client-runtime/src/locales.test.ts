import { describe, expect, it } from "vite-plus/test";

import { normalizeLanguageSetting, resolveLocaleSelection } from "./locales.ts";

const SUPPORTED = ["en", "de", "es", "fr", "ja", "ko", "pt-BR", "ru", "sv", "zh-CN", "zh-TW"];
const SUPPORTED_TW_FIRST = ["en", "zh-TW", "zh-CN"];

describe("normalizeLanguageSetting", () => {
  it("maps legacy zh to zh-CN and preserves other values", () => {
    expect(normalizeLanguageSetting("zh")).toBe("zh-CN");
    expect(normalizeLanguageSetting("zh-TW")).toBe("zh-TW");
    expect(normalizeLanguageSetting("system")).toBe("system");
  });
});

describe("resolveLocaleSelection", () => {
  it.each([
    { tag: "zh-TW", catalog: "zh-TW" },
    { tag: "zh_CN", catalog: "zh-CN" },
  ])("matches the regional Chinese tag $tag exactly", (test) => {
    expect(resolveLocaleSelection("system", [test.tag, "en"], SUPPORTED, "en")).toEqual({
      catalogLocale: test.catalog,
      formattingLocale: test.tag.replace("_", "-"),
    });
  });

  it.each(["zh-Hant", "zh-Hant-TW", "zh-HK", "zh_MO"])(
    "falls back from $tag to the zh-TW catalog",
    (tag) => {
      expect(resolveLocaleSelection("system", [tag, "en"], SUPPORTED, "en").catalogLocale).toBe(
        "zh-TW",
      );
    },
  );

  it.each(["zh", "zh-Hans", "zh-Hans-CN", "zh-SG", "zh-Hans-TW"])(
    "maps $tag to zh-CN regardless of supported locale order",
    (tag) => {
      expect(resolveLocaleSelection("system", [tag, "en"], SUPPORTED, "en").catalogLocale).toBe(
        "zh-CN",
      );
      expect(
        resolveLocaleSelection("system", [tag, "en"], SUPPORTED_TW_FIRST, "en").catalogLocale,
      ).toBe("zh-CN");
    },
  );

  it("migrates an explicit legacy zh setting to zh-CN instead of falling back to system locales", () => {
    expect(resolveLocaleSelection("zh", ["en-US"], SUPPORTED, "en")).toEqual({
      catalogLocale: "zh-CN",
      formattingLocale: "zh-CN",
    });
    expect(resolveLocaleSelection("zh", ["zh-TW"], SUPPORTED, "en")).toEqual({
      catalogLocale: "zh-CN",
      formattingLocale: "zh-CN",
    });
  });

  it.each(["pt", "pt-PT"])("matches regional fallback %s to pt-BR", (tag) => {
    expect(resolveLocaleSelection("system", [tag, "en"], SUPPORTED, "en").catalogLocale).toBe(
      "pt-BR",
    );
  });

  it("falls back to bare zh for Simplified Chinese tags when zh-CN is not in supported", () => {
    expect(
      resolveLocaleSelection("system", ["zh-CN", "en"], ["en", "zh"], "en").catalogLocale,
    ).toBe("zh");
    expect(
      resolveLocaleSelection("system", ["zh-Hans", "en"], ["en", "zh"], "en").catalogLocale,
    ).toBe("zh");
    expect(
      resolveLocaleSelection("system", ["zh-Hans", "en"], ["en", "zh", "zh-CN"], "en")
        .catalogLocale,
    ).toBe("zh-CN");
    expect(
      resolveLocaleSelection("system", ["zh-TW", "en"], ["en", "zh"], "en").catalogLocale,
    ).toBe("en");
  });

  it("falls back to the default locale when no system language is supported", () => {
    expect(resolveLocaleSelection("system", ["", "fi-FI", "nl"], SUPPORTED, "en")).toEqual({
      catalogLocale: "en",
      formattingLocale: "en",
    });
  });
});
