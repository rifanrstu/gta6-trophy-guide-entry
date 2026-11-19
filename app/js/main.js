// main.js — boots the ledger: loads the list, opens the store, paints the
// current tab and wires every control. Tabs live in the URL hash so the
// roadmap, missables, planner and save screens are all one address away.

import { countByGrade, loadTrophies } from './data.js';
import { createStore } from './store.js';
import { checklistHTML, missablesHTML, nextHTML, roadmapHTML, saveHTML } from './views.js';

const view = document.getElementById('view');
const earnedCountEl = document.getElementById('earned-count');
const earnedBarEl = document.getElementById('earned-bar');
const gradeLineEl = document.getElementById('grade-line');

const ui = { tab: 'checklist', grade: 'all', kind: 'all', query: '', selected: null };
let trophies = [];
let store = null;

function tabFromHash() {
  const name = (location.hash || '').replace('#/', '');
  return ['checklist', 'roadmap', 'missables', 'next', 'save'].includes(name) ? name : 'checklist';
}

function paintMasthead() {
  const earned = store.earnedCount();
  earnedCountEl.textContent = String(earned);
  earnedBarEl.style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  const by = countByGrade(trophies);
  gradeLineEl.textContent = `${by.platinum} platinum · ${by.gold} gold · ${by.silver} silver · ${by.bronze} bronze`;
}

function render() {
  document.querySelectorAll('#tabs .tab').forEach((btn) => {
    btn.classList.toggle('is-on', btn.dataset.tab === ui.tab);
  });
  const ctx = { trophies, store, ui };
  if (ui.tab === 'roadmap') view.innerHTML = roadmapHTML(ctx);
  else if (ui.tab === 'missables') view.innerHTML = missablesHTML(ctx);
  else if (ui.tab === 'next') view.innerHTML = nextHTML(ctx);
  else if (ui.tab === 'save') view.innerHTML = saveHTML(ctx);
  else view.innerHTML = checklistHTML(ctx);
  paintMasthead();
}

function go(tab) {
  ui.tab = tab;
  const target = `#/${tab}`;
  if (location.hash !== target) history.replaceState(null, '', target);
  render();
}

function selectedTrophy() {
  return trophies.find((t) => t.name === ui.selected) || trophies[0];
}

function say(message) {
  const el = document.getElementById('save-msg');
  if (el) el.textContent = message;
}

document.addEventListener('click', (event) => {
  const tabBtn = event.target.closest('#tabs .tab');
  if (tabBtn) {
    go(tabBtn.dataset.tab);
    return;
  }
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'grade') {
    ui.grade = el.dataset.value;
    render();
  } else if (action === 'select' || action === 'jump') {
    ui.selected = el.dataset.name;
    if (action === 'jump') go('checklist');
    else render();
  } else if (action === 'toggle-earned') {
    store.toggleEarned(selectedTrophy().name);
    render();
  } else if (action === 'count-up' || action === 'count-down') {
    const t = selectedTrophy();
    store.setCount(t, store.countOf(t) + (action === 'count-up' ? 1 : -1));
    render();
  } else if (action === 'export') {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dusk-ledger-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
    say('Exported. Keep the file somewhere safe — it is the only copy of this save outside the browser.');
  } else if (action === 'import-paste') {
    const box = document.getElementById('import-box');
    try {
      store.importJSON(box.value);
      render();
      say('Imported. The ledger now shows the pasted save.');
    } catch (err) {
      say(`That paste would not import: ${err.message}`);
    }
  } else if (action === 'reset') {
    if (confirm('Clear every tick, counter and note from this ledger?')) {
      store.reset();
      render();
      say('Cleared. A fresh ledger, ready for a fresh run.');
    }
  }
});

document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.matches('[data-action-select="kind"]')) {
    ui.kind = el.value;
    render();
  } else if (el.matches('[data-action-check="spoilers"]')) {
    store.setSpoilers(el.checked);
    render();
  } else if (el.matches('[data-count-input]')) {
    store.setCount(selectedTrophy(), el.value);
    render();
  } else if (el.id === 'import-file' && el.files && el.files[0]) {
    el.files[0]
      .text()
      .then((text) => {
        store.importJSON(text);
        render();
        say('Imported from file. The ledger now shows that save.');
      })
      .catch((err) => say(`That file would not import: ${err.message}`));
  }
});

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.id === 'search-box') {
    ui.query = el.value;
    // Rebuild only the list pane so the search box keeps focus and caret.
    const ctx = { trophies, store, ui };
    const fresh = document.createElement('div');
    fresh.innerHTML = checklistHTML(ctx);
    const newList = fresh.querySelector('.list-pane');
    const oldList = view.querySelector('.list-pane');
    if (newList && oldList) oldList.replaceWith(newList);
    const meta = fresh.querySelector('.list-meta');
    const oldMeta = view.querySelector('.list-meta');
    if (meta && oldMeta) oldMeta.replaceWith(meta);
  } else if (el.matches('[data-note]')) {
    store.setNote(selectedTrophy().name, el.value);
  }
});

window.addEventListener('hashchange', () => {
  const tab = tabFromHash();
  if (tab !== ui.tab) go(tab);
});

async function boot() {
  try {
    trophies = await loadTrophies();
    store = createStore(trophies, location.search);
    const params = new URLSearchParams(location.search);
    const openIndex = Number(params.get('open'));
    if (Number.isInteger(openIndex) && trophies[openIndex]) ui.selected = trophies[openIndex].name;
    if (!ui.selected && trophies[0]) ui.selected = trophies[0].name;
    ui.tab = tabFromHash();
    render();
  } catch (err) {
    view.innerHTML = `<p class="loading">The ledger would not open: ${err.message}. Serve this folder over HTTP (node serve.ts in the repository root) rather than opening the file directly.</p>`;
  }
}

boot();
