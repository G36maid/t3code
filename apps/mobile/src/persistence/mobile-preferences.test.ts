import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { vi } from "vite-plus/test";

vi.mock("expo-secure-store", () => ({}));

import * as MobileDatabase from "./mobile-database";
import * as MobilePreferences from "./mobile-preferences";
import * as MobileSecureStorage from "./mobile-secure-storage";

function loadPreferencesFrom(storedPayload: string) {
  const database = Layer.succeed(
    MobileDatabase.MobileDatabase,
    MobileDatabase.MobileDatabase.of({
      loadCache: () => Effect.succeedNone,
      listCache: () => Effect.succeed([]),
      saveCache: () => Effect.void,
      removeCache: () => Effect.void,
      clearCacheKind: () => Effect.void,
      clearEnvironmentCache: () => Effect.void,
      clearAllCaches: Effect.void,
      inspectCaches: Effect.succeed([]),
      loadPreferencesJson: Effect.succeedSome({ payload: storedPayload, updatedAt: 1 }),
      savePreferencesJson: () => Effect.void,
    }),
  );
  const secureStorage = Layer.succeed(
    MobileSecureStorage.MobileSecureStorage,
    MobileSecureStorage.MobileSecureStorage.of({
      getItem: () => Effect.succeed(null),
      setItem: () => Effect.void,
      removeItem: () => Effect.void,
    }),
  );
  return Effect.gen(function* () {
    const store = yield* MobilePreferences.MobilePreferencesStore;
    return yield* store.load;
  }).pipe(
    Effect.provide(
      MobilePreferences.layer.pipe(Layer.provide(Layer.merge(database, secureStorage))),
    ),
  );
}

describe("MobilePreferencesStore language migration", () => {
  it.effect("migrates legacy zh to zh-CN while preserving other language values", () =>
    Effect.gen(function* () {
      expect((yield* loadPreferencesFrom(JSON.stringify({ language: "zh" }))).language).toBe(
        "zh-CN",
      );
      expect((yield* loadPreferencesFrom(JSON.stringify({ language: "zh-TW" }))).language).toBe(
        "zh-TW",
      );
    }),
  );
});
