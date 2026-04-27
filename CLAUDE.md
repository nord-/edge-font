# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Edge browser extension (Manifest V3) that overrides the font on a per-site basis. The user opens the extension popup on any site, toggles "Slå på för den här webbplatsen", and picks a font from a curated system-font list (or types in a custom font name). Default is **off** for every site — the extension is inert until the user explicitly enables it for a host.

Primary target: Edge for Android (which supports MV3 extensions installed from the Edge Add-ons store). The same package runs unchanged in Edge desktop, which is the development environment. Edge for iOS does not support extensions and is out of scope.

## Architecture

Three pieces talk to each other through `chrome.storage.local`:

```
popup.html / popup.js  ──writes──►  chrome.storage.local.sites[host]
                                            │
                                            │ onChanged
                                            ▼
                                       content.js  ──injects/removes──►  <style id="edge-font-style">
```

- **`popup.js`** — runs when the user taps the extension icon. Reads the active tab's `hostname` via `chrome.tabs.query`, loads the existing config for that host from `chrome.storage.local`, and saves changes back on every input event. UI state is fully derived from `{ enabled, font }` for the current host.
- **`content.js`** — registered for `<all_urls>` at `document_start` with `all_frames: true`. On load it reads `sites[location.hostname]` and either injects a `<style id="edge-font-style">` with `font-family: ... !important` on `html, body, body *`, or removes it. It also subscribes to `chrome.storage.onChanged` so toggling in the popup applies live without a page reload.
- **`manifest.json`** — declares `storage` + `activeTab` permissions, `<all_urls>` host permissions (needed because the user may toggle the extension on for any site), the action popup, and the content script. There is no background service worker — none of the logic needs one.

Storage shape:

```js
{ sites: { "news.ycombinator.com": { enabled: true, font: "Georgia" }, ... } }
```

`hostname` is used as-is. `www.example.com` and `example.com` are distinct keys; that is intentional and predictable. No eTLD+1 normalization.

## Why a curated font list (not enumerated from the device)

Edge for Android does not expose `window.queryLocalFonts()` (Local Font Access API), and even on desktop it requires a permission prompt and is gated behind a user gesture. Enumerating "fonts on the device" reliably across mobile + desktop is therefore not feasible. The popup ships a curated list of common cross-platform system fonts (`FONTS` in `popup.js`), plus an "Eget…" option that reveals a free-text input. If the typed font is not installed on the device, the browser falls back to the next family in the stack (`system-ui, sans-serif`), so an unknown name fails gracefully.

When adding entries to `FONTS`, prefer fonts that are reasonably likely to be installed on either Android, Windows, or macOS — there is no point listing platform-specific obscurities.

## Common commands

Package for the Edge Add-ons store (zip the runtime files, excluding repo metadata):

```powershell
Compress-Archive -Path manifest.json, content.js, popup.html, popup.css, popup.js -DestinationPath dist/edge-font.zip -Force
```

Local testing in Edge desktop:

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. **Load unpacked** → select this folder.
4. Visit any site, click the extension icon, toggle "Slå på", pick a font.
5. After editing files: click the reload icon on the extension card; content scripts re-inject on next page load, popup picks up its changes the next time it is opened.

Local testing in Edge for Android: there is no "load unpacked" UI on stable Edge mobile. Iterate on desktop, then publish an unlisted/private build to Edge Add-ons to verify the mobile install path.

Inspect saved state during development: open the popup, right-click → **Inspect popup**, then in the console:

```js
await chrome.storage.local.get("sites")
```

## Conventions

- Spaces, not tabs (2-space indent — see `.editorconfig`).
- CRLF line endings (enforced by `.gitattributes`).
- Conventional commits (`feat:`, `fix:`, `refactor:`, …).
- No AI attribution in commit messages or PR descriptions.

## Gotchas

- **`document_start` matters.** Without it, the original font flashes for one frame before the override applies. Don't move it.
- **`!important` is load-bearing.** Many sites set `font-family` inline or via deep selectors; without `!important` the override loses specificity battles.
- **`<all_urls>` host permission triggers a broad install warning** ("read and change all your data on all websites"). It is required because the user can toggle the extension on for any site they visit. If you ever consider switching to `optional_host_permissions`, weigh the per-site permission prompt churn against the broad warning.
- **`activeTab` is enough for `tab.url` in the popup** — no separate `tabs` permission is needed because the popup opens via user gesture.
- **Bumping `manifest.json` `version` is required for every Edge Add-ons store update.** Semver is convention; the store only enforces a monotonic increase.
- **Storage migrations.** If the `sites[host]` shape ever changes, write a one-shot migration in `content.js` and `popup.js` rather than assuming the new fields exist — old installs carry old shapes.
