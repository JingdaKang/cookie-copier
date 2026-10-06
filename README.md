# Cookie Copier

A Chrome Manifest V3 extension that exports the active site’s cookies. It detects the active tab’s registrable domain, lists the cookies scoped to that domain (apex plus subdomains) with their `Secure` / `HttpOnly` / `SameSite` flags, and copies them as a single Cookie header or as pretty-printed JSON — or saves the JSON to a file.

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
| `popup.js` | Popup logic: domain detection, cookie listing, copy |
| `domain.js` | URL host and registrable-domain helpers |
| `cookies.js` | Cookie retrieval and Cookie-header / JSON serialization |

## Configuration and limitations

The manifest declares `activeTab` to read the current tab’s URL, `cookies` to read stored cookies, and `http://*/*` / `https://*/*` host permissions so cookies can be read for whichever site is open. The JSON file is saved via an in-popup Blob download, so no `downloads` permission is required. Registrable-domain detection uses a pragmatic suffix heuristic rather than the full Public Suffix List. Planned work includes scope controls (apex-only vs. subdomains).

## Development and validation

Reload the unpacked extension after changes and inspect the popup console. There is no automated test suite yet. Exported cookies are credentials: they stay in your browser and on your clipboard, and the extension sends nothing over the network. Keep them local and clear your clipboard when done.

## License

See [LICENSE](LICENSE).
