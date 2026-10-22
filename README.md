# Cookie Copier

A Chrome Manifest V3 extension that exports the active site’s cookies. It detects the active tab’s registrable domain, lists the cookies scoped to that domain with their path, expiry, and `Secure` / `HttpOnly` / `SameSite` flags, and copies or downloads them as a Cookie header, JSON, or CSV.

## Features

- **Scope toggle** — include subdomains (default) or restrict to the exact apex domain.
- **Name filter** — narrow the list to cookies whose name matches a search term.
- **Sort** — order the list by cookie name or by domain.
- **Selection** — check individual cookies (or select all); exports then act on the selected subset.
- **Per-cookie detail** — each row shows the path, expiry, and security flags, with a button to copy its value.
- **Export** — copy as a Cookie header, JSON, or CSV, or download the JSON or CSV as a file.
- **Persisted settings** — the scope and sort choices are remembered via `chrome.storage`.
- **Refresh** — re-read cookies without reopening the popup.

## Requirements

- Chrome or another compatible Chromium browser (to run the extension).
- Node.js 18+ (only for development: tests, linting, and packaging).

## Getting started

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this repository directory.
3. Click the extension to open its popup.

## Project structure

| Path                | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `manifest.json`     | Manifest V3 configuration                                            |
| `popup.html`        | Popup markup                                                         |
| `popup.css`         | Popup styling                                                        |
| `popup.js`          | Popup controller: wiring, rendering, and export actions              |
| `domain.js`         | URL host and registrable-domain helpers                              |
| `cookies.js`        | Cookie retrieval, scope filtering, and header/JSON/CSV serialization |
| `settings.js`       | Persisted scope/sort settings backed by `chrome.storage`             |
| `selection.js`      | Per-cookie selection model for partial export                        |
| `icons/`            | Generated extension icons (see `scripts/make-icons.mjs`)             |
| `scripts/`          | Icon generation and Web Store packaging                              |
| `tests/`            | Unit tests for the helpers and jsdom integration tests for the popup |
| `.github/workflows` | CI: lint, format check, and tests                                    |

## Permissions

The manifest declares `activeTab` to read the current tab’s URL, `cookies` to read stored cookies, `storage` to persist settings, and `http://*/*` / `https://*/*` host permissions so cookies can be read for whichever site is open. JSON and CSV files are saved via an in-popup Blob download, so no `downloads` permission is required.

Registrable-domain detection uses a pragmatic suffix heuristic that covers common country-code suffixes rather than the full Public Suffix List, which remains planned work.

## Development

Install the dev dependencies once, then use the npm scripts:

```sh
npm install        # dev tooling only; the extension itself has no runtime deps

npm run lint       # ESLint
npm run format     # Prettier (write);  npm run format:check to verify
npm test           # Node's built-in test runner (helper units + jsdom popup integration)
npm run check      # lint + format check + tests (what CI runs)

npm run icons      # regenerate icons/ from scripts/make-icons.mjs
npm run package    # build dist/cookie-copier-<version>.zip for the Web Store
```

CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, and `test` on pushes and pull requests to `main`.

## Security note

Exported cookies are credentials. They stay in your browser and on your clipboard or a local file, and the extension sends nothing over the network. Keep them local, and clear your clipboard and delete exported files when you are done.

## License

See [LICENSE](LICENSE).
