// Cookie Copier — popup entry point.
//
// Reads the active tab's registrable domain, then lists that domain's cookies.
// Copying is wired up in a later step.

import { parseTabUrl } from "./domain.js";
import { getCookiesForDomain, toCookieHeader, toJson } from "./cookies.js";

// Cookies for the active domain, kept so the copy button can serialize them.
let currentCookies = [];

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

function renderCookies(cookies) {
  const listEl = document.getElementById("cookie-list");
  const statusEl = document.getElementById("status");
  currentCookies = cookies;
  const empty = cookies.length === 0;
  document.getElementById("copy-header").disabled = empty;
  document.getElementById("copy-json").disabled = empty;
  listEl.replaceChildren();

  if (cookies.length === 0) {
    statusEl.textContent = "No cookies found for this domain.";
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

  statusEl.textContent = `${cookies.length} cookie${cookies.length === 1 ? "" : "s"}.`;
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

async function init() {
  const statusEl = document.getElementById("status");
  document
    .getElementById("copy-header")
    .addEventListener("click", () => copyWith(toCookieHeader, "Copied Cookie header to clipboard."));
  document
    .getElementById("copy-json")
    .addEventListener("click", () => copyWith(toJson, "Copied JSON to clipboard."));
  try {
    const { domain } = parseTabUrl(await getActiveTabUrl());
    renderDomain(domain);
    if (!domain) {
      statusEl.textContent = "Open a normal web page (http or https) to see its cookies.";
      return;
    }
    renderCookies(await getCookiesForDomain(domain));
  } catch (err) {
    statusEl.textContent = "Couldn't read cookies for the current tab.";
    console.debug("cookie read failed", err);
  }
}

// Module scripts are deferred, so the DOM is parsed by the time this runs.
init();
