# Cookie Copier

A Chrome Manifest V3 extension that exports the active site’s cookies. It detects the active tab’s registrable domain, lists the cookies scoped to that domain with their path, expiry, and `Secure` / `HttpOnly` / `SameSite` flags, and copies or downloads them as a Cookie header, JSON, or CSV.

## Features

- **Scope toggle** — include subdomains (default) or restrict to the exact apex domain.
- **Name filter** — narrow the list to cookies whose name matches a search term.
- **Sort** — order the list by cookie name or by domain.
- **Per-cookie detail** — each row shows the path, expiry, and security flags, with a button to copy its value.
- **Bulk export** — copy the shown cookies as a Cookie header or JSON, or download them as a JSON or CSV file.
- **Refresh** — re-read cookies without reopening the popup.

## Requirements

Chrome or another compatible Chromium browser. No Node dependency installation or build step is required.

## Getting started

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this repository directory.
3. Click the extension to view its popup.

## Project structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 configuration |
| `popup.html` | Popup markup |
| `popup.css` | Popup styling |
| `popup.js` | Popup logic: domain detection, listing, filter, copy, download |
| `domain.js` | URL host and registrable-domain helpers |
| `cookies.js` | Cookie retrieval, scope filtering, and header/JSON/CSV serialization |
| `tests/` | Node test-runner unit tests for the pure helpers |

## Configuration and limitations

The manifest declares `activeTab` to read the current tab’s URL, `cookies` to read stored cookies, and `http://*/*` / `https://*/*` host permissions so cookies can be read for whichever site is open. JSON and CSV files are saved via an in-popup Blob download, so no `downloads` permission is required. Registrable-domain detection uses a pragmatic suffix heuristic that covers common country-code suffixes rather than the full Public Suffix List, which remains planned work.

## Testing

The pure helpers in `domain.js` and `cookies.js` are covered by unit tests that run on Node’s built-in test runner — no dependencies to install:

```sh
npm test
```

## Development and validation

Reload the unpacked extension after changes and inspect the popup console, and run `npm test` for the helper logic. Exported cookies are credentials: they stay in your browser and on your clipboard, and the extension sends nothing over the network. Keep them local and clear your clipboard when done.

## License

See [LICENSE](LICENSE).
