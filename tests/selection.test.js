import test from "node:test";
import assert from "node:assert/strict";

import { cookieKey, Selection } from "../selection.js";

const a = { name: "a", domain: "example.com", path: "/" };
const b = { name: "b", domain: "example.com", path: "/" };
const c = { name: "c", domain: "api.example.com", path: "/app" };

test("cookieKey distinguishes name, domain, and path", () => {
  assert.notEqual(cookieKey(a), cookieKey(b));
  assert.equal(cookieKey(a), cookieKey({ name: "a", domain: "example.com", path: "/" }));
  assert.notEqual(
    cookieKey({ name: "x", domain: "example.com", path: "/" }),
    cookieKey({ name: "x", domain: "example.com", path: "/app" }),
  );
});

test("toggle flips membership and reports the new state", () => {
  const selection = new Selection();
  assert.equal(selection.toggle(a), true);
  assert.equal(selection.has(a), true);
  assert.equal(selection.toggle(a), false);
  assert.equal(selection.has(a), false);
});

test("setAll selects and deselects a whole list", () => {
  const selection = new Selection();
  selection.setAll([a, b, c], true);
  assert.equal(selection.size, 3);
  selection.setAll([a, b], false);
  assert.equal(selection.size, 1);
  assert.equal(selection.has(c), true);
});

test("allSelected is true only when every cookie is selected", () => {
  const selection = new Selection();
  assert.equal(selection.allSelected([]), false);
  selection.setAll([a, b], true);
  assert.equal(selection.allSelected([a, b]), true);
  assert.equal(selection.allSelected([a, b, c]), false);
});

test("pick returns the selected subset in input order", () => {
  const selection = new Selection();
  selection.setAll([a, c], true);
  assert.deepEqual(selection.pick([a, b, c]), [a, c]);
});

test("retain drops keys absent from the given cookies", () => {
  const selection = new Selection();
  selection.setAll([a, b, c], true);
  selection.retain([a, c]);
  assert.equal(selection.size, 2);
  assert.equal(selection.has(b), false);
});
