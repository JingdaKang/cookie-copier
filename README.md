# Cookie Copier

A Chrome Manifest V3 extension that exports the active site’s cookies. The current version detects the active tab and shows its registrable domain; cookie listing and copying are planned features.

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
| `popup.js` | Popup logic: active-tab domain detection |
| `domain.js` | URL host and registrable-domain helpers |

## Configuration and limitations

The manifest declares the `activeTab` permission so the popup can read the current tab’s URL. The popup shows the site’s registrable domain but does not fetch cookies yet. Planned work includes cookie listing, Cookie-header/JSON export, scope controls, and error states.

## Development and validation

Reload the unpacked extension after changes and inspect the popup console. There is no automated test suite yet. When cookie access is implemented, treat exported cookies as credentials and keep them local.

## License

See [LICENSE](LICENSE).
