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

test("getRegistrableDomain covers the broader suffix set", () => {
  assert.equal(getRegistrableDomain("www.example.com.au"), "example.com.au");
  assert.equal(getRegistrableDomain("shop.example.co.jp"), "example.co.jp");
  assert.equal(getRegistrableDomain("a.b.example.co.kr"), "example.co.kr");
  assert.equal(getRegistrableDomain("news.example.com.br"), "example.com.br");
  assert.equal(getRegistrableDomain("store.example.com.mx"), "example.com.mx");
  assert.equal(getRegistrableDomain("m.example.co.id"), "example.co.id");
});

test("getRegistrableDomain still collapses plain .com under a known cctld prefix", () => {
  // "com.foo" is not a registered multi-label suffix, so only the last two
  // labels form the registrable domain.
  assert.equal(getRegistrableDomain("a.b.example.com"), "example.com");
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
