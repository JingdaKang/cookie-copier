// Integration tests for the popup's DOM wiring. They load the real popup.html
// into jsdom, stub the chrome.* and clipboard APIs, import popup.js (which runs
// init on load), and drive the UI the way a user would.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = readFileSync(join(ROOT, "popup.html"), "utf8");

let runId = 0;

function cookie(name, { value = name, domain = "example.com", path = "/", ...rest } = {}) {
  return { name, value, domain, path, secure: false, httpOnly: false, session: true, ...rest };
}

async function waitFor(predicate, { timeout = 2000, step = 5 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, step));
  }
  throw new Error("waitFor timed out");
}

// Boot a fresh popup instance against stubbed APIs and the given fixtures.
async function openPopup({ cookies = [], tabUrl = "https://www.example.com/", settings } = {}) {
  const dom = new JSDOM(HTML, { url: "https://localhost/" });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;

  const clipboardWrites = [];
  // globalThis.navigator is a getter-only property in Node, so redefine it.
  Object.defineProperty(globalThis, "navigator", {
    value: { clipboard: { writeText: async (text) => clipboardWrites.push(text) } },
    configurable: true,
    writable: true,
  });

  globalThis.Blob = window.Blob ?? globalThis.Blob;
  globalThis.URL = window.URL ?? globalThis.URL;
  globalThis.URL.createObjectURL = () => "blob:mock";
  globalThis.URL.revokeObjectURL = () => {};

  const store = settings ? { settings } : {};
  let getAllCalls = 0;
  globalThis.chrome = {
    tabs: { query: async () => [{ url: tabUrl }] },
    cookies: {
      getAll: async () => {
        getAllCalls += 1;
        return cookies;
      },
    },
    storage: {
      sync: {
        get: async (key) => (key in store ? { [key]: store[key] } : {}),
        set: async (obj) => {
          Object.assign(store, obj);
        },
      },
    },
  };

  await import(`../popup.js?run=${runId++}`);
  // Wait until the initial load has replaced the "Loading…" placeholder.
  await waitFor(() => window.document.getElementById("status").textContent !== "Loading cookies…");

  const $ = (id) => window.document.getElementById(id);
  const names = () =>
    [...$("cookie-list").querySelectorAll(".cookie-name")].map((el) => el.textContent);
  return {
    window,
    document: window.document,
    $,
    names,
    clipboardWrites,
    store,
    getAll: () => getAllCalls,
  };
}

test("renders the active domain's cookies sorted by name with a count", async () => {
  const { $, names } = await openPopup({ cookies: [cookie("b"), cookie("a")] });
  await waitFor(() => $("cookie-list").children.length === 2);
  assert.deepEqual(names(), ["a", "b"]);
  assert.match($("status").textContent, /2 cookies/);
  assert.equal($("domain").textContent, "example.com");
});

test("filters the list by name as the user types", async () => {
  const { $, names } = await openPopup({
    cookies: [cookie("alpha"), cookie("beta"), cookie("gamma")],
  });
  await waitFor(() => $("cookie-list").children.length === 3);

  const filter = $("filter");
  filter.value = "a";
  filter.dispatchEvent(new globalThis.window.Event("input"));
  assert.deepEqual(
    names(),
    ["alpha", "beta", "gamma"].filter((n) => n.includes("a")),
  );

  filter.value = "gam";
  filter.dispatchEvent(new globalThis.window.Event("input"));
  assert.deepEqual(names(), ["gamma"]);
});

test("sorting by domain reorders and persists the choice", async () => {
  const { $, names, store } = await openPopup({
    cookies: [cookie("z", { domain: "a.example.com" }), cookie("a", { domain: "b.example.com" })],
  });
  await waitFor(() => $("cookie-list").children.length === 2);
  assert.deepEqual(names(), ["a", "z"]); // default: by name

  const sort = $("sort");
  sort.value = "domain";
  sort.dispatchEvent(new globalThis.window.Event("change"));

  assert.deepEqual(names(), ["z", "a"]); // a.example.com before b.example.com
  await waitFor(() => store.settings?.sort === "domain");
});

test("unchecking subdomains refetches, narrows to the apex, and persists", async () => {
  const { $, names, store, getAll } = await openPopup({
    cookies: [
      cookie("apex", { domain: "example.com" }),
      cookie("sub", { domain: "api.example.com" }),
    ],
  });
  await waitFor(() => $("cookie-list").children.length === 2);
  const callsBefore = getAll();

  const toggle = $("include-subdomains");
  toggle.checked = false;
  toggle.dispatchEvent(new globalThis.window.Event("change"));

  await waitFor(() => $("cookie-list").children.length === 1);
  assert.deepEqual(names(), ["apex"]);
  assert.ok(getAll() > callsBefore, "expected a refetch");
  await waitFor(() => store.settings?.includeSubdomains === false);
});

test("exports only the selected cookies when any are checked", async () => {
  const { $, clipboardWrites } = await openPopup({
    cookies: [
      cookie("a", { value: "1" }),
      cookie("b", { value: "2" }),
      cookie("c", { value: "3" }),
    ],
  });
  await waitFor(() => $("cookie-list").children.length === 3);

  const firstCheckbox = $("cookie-list").querySelector(".cookie-select");
  firstCheckbox.checked = true;
  firstCheckbox.dispatchEvent(new globalThis.window.Event("change"));
  assert.match($("selected-count").textContent, /1 selected/);

  $("copy-header").dispatchEvent(new globalThis.window.Event("click"));
  await waitFor(() => clipboardWrites.length === 1);
  assert.equal(clipboardWrites.at(-1), "a=1");
});

test("select-all selects every shown cookie and exports them all", async () => {
  const { $, clipboardWrites } = await openPopup({
    cookies: [cookie("a", { value: "1" }), cookie("b", { value: "2" })],
  });
  await waitFor(() => $("cookie-list").children.length === 2);

  const selectAll = $("select-all");
  selectAll.checked = true;
  selectAll.dispatchEvent(new globalThis.window.Event("change"));
  assert.match($("selected-count").textContent, /2 selected/);

  $("copy-header").dispatchEvent(new globalThis.window.Event("click"));
  await waitFor(() => clipboardWrites.length === 1);
  assert.equal(clipboardWrites.at(-1), "a=1; b=2");
});

test("restores persisted settings on open", async () => {
  const { $ } = await openPopup({
    cookies: [cookie("z", { domain: "a.example.com" }), cookie("a", { domain: "b.example.com" })],
    settings: { includeSubdomains: false, sort: "domain" },
  });
  await waitFor(() => $("status").textContent !== "");
  assert.equal($("include-subdomains").checked, false);
  assert.equal($("sort").value, "domain");
  // apex-only scope keeps neither subdomain cookie here, so the list is empty.
  assert.equal($("cookie-list").children.length, 0);
  assert.match($("status").textContent, /No cookies/);
});
