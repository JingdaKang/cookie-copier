# Cookie Copier

A Chrome extension (Manifest V3) that copies the **current site's cookies** — scoped to the app's own domain, not the dozens of unrelated analytics and ad domains a page also talks to. Useful when you need to replay an authenticated request against an API from `curl`, Postman, or a script.

> **Status:** early development. This is Day 1 — the project scaffold. See the roadmap below.

## Why

When you open DevTools → Network on a real site, the cookie jar is a mess: the app's own session cookie sits next to trackers, CDNs, and third-party SDKs. Cookie Copier reads only the cookies for the domain you're on and hands them back in the shape you actually need.

## Roadmap

Each step is one small, self-contained change.

| Step | Increment |
|------|-----------|
| 1 ✅ | Scaffold: MV3 manifest, popup shell, docs |
| 2 ✅ | Read the active tab's URL; show its host and registrable domain |
| 3 | List that domain's cookies (`chrome.cookies.getAll`) |
| 4 | "Copy as Cookie header" (`name=value; name2=value2`) + toast |
| 5 | Scope toggle: exact host vs. registrable domain (e.g. `api.site.com` vs. `site.com`) |
| 6 | Search box, cookie count, `Secure` / `HttpOnly` badges |
| 7 | Copy as JSON; click a row to copy one value |
| 8 | Options page + saved preferences (`chrome.storage`) |
| 9 | Subdomain handling and an exclude list |
| 10 | Empty/error states; request host permission on demand |
| 11 | UI polish, icons, dark mode |
| 12 | Unit tests for the pure helpers + GitHub Actions CI |

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Pin the extension and click it on any site.

## Permissions

The extension asks only for what each feature needs, added step by step rather than up front:

- `cookies` — read the current domain's cookies (added in step 3).
- `activeTab` / `tabs` — learn which site you're on (step 2).
- host access — granted per site, on demand, when you first use it on that domain.

## Security

- Cookies are credentials. This tool reads them **locally** and only when you click; it never sends them anywhere, and it has no remote server.
- `HttpOnly` cookies *are* readable through the `chrome.cookies` API (unlike `document.cookie`), so treat anything you copy as a live secret.
- Don't run it against systems whose policies forbid exporting session data (e.g. employer-internal tools).

## License

MIT © 2026 Jayden Kang
