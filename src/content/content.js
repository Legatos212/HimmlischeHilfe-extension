const TAB_ID = "hh-tab";
const BANNER_ID = "hh-banner";
const PANEL_ID = "hh-panel";
const OPEN_CLASS = "hh-panel--open";
const TAB_LABEL = "Himmlische Hilfe";
const PANEL_TITLE = "Himmlische Hilfe";
const LEVEL_BADGE_CLASS = "hh-level-badge";
const LEVEL_HOST_CLASS = "hh-level-host";
const LEVEL_TEXT_REGEX = /(?:Stufe|Level)\s*[:#-]?\s*(\d+)/i;
const LEVEL_CLASS_REGEX = /^level(\d+)$/i;
const LEVEL_TITLE_REGEX = /\((\d+)\)/;
const CITY_ROOT_SELECTORS = ["#locations", "#city", "#cityView", "#cityContainer"];

const NAV_SELECTORS = [
  "#js_cityNav",
  "#cityNav",
  ".cityNav",
  "#header",
  "#menu",
];
const LEFT_MENU_SELECTOR = "#leftMenu .menu_slots";

const state = {
  open: false,
};

const levelState = {
  lastBadgeRefresh: 0,
};

const dragState = {
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  windowEl: null,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractLevelFromText = (text) => {
  if (!text) return null;
  const match = text.match(LEVEL_TEXT_REGEX);
  return match ? toNumber(match[1]) : null;
};

const getLevelFromAttributes = (element) => {
  if (!element) return null;

  const attributes = [
    "title",
    "data-tooltip",
    "data-tooltip-title",
    "data-original-title",
    "aria-label",
  ];

  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    const level = extractLevelFromText(value);
    if (level !== null) return level;
  }

  return null;
};

const getLevelFromClassList = (element) => {
  if (!element || !element.classList) return null;
  for (const className of element.classList) {
    const match = className.match(LEVEL_CLASS_REGEX);
    if (match) {
      return toNumber(match[1]);
    }
  }
  return null;
};

const getLevelFromTitle = (element) => {
  if (!element) return null;
  const title = element.getAttribute("title");
  if (!title) return null;
  const match = title.match(LEVEL_TITLE_REGEX);
  return match ? toNumber(match[1]) : null;
};

const resolveLevelForHost = (host) => {
  if (!host) return null;

  const classLevel = getLevelFromClassList(host);
  if (classLevel !== null) return classLevel;

  const anchor = host.querySelector("a");
  const titleLevel = getLevelFromTitle(anchor) ?? getLevelFromTitle(host);
  if (titleLevel !== null) return titleLevel;

  const attrLevel = getLevelFromAttributes(anchor) ?? getLevelFromAttributes(host);
  if (attrLevel !== null) return attrLevel;

  return null;
};

const findCityRoot = () => {
  for (const selector of CITY_ROOT_SELECTORS) {
    const node = document.querySelector(selector);
    if (node) return node;
  }

  return null;
};

const findBuildingHosts = () => {
  const root = findCityRoot();
  if (!root) return [];
  return Array.from(
    root.querySelectorAll('div[id^="position"].building')
  ).filter((node) => node instanceof HTMLElement);
};

const ensureBadge = (host, level) => {
  if (!host) return;

  let badge = host.querySelector(`:scope > .${LEVEL_BADGE_CLASS}`);
  if (!badge) {
    badge = document.createElement("span");
    badge.className = LEVEL_BADGE_CLASS;
    badge.setAttribute("aria-hidden", "true");
    host.appendChild(badge);
  }

  badge.textContent = String(level);
  badge.dataset.level = String(level);
  host.classList.add(LEVEL_HOST_CLASS);

  const style = window.getComputedStyle(host);
  if (style && style.position === "static") {
    host.style.position = "relative";
  }
};

const refreshBuildingBadges = () => {
  const now = Date.now();
  if (now - levelState.lastBadgeRefresh < 300) return;
  levelState.lastBadgeRefresh = now;

  const hosts = findBuildingHosts();
  for (const host of hosts) {
    const level = resolveLevelForHost(host);
    if (level === null) continue;
    ensureBadge(host, level);
  }
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
  if (open) {
    panel.removeAttribute("inert");
  } else {
    panel.setAttribute("inert", "");
  }
};

const updateTriggers = (open) => {
  const triggers = [
    document.getElementById(TAB_ID),
    document.getElementById(BANNER_ID),
  ];

  for (const trigger of triggers) {
    if (!trigger) continue;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
};

const closePanel = (panel) => {
  if (!panel) return;

  if (panel.contains(document.activeElement)) {
    const trigger =
      document.getElementById(BANNER_ID) || document.getElementById(TAB_ID);
    if (trigger) {
      trigger.focus();
    } else if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  state.open = false;
  setPanelOpen(panel, false);
  updateTriggers(false);
};

const openPanel = (panel) => {
  state.open = true;
  setPanelOpen(panel, true);
  updateTriggers(true);
};

const togglePanel = (panel) => {
  if (state.open) {
    closePanel(panel);
  } else {
    openPanel(panel);
  }
};

const handleDragStart = (event, panel) => {
  if (!state.open) return;
  if (event.button !== 0) return;
  if (event.target.closest(".hh-panel__close")) return;

  const windowEl = panel.querySelector(".hh-panel__window");
  if (!windowEl) return;

  const rect = windowEl.getBoundingClientRect();
  dragState.active = true;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.originX = rect.left;
  dragState.originY = rect.top;
  dragState.windowEl = windowEl;

  windowEl.style.left = `${rect.left}px`;
  windowEl.style.top = `${rect.top}px`;
  windowEl.style.transform = "none";

  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("mouseleave", handleDragEnd);
  document.body.style.userSelect = "none";
};

const handleDragMove = (event) => {
  if (!dragState.active || !dragState.windowEl) return;

  const windowEl = dragState.windowEl;
  const maxX = window.innerWidth - windowEl.offsetWidth - 8;
  const maxY = window.innerHeight - windowEl.offsetHeight - 8;

  const nextX = clamp(
    dragState.originX + (event.clientX - dragState.startX),
    8,
    Math.max(8, maxX)
  );
  const nextY = clamp(
    dragState.originY + (event.clientY - dragState.startY),
    8,
    Math.max(8, maxY)
  );

  windowEl.style.left = `${nextX}px`;
  windowEl.style.top = `${nextY}px`;
};

const handleDragEnd = () => {
  if (!dragState.active) return;

  dragState.active = false;
  dragState.windowEl = null;

  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("mouseleave", handleDragEnd);
  document.body.style.userSelect = "";
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
    togglePanel(panel);
  });

  return tab;
};

const createBanner = (panel) => {
  const banner = document.createElement("li");
  banner.id = BANNER_ID;
  banner.className = "expandable slot0 hh-banner";
  banner.setAttribute("role", "button");
  banner.setAttribute("tabindex", "0");
  banner.setAttribute("aria-controls", PANEL_ID);
  banner.setAttribute("aria-expanded", "false");

  banner.innerHTML = `
    <div class="image hh-banner__icon"></div>
    <div class="name"><span class="namebox">${TAB_LABEL}</span></div>
  `;

  banner.addEventListener("click", () => {
    togglePanel(panel);
  });

  banner.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePanel(panel);
    }
  });

  return banner;
};

const createPanel = () => {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "hh-panel";
  panel.setAttribute("inert", "");

  panel.innerHTML = `
    <div class="hh-panel__window" role="dialog" aria-label="${PANEL_TITLE}">
      <div class="hh-panel__header">
        <span class="hh-panel__title">${PANEL_TITLE}</span>
        <button type="button" class="hh-panel__close" aria-label="Close panel">x</button>
      </div>
      <div class="hh-panel__body">
        <p>Base scaffold is ready. QoL features will appear here.</p>
      </div>
    </div>
  `;

  panel.querySelector(".hh-panel__close").addEventListener("click", () => {
    closePanel(panel);
  });

  panel
    .querySelector(".hh-panel__header")
    .addEventListener("mousedown", (event) => {
      handleDragStart(event, panel);
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
  tab.textContent = TAB_LABEL;

  const nav = findNavContainer();
  placeTab(tab, nav);

  const bannerContainer = document.querySelector(LEFT_MENU_SELECTOR);
  if (bannerContainer) {
    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
      banner = createBanner(panel);
      bannerContainer.appendChild(banner);
    }

    const nameBox = banner.querySelector(".namebox");
    if (nameBox) {
      nameBox.textContent = TAB_LABEL;
    }
  }

  setPanelOpen(panel, state.open);
  updateTriggers(state.open);
  refreshBuildingBadges();
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
