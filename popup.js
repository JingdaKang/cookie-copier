// Cookie Copier — popup entry point.
//
// Reads the active tab's registrable domain, then lists that domain's cookies.
// Copying is wired up in a later step.

import { parseTabUrl } from "./domain.js";
import { getCookiesForDomain, toCookieHeader, toJson } from "./cookies.js";

// allCookies is the full fetch for the current domain and scope; currentCookies
// is the filtered subset currently shown, which the copy/download actions
// serialize. currentDomain is used to name the downloaded file.
let allCookies = [];
let currentCookies = [];
let currentDomain = "";

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

// Re-render the list from allCookies, applying the current name filter.
function applyFilter() {
  const query = filterQuery();
  const visible = query
    ? allCookies.filter((cookie) => cookie.name.toLowerCase().includes(query))
    : allCookies;
  renderCookies(visible);
}

function renderCookies(cookies) {
  const listEl = document.getElementById("cookie-list");
  const statusEl = document.getElementById("status");
  currentCookies = cookies;
  const empty = cookies.length === 0;
  document.getElementById("copy-header").disabled = empty;
  document.getElementById("copy-json").disabled = empty;
  document.getElementById("download-json").disabled = empty;
  listEl.replaceChildren();

  if (cookies.length === 0) {
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

    const name = document.createElement("span");
    name.className = "cookie-name";
    name.textContent = cookie.name;

    const value = document.createElement("span");
    value.className = "cookie-value";
    value.textContent = cookie.value;

    li.append(name, value);

    const flags = buildFlags(cookie);
    if (flags) li.append(flags);

    listEl.append(li);
  }

  const scopeNote = includeSubdomains() ? "" : " on the apex";
  statusEl.textContent = `${cookies.length} cookie${cookies.length === 1 ? "" : "s"}${scopeNote}.`;
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

// Serialize the current cookies with `serialize` and copy the result.
async function copyWith(serialize, successMessage) {
  try {
    await navigator.clipboard.writeText(serialize(currentCookies));
    flashStatus(successMessage);
  } catch (err) {
    document.getElementById("status").textContent = "Couldn't copy to the clipboard.";
    console.debug("clipboard write failed", err);
  }
}

// A safe-ish file name for the current domain, e.g. "cookies-example.com-2026-10-06.json".
function downloadFileName() {
  const safeDomain = (currentDomain || "cookies").replace(/[^a-z0-9.-]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `cookies-${safeDomain}-${date}.json`;
}

// Save the current cookies as a JSON file via a transient object URL. This
// uses a Blob download rather than the downloads API, so no extra permission
// is needed.
function downloadJson() {
  const blob = new Blob([toJson(currentCookies)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFileName();
  link.click();
  URL.revokeObjectURL(url);
  flashStatus("Saved cookies to a JSON file.");
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
    applyFilter();
  } catch (err) {
    statusEl.textContent = "Couldn't read cookies for the current tab.";
    console.debug("cookie read failed", err);
  }
}

async function init() {
  document
    .getElementById("copy-header")
    .addEventListener("click", () => copyWith(toCookieHeader, "Copied Cookie header to clipboard."));
  document
    .getElementById("copy-json")
    .addEventListener("click", () => copyWith(toJson, "Copied JSON to clipboard."));
  document.getElementById("download-json").addEventListener("click", downloadJson);
  document.getElementById("include-subdomains").addEventListener("change", load);
  document.getElementById("filter").addEventListener("input", applyFilter);

  const { domain } = parseTabUrl(await getActiveTabUrl());
  currentDomain = domain;
  renderDomain(domain);
  await load();
}

// Module scripts are deferred, so the DOM is parsed by the time this runs.
init();
