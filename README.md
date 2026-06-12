# edge-font

Browser extension (Manifest V3) that lets you override the font on a website you specifically opt in to. Default is **off** for every site — open the popup, flip the "Enable for this website" toggle, and pick a font from a curated system-font list (or type in a custom font name).

The UI follows the browser's UI language. English and Swedish are shipped today; English is the fallback for any other locale.

Built primarily for **Microsoft Edge on Android** and **Firefox on Android**; the same package runs in Edge and Firefox for desktop, which are the easier places to develop and iterate. One manifest serves all browsers — `browser_specific_settings` is ignored by Edge/Chrome. Edge and Firefox for iOS do not support extensions and are not targets.

## How it works

- **Per-site toggle.** Settings are keyed by the active tab's `hostname`. `news.ycombinator.com` and `m.news.ycombinator.com` are independent.
- **Curated font list + custom field.** Browsers don't expose installed-font enumeration on Android (`queryLocalFonts()` is desktop-only and gated behind a permission prompt), so the popup ships a list of common cross-platform system fonts plus a "Custom…" free-text field. Unknown names fall back to `system-ui, sans-serif` gracefully.
- **Live updates.** Toggling or changing the font in the popup applies immediately on the open page — no reload.
- **Per-site permissions in Firefox.** Firefox lets you revoke the extension's host access at any time (`about:addons` → Permissions). If access is missing for a site, the popup shows a hint and re-requests permission when you flip the toggle on.
- **No background worker, no tracking.** A single content script reads `chrome.storage.local` and injects a `<style>` element. That's the whole runtime. Nothing ever leaves the browser (declared via `data_collection_permissions: none`).

## Install

### Edge for Android

Install from the Edge Add-ons store once a build is published there. Stable Edge mobile does not support sideloading unpacked extensions or installing zips directly — it has no developer mode.

### Firefox for Android

Install from [addons.mozilla.org](https://addons.mozilla.org/) once a build is published there. Stable Firefox mobile has no temporary-install UI either.

### Edge desktop (development)

1. Clone this repo.
2. Open `edge://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the repo folder.
4. Click the extension icon on any site, toggle on, pick a font.

### Firefox desktop (development)

1. Clone this repo.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json` in the repo folder.
4. The add-on unloads when Firefox closes; reload it the same way.

## Build a release zip

```powershell
Compress-Archive -Path manifest.json, content.js, popup.html, popup.css, popup.js, _locales -DestinationPath dist/edge-font.zip -Force
```

The same zip is what you upload to Microsoft Partner Center (Edge Add-ons) and to the [AMO Developer Hub](https://addons.mozilla.org/developers/) (Firefox). Validate it first with:

```powershell
npx web-ext lint --source-dir . --ignore-files "docs/**" ".git/**" "dist/**" "store/**" "*.md"
```

## Repository layout

```
manifest.json      MV3 manifest — permissions, browser_specific_settings, popup, content_script
content.js         Reads chrome.storage.local, injects/removes <style>
popup.html / .css  Popup UI (toggle + font dropdown + custom field + permission hint)
popup.js           Reads/writes chrome.storage.local.sites[hostname]; requests per-site host permission in Firefox
_locales/en, sv    Localized strings; en is the default fallback
CLAUDE.md          Architecture, conventions, gotchas
```

See `CLAUDE.md` for design rationale, edge cases, and development conventions.
