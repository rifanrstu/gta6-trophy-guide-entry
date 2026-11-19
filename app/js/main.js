// Leonida Ledger — boot and wiring.
// Loads the catalogue, restores (or demo-seeds) the saved progress,
// renders the masthead, tabs and the active view, and translates every
// click, keystroke and file choice into a store update plus a repaint.

import { fetchTrophies } from "./data.js";
import {
  exportProgress,
  importProgress,
  isEarned,
  loadProgress,
  saveProgress,
  seedDemoProgress,
  setCounter,
  setNote,
  summaryLine,
  toggleEarned,
} from "./store.js";
import {
  guideView,
  headerView,
  missablesView,
  navView,
  plannerView,
  roadmapView,
  saveView,
} from "./views.js";

const VIEW_IDS = ["guide", "roadmap", "missables", "planner", "save"];

const state = {
  trophies: [],
  progress: null,
  view: "guide",
  search: "",
  kind: "all",
  grade: "all",
  stateFilter: "all",
  selected: null,
};

function viewFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return VIEW_IDS.includes(raw) ? raw : "guide";
}

function uiState() {
  return {
    search: state.search,
    kind: state.kind,
    grade: state.grade,
    state: state.stateFilter,
    shieldOn: state.progress.shieldOn,
    selected: state.selected,
  };
}

function render() {
  const root = document.getElementById("ledger-root");
  if (!root) return;
  const views = {
    guide: () => guideView(state.trophies, state.progress, uiState()),
    roadmap: () => roadmapView(state.trophies, state.progress),
    missables: () => missablesView(state.trophies, state.progress),
    planner: () => plannerView(state.trophies, state.progress),
    save: () => saveView(state.trophies, state.progress),
  };
  root.innerHTML =
    headerView(state.trophies, state.progress) +
    navView(state.view) +
    `<main class="lx-main" id="view-main">${views[state.view]()}</main>`;
  restoreFilterFocus();
}

function restoreFilterFocus() {
  if (state.view !== "guide") return;
  const searchBox = document.getElementById("filter-search");
  if (searchBox && document.activeElement?.id === "filter-search-marker") {
    searchBox.focus();
    searchBox.setSelectionRange(searchBox.value.length, searchBox.value.length);
  }
}

function findTrophy(name) {
  return state.trophies.find((trophy) => trophy.name === name) ?? null;
}

function handleActionClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const trophy = button.dataset.name ? findTrophy(button.dataset.name) : null;

  if (action === "select" && trophy) {
    state.selected = trophy.name;
    render();
    return;
  }
  if (action === "toggle-earned" && trophy) {
    if (button.type === "checkbox") return; // the change handler owns it
    toggleEarned(state.progress, trophy);
    state.selected = trophy.name;
    render();
    return;
  }
  if (action === "counter-step" && trophy) {
    const delta = Number(button.dataset.delta ?? "0");
    const current = state.progress.counters[trophy.name] ?? 0;
    setCounter(state.progress, trophy, current + delta);
    state.selected = trophy.name;
    render();
    return;
  }
  if (action === "export") {
    exportProgress(state.progress);
    flashSaveFeedback("Progress exported as a JSON file.");
    return;
  }
  if (action === "copy-summary") {
    const line = summaryLine(state.progress, state.trophies);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(line)
        .then(() => flashSaveFeedback("Summary copied: " + line))
        .catch(() => flashSaveFeedback(line));
    } else {
      flashSaveFeedback(line);
    }
    return;
  }
  if (action === "reset") {
    state.progress.earned = {};
    state.progress.counters = {};
    state.progress.notes = {};
    saveProgress(state.progress);
    render();
    flashSaveFeedback("Ledger reset. Nothing is earned, counted or noted now.");
  }
}

function flashSaveFeedback(message) {
  const spot = document.getElementById("save-feedback");
  if (spot) spot.textContent = message;
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "filter-kind") {
    state.kind = target.value;
    render();
  } else if (target.id === "filter-grade") {
    state.grade = target.value;
    render();
  } else if (target.id === "filter-state") {
    state.stateFilter = target.value;
    render();
  } else if (target.id === "toggle-shield") {
    state.progress.shieldOn = target.checked;
    saveProgress(state.progress);
    render();
  } else if (target.dataset.action === "toggle-earned") {
    const trophy = findTrophy(target.dataset.name);
    if (trophy) {
      toggleEarned(state.progress, trophy);
      state.selected = trophy.name;
      render();
    }
  } else if (target.id === "import-file") {
    const file = target.files?.[0];
    if (!file) return;
    importProgress(file)
      .then((clean) => {
        state.progress = clean;
        state.view = "save";
        render();
        flashSaveFeedback("Progress imported. The ledger now matches the file.");
      })
      .catch(() => flashSaveFeedback("That file could not be read as a ledger export."));
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.id === "filter-search") {
    target.id = "filter-search-marker";
    state.search = target.value;
    render();
  } else if (target.id === "note-editor") {
    const trophy = findTrophy(target.dataset.name);
    if (trophy) {
      setNote(state.progress, trophy, target.value);
    }
  }
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  state.trophies = await fetchTrophies();
  const saved = loadProgress();
  const hasSavedMarks =
    Object.keys(saved.earned).length > 0 ||
    Object.keys(saved.counters).length > 0;
  if (params.has("demo") && !hasSavedMarks) {
    state.progress = seedDemoProgress(state.trophies);
  } else {
    state.progress = saved;
  }
  const focusName = params.get("focus");
  if (focusName && findTrophy(focusName)) {
    state.selected = focusName;
  } else {
    const firstOpen = state.trophies.find(
      (trophy) => trophy.target && !isEarned(state.progress, trophy),
    );
    state.selected = (firstOpen ?? state.trophies[0])?.name ?? null;
  }
  state.view = viewFromHash();
  render();
}

window.addEventListener("hashchange", () => {
  state.view = viewFromHash();
  render();
});
document.addEventListener("click", handleActionClick);
document.addEventListener("change", handleChange);
document.addEventListener("input", handleInput);

boot().catch((error) => {
  const root = document.getElementById("ledger-root");
  if (root) {
    root.innerHTML = `<p class="lx-load-error">The ledger could not open: ${String(error?.message ?? error)}</p>`;
  }
});
