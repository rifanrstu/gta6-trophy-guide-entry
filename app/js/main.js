// GTA VI Trophy Atlas — boot, tabs, filters and wiring.
// Deep links work too: ?view=roadmap|missables|planner|save, ?kind=missable,
// ?select=<trophy name>, ?spoiler=off, ?demo=1 (a 13-of-55 demo progress).
import { loadTrophyDoc, matchesKind, plannerOrder, shareSummary } from './data.js';
import { demoState, exportPayload, importPayload, isEarned, loadState, saveState, setCounter, setEarned } from './store.js';
import { renderChecklist, renderDetail, renderMissables, renderPlanner, renderRoadmap, renderScorecard, renderSourcesIndex } from './views.js';

const params = new URLSearchParams(location.search);
let state = loadState();
if (params.get('demo') === '1' && state.earned.length === 0 && !state.demo) {
  state = demoState();
  saveState(state);
}
if (params.get('spoiler') === 'off') state.spoiler = false;
if (params.get('spoiler') === 'on') state.spoiler = true;

const doc = await loadTrophyDoc();
const validNames = new Set(doc.trophies.map((t) => t.name));

const ui = {
  view: ['roadmap', 'missables', 'planner', 'save'].includes(params.get('view')) ? params.get('view') : 'checklist',
  kind: params.get('kind') ?? 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  selected: validNames.has(params.get('select')) ? params.get('select') : 'Positive Mental Attitude',
  matches(trophy, earned) {
    if (this.hideEarned && earned) return false;
    if (this.grade !== 'all' && trophy.grade !== this.grade) return false;
    if (!matchesKind(trophy, this.kind)) return false;
    if (this.query) {
      const hay = `${trophy.name} ${trophy.description} ${trophy.kind} ${trophy.guide}`.toLowerCase();
      if (!hay.includes(this.query.toLowerCase())) return false;
    }
    return true;
  },
};

const els = {
  earnedCount: document.getElementById('earned-count'),
  barFill: document.getElementById('bar-fill'),
  gradeLine: document.getElementById('grade-line'),
  nextLine: document.getElementById('next-line'),
  list: document.getElementById('trophy-list'),
  detail: document.getElementById('detail'),
  resultLine: document.getElementById('result-line'),
  onlineNote: document.getElementById('online-note'),
  roadmapSteps: document.getElementById('roadmap-steps'),
  missableList: document.getElementById('missable-list'),
  plannerList: document.getElementById('planner-list'),
  sourcesIndex: document.getElementById('sources-index'),
  saveStatus: document.getElementById('save-status'),
  plannerHelpers: { plannerOrder },
};

function refresh() {
  renderScorecard(doc, state, els);
  const next = plannerOrder(doc.trophies, state, isEarned, (s, t) => Number(s.counters[t.name] ?? 0) || 0)[0];
  els.nextLine.textContent = next
    ? `Next up: ${next.name} — ${next.missable ? 'missable, window first' : next.kind === 'story' ? 'story, automatic on completion' : 'see its guide and sources in the checklist'}.`
    : 'Next up: nothing — all 55 earned. Platinum unlocked.';
  renderChecklist(doc, state, ui, els, selectTrophy, toggleEarned);
  renderDetail(doc, state, els, detailHandlers);
  renderRoadmap(doc, state, els);
  renderMissables(doc, els);
  renderPlanner(doc, state, els);
  renderSourcesIndex(doc, els);
  for (const toggle of [document.getElementById('spoiler-toggle'), document.getElementById('spoiler-toggle-2')]) {
    if (toggle) toggle.checked = state.spoiler;
  }
}

function selectTrophy(name) {
  ui.selected = name;
  refresh();
}

function toggleEarned(trophy, on) {
  setEarned(state, trophy, on);
  refresh();
}

const detailHandlers = {
  get selectedName() {
    return ui.selected;
  },
  onToggle: toggleEarned,
  onCounter(trophy, value) {
    setCounter(state, trophy, value);
    refresh();
  },
  onNote(trophy, value) {
    state.notes[trophy.name] = value;
    saveState(state);
  },
};

function showView(view) {
  ui.view = view;
  for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('is-active', tab.dataset.view === view);
  for (const section of document.querySelectorAll('.view')) section.hidden = section.id !== `view-${view}`;
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}
for (const chip of document.querySelectorAll('#kind-chips .chip')) {
  chip.classList.toggle('is-active', chip.dataset.kind === ui.kind);
  chip.addEventListener('click', () => {
    ui.kind = chip.dataset.kind;
    for (const other of document.querySelectorAll('#kind-chips .chip')) other.classList.toggle('is-active', other === chip);
    refresh();
  });
}
document.getElementById('search').addEventListener('input', (event) => {
  ui.query = event.target.value;
  refresh();
});
document.getElementById('grade-filter').addEventListener('change', (event) => {
  ui.grade = event.target.value;
  refresh();
});
document.getElementById('hide-earned').addEventListener('change', (event) => {
  ui.hideEarned = event.target.checked;
  refresh();
});
for (const toggleId of ['spoiler-toggle', 'spoiler-toggle-2']) {
  document.getElementById(toggleId).addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveState(state);
    refresh();
  });
}
document.getElementById('demo-btn').addEventListener('click', () => {
  state = demoState();
  saveState(state);
  els.saveStatus.textContent = 'Demo progress loaded: 13 of 55 earned, five counters part-way, spoiler shield off so story names show. Reset restores a blank tracker.';
  refresh();
});
document.getElementById('share-btn').addEventListener('click', async () => {
  const summary = shareSummary(doc, state, isEarned, (s, t) => Number(s.counters[t.name] ?? 0) || 0, plannerOrder);
  try {
    await navigator.clipboard.writeText(summary);
    els.saveStatus.textContent = 'Progress summary copied to the clipboard — paste it anywhere.';
  } catch {
    els.saveStatus.textContent = summary;
  }
});
document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([exportPayload(state)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-atlas-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
  els.saveStatus.textContent = 'Exported — earned ticks, counters, notes and settings are in the downloaded file.';
});
document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const count = importPayload(state, await file.text(), validNames);
    els.saveStatus.textContent = `Imported ${count} earned trophies from that file.`;
  } catch {
    els.saveStatus.textContent = 'That file could not be imported — it is not an atlas progress file.';
  }
  refresh();
});
document.getElementById('reset-btn').addEventListener('click', () => {
  state = { earned: [], counters: {}, notes: {}, spoiler: state.spoiler, demo: false };
  saveState(state);
  els.saveStatus.textContent = 'Progress reset. The atlas itself is untouched.';
  refresh();
});

showView(ui.view);
refresh();
