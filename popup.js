// Cookie Copier — popup entry point.
//
// Reads the active tab's registrable domain, then lists that domain's cookies.
// Copying is wired up in a later step.

import { parseTabUrl } from "./domain.js";
import { getCookiesForDomain, toCookieHeader } from "./cookies.js";

// Cookies for the active domain, kept so the copy button can serialize them.
let currentCookies = [];

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

function renderDomain(domain) {
  document.getElementById("domain").textContent = domain || "—";
}

function renderCookies(cookies) {
  const listEl = document.getElementById("cookie-list");
  const statusEl = document.getElementById("status");
  const copyBtn = document.getElementById("copy-header");
  currentCookies = cookies;
  copyBtn.disabled = cookies.length === 0;
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
    listEl.append(li);
  }

  statusEl.textContent = `${cookies.length} cookie${cookies.length === 1 ? "" : "s"}.`;
}

async function copyHeader() {
  const statusEl = document.getElementById("status");
  try {
    await navigator.clipboard.writeText(toCookieHeader(currentCookies));
    const previous = statusEl.textContent;
    statusEl.textContent = "Copied Cookie header to clipboard.";
    setTimeout(() => {
      statusEl.textContent = previous;
    }, 1500);
  } catch (err) {
    statusEl.textContent = "Couldn't copy to the clipboard.";
    console.debug("clipboard write failed", err);
  }
}

async function init() {
  const statusEl = document.getElementById("status");
  document.getElementById("copy-header").addEventListener("click", copyHeader);
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
