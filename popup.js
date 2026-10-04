// Cookie Copier — popup entry point.
//
// Reads the active tab's registrable domain, then lists that domain's cookies.
// Copying is wired up in a later step.

import { parseTabUrl } from "./domain.js";
import { getCookiesForDomain } from "./cookies.js";

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

async function init() {
  const statusEl = document.getElementById("status");
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
