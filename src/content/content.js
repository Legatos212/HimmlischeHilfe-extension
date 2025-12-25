const TAB_ID = "hh-tab";
const PANEL_ID = "hh-panel";
const OPEN_CLASS = "hh-panel--open";
const TAB_LABEL = "Hilfe";
const PANEL_TITLE = "Himmlische Hilfe";

const NAV_SELECTORS = [
  "#js_cityNav",
  "#cityNav",
  ".cityNav",
  "#header",
  "#menu",
];

const state = {
  open: false,
};

const findNavContainer = () => {
  for (const selector of NAV_SELECTORS) {
    const node = document.querySelector(selector);
    if (node) {
      return node;
    }
  }

  return null;
};

const setPanelOpen = (panel, open) => {
  if (!panel) return;

  panel.classList.toggle(OPEN_CLASS, open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
};

const togglePanel = (panel, tab) => {
  state.open = !state.open;
  setPanelOpen(panel, state.open);

  if (tab) {
    tab.setAttribute("aria-expanded", state.open ? "true" : "false");
  }
};

const createTab = (panel) => {
  const tab = document.createElement("button");
  tab.id = TAB_ID;
  tab.type = "button";
  tab.className = "hh-tab";
  tab.textContent = TAB_LABEL;
  tab.setAttribute("aria-controls", PANEL_ID);
  tab.setAttribute("aria-expanded", "false");

  tab.addEventListener("click", () => {
    togglePanel(panel, tab);
  });

  return tab;
};

const createPanel = () => {
  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "hh-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-label", PANEL_TITLE);

  panel.innerHTML = `
    <div class="hh-panel__header">
      <span class="hh-panel__title">${PANEL_TITLE}</span>
      <button type="button" class="hh-panel__close" aria-label="Close panel">x</button>
    </div>
    <div class="hh-panel__body">
      <p>Base scaffold is ready. QoL features will appear here.</p>
    </div>
  `;

  panel.querySelector(".hh-panel__close").addEventListener("click", () => {
    state.open = false;
    setPanelOpen(panel, false);

    const tab = document.getElementById(TAB_ID);
    if (tab) {
      tab.setAttribute("aria-expanded", "false");
    }
  });

  return panel;
};

const placeTab = (tab, nav) => {
  if (nav) {
    if (!tab.classList.contains("hh-tab--inline")) {
      tab.classList.remove("hh-tab--floating");
      tab.classList.add("hh-tab--inline");
    }

    if (tab.parentElement !== nav) {
      nav.appendChild(tab);
    }
  } else {
    if (!tab.classList.contains("hh-tab--floating")) {
      tab.classList.remove("hh-tab--inline");
      tab.classList.add("hh-tab--floating");
    }

    if (tab.parentElement !== document.body) {
      document.body.appendChild(tab);
    }
  }
};

const ensureUi = () => {
  if (!document.body) return;

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = createPanel();
    document.body.appendChild(panel);
  }

  let tab = document.getElementById(TAB_ID);
  if (!tab) {
    tab = createTab(panel);
  }

  const nav = findNavContainer();
  placeTab(tab, nav);
  setPanelOpen(panel, state.open);
};

let scheduled = false;
const scheduleMount = () => {
  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    scheduled = false;
    ensureUi();
  });
};

scheduleMount();

const observer = new MutationObserver(scheduleMount);
observer.observe(document.documentElement, { childList: true, subtree: true });
