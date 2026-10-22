import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_SETTINGS, normalizeSettings, loadSettings, saveSettings } from "../settings.js";

// In-memory stand-in for chrome.storage.sync.
function stubStorage(initial = {}) {
  const store = { ...initial };
  globalThis.chrome = {
    storage: {
      sync: {
        get: async (key) => (key in store ? { [key]: store[key] } : {}),
        set: async (obj) => {
          Object.assign(store, obj);
        },
      },
    },
  };
  return store;
}

test("normalizeSettings falls back to defaults for junk input", () => {
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings("nope"), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
});

test("normalizeSettings keeps valid values and rejects invalid ones", () => {
  assert.deepEqual(normalizeSettings({ includeSubdomains: false, sort: "domain" }), {
    includeSubdomains: false,
    sort: "domain",
  });
  assert.deepEqual(normalizeSettings({ includeSubdomains: "yes", sort: "size" }), DEFAULT_SETTINGS);
});

test("loadSettings returns defaults when storage is unavailable", async () => {
  delete globalThis.chrome;
  assert.deepEqual(await loadSettings(), DEFAULT_SETTINGS);
});

test("loadSettings reads and normalizes the stored value", async () => {
  stubStorage({ settings: { includeSubdomains: false, sort: "domain" } });
  assert.deepEqual(await loadSettings(), { includeSubdomains: false, sort: "domain" });
});

test("saveSettings merges a patch and persists normalized settings", async () => {
  const store = stubStorage({ settings: { includeSubdomains: true, sort: "name" } });
  await saveSettings({ sort: "domain" });
  assert.deepEqual(store.settings, { includeSubdomains: true, sort: "domain" });
});

test("saveSettings is a no-op without storage", async () => {
  delete globalThis.chrome;
  await assert.doesNotReject(saveSettings({ sort: "domain" }));
});
