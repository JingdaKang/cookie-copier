// Persisted popup settings, backed by chrome.storage so choices survive across
// popup opens and sync across the user's Chrome profiles when available.

export const DEFAULT_SETTINGS = {
  includeSubdomains: true,
  sort: "name",
};

const VALID_SORTS = new Set(["name", "domain"]);
const STORAGE_KEY = "settings";

// Clamp arbitrary stored data down to known, valid settings. Pure, so the
// popup never trusts whatever happens to be in storage.
export function normalizeSettings(stored) {
  const source = stored && typeof stored === "object" ? stored : {};
  return {
    includeSubdomains:
      typeof source.includeSubdomains === "boolean"
        ? source.includeSubdomains
        : DEFAULT_SETTINGS.includeSubdomains,
    sort: VALID_SORTS.has(source.sort) ? source.sort : DEFAULT_SETTINGS.sort,
  };
}

// Prefer synced storage, fall back to local, tolerate neither being present.
// Read via globalThis so a missing `chrome` global resolves to undefined
// rather than throwing a ReferenceError (e.g. under tests).
function storageArea() {
  const api = globalThis.chrome;
  return api?.storage?.sync ?? api?.storage?.local ?? null;
}

export async function loadSettings() {
  const area = storageArea();
  if (!area) return { ...DEFAULT_SETTINGS };
  try {
    const data = await area.get(STORAGE_KEY);
    return normalizeSettings(data?.[STORAGE_KEY]);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch) {
  const area = storageArea();
  if (!area) return;
  const next = normalizeSettings({ ...(await loadSettings()), ...patch });
  try {
    await area.set({ [STORAGE_KEY]: next });
  } catch {
    // Settings are a convenience; a storage failure is non-fatal.
  }
}
