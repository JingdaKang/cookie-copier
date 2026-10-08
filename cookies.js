// Cookie retrieval for a registrable domain.
//
// chrome.cookies.getAll({ domain }) returns cookies whose domain matches or is
// a subdomain of the given one, so passing the registrable domain captures the
// whole site (apex plus subdomains). The extra filter below is defensive: it
// drops anything that only happens to end with the same text but is not a true
// subdomain (e.g. "notexample.com" against "example.com").

// Does a cookie's domain fall within the requested scope? With subdomains
// included, the apex and any subdomain match; otherwise only the exact apex.
export function matchesScope(cookieDomain, domain, includeSubdomains) {
  const host = cookieDomain.replace(/^\./, "").toLowerCase();
  if (host === domain) return true;
  return includeSubdomains && host.endsWith("." + domain);
}

// All cookies for a registrable domain, sorted by name for a stable listing.
// With `includeSubdomains` false, only cookies set on the exact apex are kept.
export async function getCookiesForDomain(domain, { includeSubdomains = true } = {}) {
  if (!domain) return [];
  const cookies = await chrome.cookies.getAll({ domain });
  return cookies
    .filter((cookie) => matchesScope(cookie.domain, domain, includeSubdomains))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Serialize cookies into a single "name=value; name2=value2" Cookie header.
export function toCookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

// A human-readable expiry for a cookie: "Session" when it has no persistent
// expiry, otherwise "Expires <UTC date>". Chrome reports expirationDate in
// seconds since the epoch.
export function formatExpiry(cookie) {
  if (cookie.session || cookie.expirationDate == null) return "Session";
  const date = new Date(cookie.expirationDate * 1000).toISOString().slice(0, 10);
  return `Expires ${date}`;
}

// A plain, export-friendly view of a cookie: the fields that matter for
// inspection and re-import, with browser-internal ones dropped.
export function toExportObject(cookie) {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    session: cookie.session,
    expirationDate: cookie.expirationDate ?? null,
  };
}

// Serialize cookies to a pretty-printed JSON array of export objects.
export function toJson(cookies) {
  return JSON.stringify(cookies.map(toExportObject), null, 2);
}

// Column order for CSV export, matching the export object's keys.
const CSV_COLUMNS = [
  "name", "value", "domain", "path",
  "secure", "httpOnly", "sameSite", "session", "expirationDate",
];

// Quote a CSV field when it contains a comma, quote, or line break, doubling
// any embedded quotes (RFC 4180). null/undefined become an empty field.
function csvField(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Serialize cookies to CSV with a header row, using the export fields.
export function toCsv(cookies) {
  const rows = [CSV_COLUMNS.join(",")];
  for (const cookie of cookies) {
    const exported = toExportObject(cookie);
    rows.push(CSV_COLUMNS.map((column) => csvField(exported[column])).join(","));
  }
  return rows.join("\r\n");
}
