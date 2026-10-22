# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Added

- Subdomain scope toggle (include subdomains or restrict to the exact apex).
- Name filter and sort (by name or domain) for the cookie list.
- Per-cookie detail: path, expiry, and `Secure` / `HttpOnly` / `SameSite` flags,
  plus a button to copy an individual value.
- Selection checkboxes with a select-all control; exports act on the selected
  subset when any cookies are checked.
- Export as a Cookie header, pretty-printed JSON, or CSV; JSON and CSV can also
  be downloaded as files.
- Settings (scope and sort) persist via `chrome.storage`.
- Generated extension icons at 16/32/48/128 px.
- Tooling: ESLint, Prettier, EditorConfig, a Node test suite, a CI workflow, and
  a packaging script that builds the Web Store zip.

## [0.1.0]

### Added

- Initial popup that detects the active tab's registrable domain and lists its
  cookies, with Cookie-header and JSON copy.
