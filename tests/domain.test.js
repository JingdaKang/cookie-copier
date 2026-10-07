import test from "node:test";
import assert from "node:assert/strict";

import { getHost, getRegistrableDomain, parseTabUrl } from "../domain.js";

test("getHost returns the lowercased host for http(s) URLs", () => {
  assert.equal(getHost("https://www.example.com/path?q=1"), "www.example.com");
  assert.equal(getHost("HTTP://Example.COM"), "example.com");
});

test("getHost returns empty for non-http schemes and junk", () => {
  assert.equal(getHost("chrome://extensions"), "");
  assert.equal(getHost("file:///tmp/x"), "");
  assert.equal(getHost("not a url"), "");
});

test("getRegistrableDomain collapses subdomains to eTLD+1", () => {
  assert.equal(getRegistrableDomain("www.example.com"), "example.com");
  assert.equal(getRegistrableDomain("a.b.c.example.com"), "example.com");
  assert.equal(getRegistrableDomain("example.com"), "example.com");
});

test("getRegistrableDomain handles multi-label public suffixes", () => {
  assert.equal(getRegistrableDomain("shop.example.co.uk"), "example.co.uk");
  assert.equal(getRegistrableDomain("example.co.uk"), "example.co.uk");
});

test("getRegistrableDomain leaves IPs and single-label hosts unchanged", () => {
  assert.equal(getRegistrableDomain("127.0.0.1"), "127.0.0.1");
  assert.equal(getRegistrableDomain("localhost"), "localhost");
  assert.equal(getRegistrableDomain(""), "");
});

test("parseTabUrl returns both host and registrable domain", () => {
  assert.deepEqual(parseTabUrl("https://sub.example.com/x"), {
    host: "sub.example.com",
    domain: "example.com",
  });
  assert.deepEqual(parseTabUrl("about:blank"), { host: "", domain: "" });
});
