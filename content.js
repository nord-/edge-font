const STYLE_ID = "edge-font-style";
const host = window.location.hostname;

function quoteFontFamily(name) {
  if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) return name;
  return `"${name.replace(/"/g, '\\"')}"`;
}

function applyFont(font) {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }
  const family = quoteFontFamily(font);
  style.textContent = `html, body, body * { font-family: ${family}, system-ui, sans-serif !important; }`;
}

function removeFont() {
  document.getElementById(STYLE_ID)?.remove();
}

async function refresh() {
  const { sites = {} } = await chrome.storage.local.get("sites");
  const config = sites[host];
  if (config && config.enabled && config.font) applyFont(config.font);
  else removeFont();
}

refresh();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.sites) refresh();
});
