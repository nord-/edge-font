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

async function getCurrentHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    return new URL(tab.url).hostname || null;
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
  customOpt.textContent = "Eget…";
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

async function init() {
  const host = await getCurrentHost();
  if (!host) {
    $("host").textContent = "Inte tillgängligt på den här fliken";
    $("enabled").disabled = true;
    return;
  }
  $("host").textContent = host;

  populateFontSelect();

  const { sites = {} } = await chrome.storage.local.get("sites");
  const cfg = sites[host] || { enabled: false, font: FONTS[0] };

  $("enabled").checked = cfg.enabled;

  if (FONTS.includes(cfg.font)) {
    $("font-select").value = cfg.font;
  } else if (cfg.font) {
    $("font-select").value = CUSTOM;
    $("custom-font").value = cfg.font;
  } else {
    $("font-select").value = FONTS[0];
  }
  setFieldsVisibility();

  $("enabled").addEventListener("change", () => {
    setFieldsVisibility();
    save(host);
  });
  $("font-select").addEventListener("change", () => {
    setFieldsVisibility();
    save(host);
  });
  $("custom-font").addEventListener("input", () => save(host));
}

init();
