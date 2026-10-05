// Cookie retrieval for a registrable domain.
//
// chrome.cookies.getAll({ domain }) returns cookies whose domain matches or is
// a subdomain of the given one, so passing the registrable domain captures the
// whole site (apex plus subdomains). The extra filter below is defensive: it
// drops anything that only happens to end with the same text but is not a true
// subdomain (e.g. "notexample.com" against "example.com").

// Does a cookie's domain belong to `domain` or one of its subdomains?
function belongsToDomain(cookieDomain, domain) {
  const host = cookieDomain.replace(/^\./, "").toLowerCase();
  return host === domain || host.endsWith("." + domain);
}

// All cookies for a registrable domain, sorted by name for a stable listing.
export async function getCookiesForDomain(domain) {
  if (!domain) return [];
  const cookies = await chrome.cookies.getAll({ domain });
  return cookies
    .filter((cookie) => belongsToDomain(cookie.domain, domain))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Serialize cookies into a single "name=value; name2=value2" Cookie header.
export function toCookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

// Serialize cookies to a pretty-printed JSON array, keeping the fields that
// matter for inspection and re-import and dropping browser-internal ones.
export function toJson(cookies) {
  const exported = cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    session: cookie.session,
    expirationDate: cookie.expirationDate ?? null,
  }));
  return JSON.stringify(exported, null, 2);
}
