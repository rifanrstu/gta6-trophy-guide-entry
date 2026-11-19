// store.js — the player's progress: earned ticks, counter tallies and
// private notes, kept in localStorage and exportable as one JSON file.
// A ?demo=13 address seeds a believable mid-run ledger in memory only
// (13 earned, two counters part-way) so screenshots show a lived-in page;
// the seed is never written over a real save.

const STORAGE_KEY = 'dusk-ledger-progress-v1';
const DEMO_EARNED_INDEXES = [0, 4, 8, 13, 17, 21, 26, 30, 34, 39, 43, 47, 52];

function blankState() {
  return { earned: {}, counts: {}, notes: {}, spoilers: true };
}

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return { ...blankState(), ...parsed };
  } catch {
    return null;
  }
}

function seedDemo(trophies) {
  const state = blankState();
  DEMO_EARNED_INDEXES.forEach((i) => {
    if (trophies[i]) state.earned[trophies[i].name] = true;
  });
  const counted = trophies.filter((t) => typeof t.target === 'number' && t.target > 0);
  if (counted[0]) state.counts[counted[0].name] = Math.ceil(counted[0].target / 2);
  if (counted[1]) state.counts[counted[1].name] = Math.ceil(counted[1].target / 3);
  return state;
}

export function createStore(trophies, search = '') {
  const params = new URLSearchParams(search);
  const wantsDemo = params.get('demo') === '13';
  let state = readSaved();
  let demoMode = false;
  if (!state && wantsDemo) {
    state = seedDemo(trophies);
    demoMode = true;
  }
  if (!state) state = blankState();

  function persist() {
    if (demoMode) return; // a screenshot seed must not become someone's save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the page keeps working in memory */
    }
  }

  return {
    get spoilers() {
      return state.spoilers !== false;
    },
    setSpoilers(on) {
      state.spoilers = !!on;
      persist();
    },
    isEarned(name) {
      return !!state.earned[name];
    },
    toggleEarned(name) {
      if (state.earned[name]) delete state.earned[name];
      else state.earned[name] = true;
      persist();
      return !!state.earned[name];
    },
    earnedCount() {
      return Object.keys(state.earned).length;
    },
    countOf(trophy) {
      return Math.min(state.counts[trophy.name] || 0, trophy.target || 0);
    },
    setCount(trophy, value) {
      const ceiling = trophy.target || 0;
      const next = Math.max(0, Math.min(ceiling, Math.floor(Number(value) || 0)));
      if (next > 0) state.counts[trophy.name] = next;
      else delete state.counts[trophy.name];
      if (next >= ceiling && ceiling > 0) state.earned[trophy.name] = true;
      persist();
      return next;
    },
    noteOf(name) {
      return state.notes[name] || '';
    },
    setNote(name, text) {
      const clean = String(text || '').slice(0, 2000);
      if (clean.trim()) state.notes[name] = clean;
      else delete state.notes[name];
      persist();
    },
    exportJSON() {
      return JSON.stringify(
        { app: 'dusk-ledger', version: 1, exportedAt: new Date().toISOString(), progress: state },
        null,
        2,
      );
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      const incoming = parsed && parsed.progress ? parsed.progress : parsed;
      if (!incoming || typeof incoming !== 'object') throw new Error('That file holds no progress object.');
      state = {
        earned: incoming.earned && typeof incoming.earned === 'object' ? incoming.earned : {},
        counts: incoming.counts && typeof incoming.counts === 'object' ? incoming.counts : {},
        notes: incoming.notes && typeof incoming.notes === 'object' ? incoming.notes : {},
        spoilers: incoming.spoilers !== false,
      };
      demoMode = false;
      persist();
    },
    reset() {
      state = blankState();
      demoMode = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to remove */
      }
    },
  };
}
