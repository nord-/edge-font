const FONTS = [
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Comic Sans MS",
  "Roboto",
  "Noto Sans",
  "Segoe UI"
];

const CUSTOM = "__custom__";
const $ = (id) => document.getElementById(id);

let currentTabId = null;
let hasSitePermission = false;

function t(key, fallback) {
  const msg = chrome.i18n.getMessage(key);
  return msg || fallback;
}

function localize() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    const msg = chrome.i18n.getMessage(el.dataset.i18nPlaceholder);
    if (msg) el.placeholder = msg;
  }
}

function originPattern(host) {
  return `*://${host}/*`;
}

// Match patterns stöder inte alla värdtyper (t.ex. IPv6-literaler) — contains/request
// kastar då. Fall tillbaka på <all_urls>-nivån: beviljad i Edge, normalt inte i Firefox.
async function hasAllUrlsPermission() {
  return chrome.permissions.contains({ origins: ["<all_urls>"] });
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    const host = new URL(tab.url).hostname;
    return host ? { id: tab.id, host } : null;
  } catch {
    return null;
  }
}

function populateFontSelect() {
  const select = $("font-select");
  for (const f of FONTS) {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    opt.style.fontFamily = f;
    select.appendChild(opt);
  }
  const customOpt = document.createElement("option");
  customOpt.value = CUSTOM;
  customOpt.textContent = t("customOption", "Custom…");
  select.appendChild(customOpt);
}

function setFieldsVisibility() {
  const on = $("enabled").checked;
  const isCustom = $("font-select").value === CUSTOM;
  $("font-field").hidden = !on;
  $("custom-field").hidden = !on || !isCustom;
}

async function save(host) {
  const enabled = $("enabled").checked;
  const sel = $("font-select").value;
  const font = sel === CUSTOM ? $("custom-font").value.trim() : sel;
  const { sites = {} } = await chrome.storage.local.get("sites");
  sites[host] = { enabled, font: font || FONTS[0] };
  await chrome.storage.local.set({ sites });
}

async function onToggleChange(host) {
  const hint = $("permission-hint");
  if (!$("enabled").checked) {
    hint.hidden = true;
    setFieldsVisibility();
    await save(host);
    return;
  }
  // permissions.request måste vara handlerns första await — Firefox tappar
  // user-gesture-kontexten efter en tidigare await och kastar då.
  let granted;
  try {
    granted = await chrome.permissions.request({ origins: [originPattern(host)] });
  } catch {
    granted = await hasAllUrlsPermission();
  }
  if (!granted) {
    $("enabled").checked = false;
    hint.hidden = false;
    setFieldsVisibility();
    return;
  }
  const firstGrant = !hasSitePermission;
  hasSitePermission = true;
  hint.hidden = true;
  setFieldsVisibility();
  await save(host);
  if (firstGrant && currentTabId != null) chrome.tabs.reload(currentTabId).catch(() => {});
}

async function init() {
  const tab = await getCurrentTab();
  if (!tab) {
    $("host").textContent = t("notAvailable", "Not available on this tab");
    $("enabled").disabled = true;
    return;
  }
  const host = tab.host;
  currentTabId = tab.id;
  try {
    hasSitePermission = await chrome.permissions.contains({ origins: [originPattern(host)] });
  } catch {
    hasSitePermission = await hasAllUrlsPermission();
  }

  $("host").textContent = host;
  populateFontSelect();

  const { sites = {} } = await chrome.storage.local.get("sites");
  const cfg = sites[host] || { enabled: false, font: FONTS[0] };

  // Sparad som på men åtkomst saknas (nekad/återkallad): visa som av med hint —
  // på-toggle begär åtkomst på nytt. Lagrat state skrivs inte om vid init, så
  // åtkomst som återställs via about:addons läker utan ny toggle.
  const missingAccess = cfg.enabled && !hasSitePermission;
  $("enabled").checked = cfg.enabled && hasSitePermission;
  $("permission-hint").hidden = !missingAccess;

  if (FONTS.includes(cfg.font)) {
    $("font-select").value = cfg.font;
  } else if (cfg.font) {
    $("font-select").value = CUSTOM;
    $("custom-font").value = cfg.font;
  } else {
    $("font-select").value = FONTS[0];
  }
  setFieldsVisibility();

  $("enabled").addEventListener("change", () => onToggleChange(host));
  $("font-select").addEventListener("change", () => {
    setFieldsVisibility();
    save(host);
  });
  $("custom-font").addEventListener("input", () => save(host));
}

localize();
init();
