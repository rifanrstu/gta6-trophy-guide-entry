// GTA VI Trophy Atlas — saved progress (localStorage only, nothing leaves the browser).
// Revision in this build: the export file is version 2 and also carries a small
// human-readable summary line count (earned, of 55) so a player can sanity-check
// a file before importing it; importing still accepts version 1 files and plain
// earned-name arrays from the first build, because a progress file a player
// saved last week must never become unreadable just because the atlas improved.
export const STORE_KEY = 'gta6-trophy-atlas-v1';
export const EXPORT_VERSION = 2;

export function emptyState() {
  return { earned: [], counters: {}, notes: {}, spoiler: true, demo: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
      demo: parsed.demo === true,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function isEarned(state, trophy) {
  return state.earned.includes(trophy.name);
}

export function countEarned(state, trophies) {
  return trophies.filter((trophy) => isEarned(state, trophy)).length;
}

export function setEarned(state, trophy, on) {
  const set = new Set(state.earned);
  if (on) set.add(trophy.name);
  else set.delete(trophy.name);
  state.earned = [...set];
  saveState(state);
}

export function counterOf(state, trophy) {
  const value = Number(state.counters[trophy.name] ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function setCounter(state, trophy, value) {
  const clean = Math.max(0, Math.floor(Number(value) || 0));
  if (trophy.target) state.counters[trophy.name] = Math.min(clean, trophy.target);
  else state.counters[trophy.name] = clean;
  saveState(state);
}

export function exportPayload(state) {
  return JSON.stringify(
    {
      app: 'gta6-trophy-atlas',
      version: EXPORT_VERSION,
      earned: state.earned,
      earnedCount: state.earned.length,
      ofTotal: 55,
      counters: state.counters,
      notes: state.notes,
      spoiler: state.spoiler,
    },
    null,
    2,
  );
}

export function importPayload(state, text, validNames) {
  const parsed = JSON.parse(text);
  const earnedIn = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(earnedIn)) throw new Error('No earned list in that file.');
  state.earned = earnedIn.filter((name) => validNames.has(name));
  if (!Array.isArray(parsed)) {
    if (parsed.counters && typeof parsed.counters === 'object') {
      // Keep only counters that are real numbers; a hand-edited file should
      // never be able to poison the tracker with a string where a count goes.
      state.counters = Object.fromEntries(
        Object.entries(parsed.counters).filter(([, value]) => Number.isFinite(Number(value))),
      );
    }
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  }
  saveState(state);
  return state.earned.length;
}

// A fixed, honest demo: 13 of 55 earned and five counters part-way, so a first-time
// visitor (or a screenshot) can see the tracker working before ticking anything.
// The revision keeps the same 13 — a demo that quietly inflated its numbers
// would be lying about the very progress this app exists to track.
export function demoState() {
  const state = emptyState();
  state.demo = true;
  state.spoiler = false;
  state.earned = [
    'Just Like Paradise',
    'Paradise Lost',
    'T**s Ass Drug Money',
    'Trust',
    'Break the Bank',
    'Master of None',
    'Stick Fiddler',
    'Hot Together',
    'Whip It Good',
    'In The Beginning…',
    'Actions Speak Louder',
    'Vice City, Baby!',
    'Family Matters',
  ];
  state.counters = {
    'The Shootist': 12,
    'Cunning Stunts': 64,
    'You WAiNKer!': 23,
    'Strangers & Freaks': 3,
    "Don't Touch My Deck": 1,
    'Positive Mental Attitude': 1,
  };
  state.notes = { 'Positive Mental Attitude': 'Balcony spot done in Chapter 1 — 17 spots to go. Steps 2 and 3 are the free-roam sweep.' };
  return state;
}
