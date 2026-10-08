import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesScope,
  getCookiesForDomain,
  toCookieHeader,
  toExportObject,
  toJson,
  toCsv,
} from "../cookies.js";

const fixtures = [
  { name: "z_apex", value: "1", domain: "example.com" },
  { name: "a_dotapex", value: "2", domain: ".example.com" },
  { name: "m_www", value: "3", domain: "www.example.com" },
  { name: "b_api", value: "4", domain: "api.example.com" },
  { name: "x_other", value: "5", domain: "notexample.com" },
];

// Install a fake chrome.cookies.getAll that ignores its filter and returns the
// fixtures, so getCookiesForDomain's own scope filtering is what's under test.
function stubChrome(cookies = fixtures) {
  globalThis.chrome = { cookies: { getAll: async () => cookies } };
}

test("matchesScope matches apex and subdomains, excludes lookalikes", () => {
  assert.equal(matchesScope("example.com", "example.com", true), true);
  assert.equal(matchesScope(".example.com", "example.com", true), true);
  assert.equal(matchesScope("api.example.com", "example.com", true), true);
  assert.equal(matchesScope("notexample.com", "example.com", true), false);
});

test("matchesScope on apex-only keeps just the exact apex", () => {
  assert.equal(matchesScope("example.com", "example.com", false), true);
  assert.equal(matchesScope(".example.com", "example.com", false), true);
  assert.equal(matchesScope("api.example.com", "example.com", false), false);
});

test("getCookiesForDomain includes subdomains by default, sorted by name", async () => {
  stubChrome();
  const cookies = await getCookiesForDomain("example.com");
  assert.deepEqual(
    cookies.map((c) => c.name),
    ["a_dotapex", "b_api", "m_www", "z_apex"],
  );
});

test("getCookiesForDomain apex-only drops subdomain cookies", async () => {
  stubChrome();
  const cookies = await getCookiesForDomain("example.com", { includeSubdomains: false });
  assert.deepEqual(
    cookies.map((c) => c.name),
    ["a_dotapex", "z_apex"],
  );
});

test("getCookiesForDomain returns empty for a missing domain", async () => {
  delete globalThis.chrome;
  assert.deepEqual(await getCookiesForDomain(""), []);
});

test("toCookieHeader joins name=value pairs", () => {
  assert.equal(
    toCookieHeader([
      { name: "a", value: "1" },
      { name: "b", value: "2" },
    ]),
    "a=1; b=2",
  );
});

test("toExportObject keeps export fields and normalizes expirationDate", () => {
  const exported = toExportObject({
    name: "sid",
    value: "abc",
    domain: "example.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    session: false,
    hostOnly: true,
  });
  assert.deepEqual(exported, {
    name: "sid",
    value: "abc",
    domain: "example.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    session: false,
    expirationDate: null,
  });
  assert.equal("hostOnly" in exported, false);
});

test("toJson emits a pretty-printed array", () => {
  const json = toJson([{ name: "a", value: "1" }]);
  assert.ok(json.includes("\n"));
  const parsed = JSON.parse(json);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "a");
});

test("toCsv emits a header row and the expected columns", () => {
  const csv = toCsv([
    {
      name: "sid",
      value: "ok",
      domain: "example.com",
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "lax",
      session: true,
    },
  ]);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], "name,value,domain,path,secure,httpOnly,sameSite,session,expirationDate");
  assert.equal(lines[1], "sid,ok,example.com,/,true,false,lax,true,");
});

test("toCsv quotes fields with commas, quotes, or newlines", () => {
  const csv = toCsv([
    {
      name: "weird",
      value: 'a,b"c\nd',
      domain: "example.com",
      path: "/",
      secure: false,
      httpOnly: true,
      sameSite: "no_restriction",
      session: false,
      expirationDate: 123,
    },
  ]);
  const row = csv.split("\r\n")[1];
  assert.equal(row, 'weird,"a,b""c\nd",example.com,/,false,true,no_restriction,false,123');
});
