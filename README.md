# Cookie Copier

A Chrome Manifest V3 extension scaffold intended to export the active site’s cookies. The current version implements only a static popup shell; cookie access and copying are planned features.

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
| `popup.js` | DOM-ready handler |

## Configuration and limitations

The current manifest declares no cookie, tab, or host permissions, and the popup script does not fetch cookies. Planned work includes domain detection, cookie listing, Cookie-header/JSON export, scope controls, and error states.

## Development and validation

Reload the unpacked extension after changes and inspect the popup console. There is no automated test suite yet. When cookie access is implemented, treat exported cookies as credentials and keep them local.

## License

See [LICENSE](LICENSE).
