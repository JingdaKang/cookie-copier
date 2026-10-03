// Cookie Copier — popup entry point.
//
// Shows the domain of the active tab. Later steps list that domain's cookies
// and copy them as a Cookie header or JSON.

import { parseTabUrl } from "./domain.js";

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

function render({ host, domain }) {
  const domainEl = document.getElementById("domain");
  const statusEl = document.getElementById("status");
  if (!domain) {
    domainEl.textContent = "—";
    statusEl.textContent = "Open a normal web page (http or https) to see its cookies.";
    return;
  }
  domainEl.textContent = domain;
  statusEl.textContent =
    host === domain
      ? "Cookie listing arrives in the next update."
      : `Scoped to ${domain} · page host ${host}.`;
}

async function init() {
  try {
    render(parseTabUrl(await getActiveTabUrl()));
  } catch (err) {
    document.getElementById("status").textContent = "Couldn't read the current tab.";
    console.debug("active tab read failed", err);
  }
}

// Module scripts are deferred, so the DOM is parsed by the time this runs.
init();
