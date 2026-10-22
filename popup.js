// Cookie Copier — popup entry point.
//
// Reads the active tab's registrable domain, then lists that domain's cookies.
// Copying is wired up in a later step.

import { parseTabUrl } from "./domain.js";
import { getCookiesForDomain, toCookieHeader, toJson, toCsv, formatExpiry } from "./cookies.js";
import { loadSettings, saveSettings } from "./settings.js";
import { Selection } from "./selection.js";

// allCookies is the full fetch for the current domain and scope; currentCookies
// is the filtered subset currently shown. currentDomain is used to name the
// downloaded file. selection tracks checked cookies for partial export.
let allCookies = [];
let currentCookies = [];
let currentDomain = "";
const selection = new Selection();

// The cookies an export acts on: the checked subset when any are checked,
// otherwise everything currently shown.
function exportCookies() {
  return selection.size > 0 ? selection.pick(allCookies) : currentCookies;
}

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

function renderDomain(domain) {
  document.getElementById("domain").textContent = domain || "—";
}

// A row of badges for a cookie's security flags, or null when it has none.
// SameSite "unspecified"/"no_restriction" are treated as no explicit flag.
function buildFlags(cookie) {
  const labels = [];
  if (cookie.secure) labels.push("Secure");
  if (cookie.httpOnly) labels.push("HttpOnly");
  if (cookie.sameSite === "lax") labels.push("SameSite=Lax");
  else if (cookie.sameSite === "strict") labels.push("SameSite=Strict");

  if (labels.length === 0) return null;

  const row = document.createElement("span");
  row.className = "cookie-flags";
  for (const label of labels) {
    const badge = document.createElement("span");
    badge.className = "flag";
    badge.textContent = label;
    row.append(badge);
  }
  return row;
}

function includeSubdomains() {
  return document.getElementById("include-subdomains").checked;
}

function filterQuery() {
  return document.getElementById("filter").value.trim().toLowerCase();
}

// Return a copy of `cookies` sorted by the selected key. Domain sort falls
// back to name so the order is stable within a domain.
function sortCookies(cookies) {
  const key = document.getElementById("sort").value;
  const sorted = [...cookies];
  if (key === "domain") {
    sorted.sort((a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

// Re-render the list from allCookies, applying the current name filter and sort.
function applyFilter() {
  const query = filterQuery();
  const visible = query
    ? allCookies.filter((cookie) => cookie.name.toLowerCase().includes(query))
    : allCookies;
  renderCookies(sortCookies(visible));
}

function renderCookies(cookies) {
  const listEl = document.getElementById("cookie-list");
  const statusEl = document.getElementById("status");
  currentCookies = cookies;
  const empty = cookies.length === 0;
  document.getElementById("copy-header").disabled = empty;
  document.getElementById("copy-json").disabled = empty;
  document.getElementById("download-json").disabled = empty;
  document.getElementById("download-csv").disabled = empty;
  listEl.replaceChildren();

  if (cookies.length === 0) {
    refreshSelectionUI();
    if (filterQuery()) {
      statusEl.textContent = "No cookies match the filter.";
    } else {
      const scopeNote = includeSubdomains() ? "" : " (apex only)";
      statusEl.textContent = `No cookies found for this domain${scopeNote}.`;
    }
    return;
  }

  for (const cookie of cookies) {
    const li = document.createElement("li");
    li.className = "cookie";

    const head = document.createElement("div");
    head.className = "cookie-head";

    const left = document.createElement("label");
    left.className = "cookie-head-left";

    const select = document.createElement("input");
    select.type = "checkbox";
    select.className = "cookie-select";
    select.checked = selection.has(cookie);
    select.addEventListener("change", () => {
      selection.toggle(cookie);
      refreshSelectionUI();
    });

    const name = document.createElement("span");
    name.className = "cookie-name";
    name.textContent = cookie.name;

    left.append(select, name);

    const copyValue = document.createElement("button");
    copyValue.type = "button";
    copyValue.className = "copy-value";
    copyValue.textContent = "Copy value";
    copyValue.addEventListener("click", () => copyCookieValue(cookie.value));

    head.append(left, copyValue);

    const value = document.createElement("span");
    value.className = "cookie-value";
    value.textContent = cookie.value;

    const meta = document.createElement("span");
    meta.className = "cookie-meta";
    meta.textContent = `${cookie.path} · ${formatExpiry(cookie)}`;

    li.append(head, value, meta);

    const flags = buildFlags(cookie);
    if (flags) li.append(flags);

    listEl.append(li);
  }

  refreshSelectionUI();
  const scopeNote = includeSubdomains() ? "" : " on the apex";
  statusEl.textContent = `${cookies.length} cookie${cookies.length === 1 ? "" : "s"}${scopeNote}.`;
}

// Sync the select-all checkbox and the selected-count label to the current
// selection and visible list.
function refreshSelectionUI() {
  const selectAll = document.getElementById("select-all");
  selectAll.disabled = currentCookies.length === 0;
  selectAll.checked = selection.allSelected(currentCookies);
  const count = document.getElementById("selected-count");
  count.textContent =
    selection.size > 0 ? `${selection.size} selected · exports use selection` : "";
}

// Briefly replace the status line, then restore it.
function flashStatus(message) {
  const statusEl = document.getElementById("status");
  const previous = statusEl.textContent;
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = previous;
  }, 1500);
}

// Copy a single cookie's value to the clipboard.
async function copyCookieValue(value) {
  try {
    await navigator.clipboard.writeText(value);
    flashStatus("Copied cookie value to clipboard.");
  } catch (err) {
    document.getElementById("status").textContent = "Couldn't copy to the clipboard.";
    console.debug("clipboard write failed", err);
  }
}

// Serialize the export set with `serialize` and copy the result.
async function copyWith(serialize, successMessage) {
  try {
    await navigator.clipboard.writeText(serialize(exportCookies()));
    flashStatus(successMessage);
  } catch (err) {
    document.getElementById("status").textContent = "Couldn't copy to the clipboard.";
    console.debug("clipboard write failed", err);
  }
}

// A safe-ish file name for the current domain, e.g. "cookies-example.com-2026-10-06.json".
function downloadFileName(extension) {
  const safeDomain = (currentDomain || "cookies").replace(/[^a-z0-9.-]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `cookies-${safeDomain}-${date}.${extension}`;
}

// Save text as a file via a transient object URL. This uses a Blob download
// rather than the downloads API, so no extra permission is needed.
function downloadBlob(text, mimeType, extension, successMessage) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFileName(extension);
  link.click();
  URL.revokeObjectURL(url);
  flashStatus(successMessage);
}

function downloadJson() {
  downloadBlob(
    toJson(exportCookies()),
    "application/json",
    "json",
    "Saved cookies to a JSON file.",
  );
}

function downloadCsv() {
  downloadBlob(toCsv(exportCookies()), "text/csv", "csv", "Saved cookies to a CSV file.");
}

// Fetch and render cookies for the current domain at the selected scope.
async function load() {
  const statusEl = document.getElementById("status");
  if (!currentDomain) {
    statusEl.textContent = "Open a normal web page (http or https) to see its cookies.";
    return;
  }
  try {
    allCookies = await getCookiesForDomain(currentDomain, {
      includeSubdomains: includeSubdomains(),
    });
    selection.retain(allCookies);
    applyFilter();
  } catch (err) {
    statusEl.textContent = "Couldn't read cookies for the current tab.";
    console.debug("cookie read failed", err);
  }
}

async function init() {
  document
    .getElementById("copy-header")
    .addEventListener("click", () =>
      copyWith(toCookieHeader, "Copied Cookie header to clipboard."),
    );
  document
    .getElementById("copy-json")
    .addEventListener("click", () => copyWith(toJson, "Copied JSON to clipboard."));
  document.getElementById("download-json").addEventListener("click", downloadJson);
  document.getElementById("download-csv").addEventListener("click", downloadCsv);
  document.getElementById("include-subdomains").addEventListener("change", () => {
    saveSettings({ includeSubdomains: includeSubdomains() });
    load();
  });
  document.getElementById("filter").addEventListener("input", applyFilter);
  document.getElementById("sort").addEventListener("change", () => {
    saveSettings({ sort: document.getElementById("sort").value });
    applyFilter();
  });
  document.getElementById("refresh").addEventListener("click", load);
  document.getElementById("select-all").addEventListener("change", (event) => {
    selection.setAll(currentCookies, event.target.checked);
    applyFilter();
  });

  // Restore persisted settings before the first load so the fetch uses them.
  const settings = await loadSettings();
  document.getElementById("include-subdomains").checked = settings.includeSubdomains;
  document.getElementById("sort").value = settings.sort;

  const { domain } = parseTabUrl(await getActiveTabUrl());
  currentDomain = domain;
  renderDomain(domain);
  await load();
}

// Module scripts are deferred, so the DOM is parsed by the time this runs.
init();
