// Pure helpers for turning a tab URL into a host and a registrable domain.
//
// The registrable-domain logic here is a pragmatic heuristic, not a full
// Public Suffix List lookup. A later step swaps in the real PSL; until then
// this covers the common multi-label suffixes.

// Multi-label public suffixes, so "a.example.co.uk" collapses to
// "example.co.uk" rather than "co.uk".
const MULTI_LABEL_SUFFIXES = new Set([
  "co.uk", "org.uk", "gov.uk", "ac.uk", "me.uk",
  "com.au", "net.au", "org.au", "gov.au", "edu.au",
  "com.cn", "net.cn", "org.cn", "gov.cn",
  "co.jp", "or.jp", "ne.jp", "go.jp",
  "com.br", "com.sg", "com.hk", "co.in", "co.nz", "co.za",
]);

// The host of an http(s) URL, lowercased. Other schemes (chrome:, about:,
// file:) have no cookies, so they return "".
export function getHost(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

// The registrable domain (eTLD+1) for a host. IPs and single-label hosts
// (localhost) are returned unchanged.
export function getRegistrableDomain(host) {
  if (!host) return "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  const take = MULTI_LABEL_SUFFIXES.has(lastTwo) ? 3 : 2;
  return labels.slice(-take).join(".");
}

export function parseTabUrl(url) {
  const host = getHost(url);
  return { host, domain: getRegistrableDomain(host) };
}
