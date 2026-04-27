# edge-font

Edge browser extension (Manifest V3) that lets you override the font on a website you specifically opt in to. Default is **off** for every site — open the popup, flip "Slå på för den här webbplatsen", and pick a font from a curated system-font list (or type in a custom font name).

Built primarily for **Microsoft Edge on Android**; the same package runs in Edge for desktop, which is the easier place to develop and iterate. Edge for iOS does not support extensions and is not a target.

## How it works

- **Per-site toggle.** Settings are keyed by the active tab's `hostname`. `news.ycombinator.com` and `m.news.ycombinator.com` are independent.
- **Curated font list + custom field.** Browsers don't expose installed-font enumeration on Android (`queryLocalFonts()` is desktop-only and gated behind a permission prompt), so the popup ships a list of common cross-platform system fonts plus an "Eget…" free-text field. Unknown names fall back to `system-ui, sans-serif` gracefully.
- **Live updates.** Toggling or changing the font in the popup applies immediately on the open page — no reload.
- **No background worker, no tracking.** A single content script reads `chrome.storage.local` and injects a `<style>` element. That's the whole runtime.

## Install

### Edge for Android

Install from the Edge Add-ons store once a build is published there. Stable Edge mobile does not support sideloading unpacked extensions or installing zips directly — it has no developer mode.

### Edge desktop (development)

1. Clone this repo.
2. Open `edge://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the repo folder.
4. Click the extension icon on any site, toggle on, pick a font.

## Build a release zip

```powershell
Compress-Archive -Path manifest.json, content.js, popup.html, popup.css, popup.js -DestinationPath dist/edge-font-0.1.0.zip -Force
```

The zip is what you upload to Microsoft Partner Center when publishing (or re-publishing) to Edge Add-ons.

## Repository layout

```
manifest.json      MV3 manifest — permissions, popup, content_script
content.js         Reads chrome.storage.local, injects/removes <style>
popup.html / .css  Popup UI (toggle + font dropdown + custom field)
popup.js           Reads/writes chrome.storage.local.sites[hostname]
CLAUDE.md          Architecture, conventions, gotchas
```

See `CLAUDE.md` for design rationale, edge cases, and development conventions.
