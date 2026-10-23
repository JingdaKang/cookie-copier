# Cookie Copier — Usage Guide

Cookie Copier is a Chrome/Chromium extension that lists the cookies for the site
in your active tab and lets you copy or export them. Everything happens locally
in your browser; the extension makes no network requests.

## Contents

- [Install](#install)
- [Open the popup](#open-the-popup)
- [Read the cookie list](#read-the-cookie-list)
- [Controls](#controls)
- [Export](#export)
- [Using the exported data](#using-the-exported-data)
- [Settings that are remembered](#settings-that-are-remembered)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Install

The extension is loaded unpacked (it is not on the Web Store):

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this repository folder.
4. (Optional) Pin **Cookie Copier** from the puzzle-piece menu so its icon stays
   on the toolbar.

To package the extension into a single `.zip` (for distribution or your own Web
Store upload), run `npm run package`; the file is written to
`dist/cookie-copier-<version>.zip`.

## Open the popup

Navigate to any normal `http://` or `https://` page, then click the Cookie
Copier toolbar icon. The popup header shows the **registrable domain** it is
scoped to — for `https://mail.example.com/inbox` that is `example.com`.

On opening, the cursor lands in the filter box so you can start typing right
away.

> Cookie Copier only works on web pages. On browser pages such as
> `chrome://…`, `about:…`, the Web Store, or a blank new tab, the popup shows
> "Open a normal web page (http or https) to see its cookies." — those pages
> have no site cookies to read.

## Read the cookie list

Each row shows one cookie:

- **Name** (bold) and its **Copy value** button.
- **Value** (muted, wraps for long tokens).
- **Path · Expiry** — e.g. `/ · Expires 2026-12-31`, or `/ · Session` for a
  session cookie that is dropped when the browser closes.
- **Flag badges** — any of `Secure`, `HttpOnly`, `SameSite=Lax`,
  `SameSite=Strict`. No badge means the attribute is not set.

The status line at the bottom reports how many cookies are shown.

## Controls

| Control                | What it does                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Include subdomains** | On (default): shows cookies for the domain and all subdomains. Off: only the exact apex.    |
| **Filter by name**     | Type to show only cookies whose name contains the text (case-insensitive).                  |
| **Sort by**            | Order rows by **Name** or by **Domain** (domain groups subdomains, then name within each).  |
| **Refresh**            | Re-read cookies from the browser (use after logging in or when cookies change on the page). |
| **Select all**         | Check or uncheck every cookie currently shown.                                              |
| Row checkbox           | Select an individual cookie.                                                                |
| **Copy value**         | Copy just that one cookie's value to the clipboard.                                         |

### Selection and export scope

- With **no** checkboxes ticked, exports include **every cookie currently shown**
  (after the filter).
- With **one or more** ticked, exports include **only the selected cookies**, and
  the status area shows `N selected · exports use selection`.

Selection is remembered by each cookie's identity (name + domain + path), so it
survives re-sorting and re-filtering, and stale entries are dropped on refresh.

## Export

Four buttons at the bottom act on the current export scope described above:

| Button                    | Output                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| **Copy as Cookie header** | One line: `name1=value1; name2=value2` — ready for a `Cookie:` header. |
| **Copy as JSON**          | A pretty-printed JSON array (see fields below).                        |
| **Download JSON**         | The same JSON saved as `cookies-<domain>-<date>.json`.                 |
| **Download CSV**          | A spreadsheet-friendly CSV saved as `cookies-<domain>-<date>.csv`.     |

The JSON and CSV include these fields per cookie: `name`, `value`, `domain`,
`path`, `secure`, `httpOnly`, `sameSite`, `session`, `expirationDate`
(`expirationDate` is seconds since the epoch, or `null` for session cookies).

## Using the exported data

**Replay a request with `curl`** using the Cookie header:

```sh
curl "https://example.com/api/me" \
  -H "Cookie: session=abc123; theme=dark"
```

**Open the CSV** in Excel, Google Sheets, or Numbers to review attributes in a
table. Fields containing commas, quotes, or newlines are quoted per RFC 4180.

**Process the JSON** in a script, for example with `jq`:

```sh
jq '.[] | select(.secure == false) | .name' cookies-example.com-2026-10-22.json
```

> Scope tip: to export exactly the cookies one backend sees, turn **Include
> subdomains** off so only apex-domain cookies are included, or select the
> specific cookies you need.

## Settings that are remembered

The **Include subdomains** and **Sort by** choices are saved with
`chrome.storage` and restored the next time you open the popup (and synced across
your Chrome profiles when sync is enabled). The filter text and selection are not
persisted — they reset each time the popup opens.

## Security

Cookies are credentials. Treat an exported Cookie header, JSON, or CSV like a
password:

- They are written only to your clipboard or a local file; the extension never
  sends them anywhere.
- Anyone holding a session cookie can often act as you on that site until it
  expires.
- Clear your clipboard and delete exported files when you are finished, and avoid
  pasting cookies into untrusted tools or chats.

## Troubleshooting

| Symptom                           | Likely cause and fix                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| "Open a normal web page…"         | You're on a `chrome://`/`about:` page or new tab. Switch to an `http(s)` site.        |
| Fewer cookies than expected       | **Include subdomains** may be off, or a filter is active. Turn it on / clear filter.  |
| `HttpOnly` cookies are listed     | Expected — the extension reads via the cookies API, which can see `HttpOnly` cookies. |
| List looks stale after login      | Click **Refresh** to re-read cookies.                                                 |
| "Couldn't copy to the clipboard." | The browser blocked clipboard access; try again, or use **Download** instead.         |

For development, testing, and packaging, see the [README](../README.md).
