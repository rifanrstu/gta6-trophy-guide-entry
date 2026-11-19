// data.js — loads the trophy list and answers plain questions about it:
// grades, kinds, roadmap stages, counters and source lines. No state lives
// here; store.js owns progress, views.js owns markup.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABEL = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const GRADE_FILTERS = [
  { id: 'all', label: 'All grades' },
  { id: 'platinum', label: 'Platinum' },
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'bronze', label: 'Bronze' },
];

// The kind filters the checklist offers. 'missable' and 'counters' are not
// stored kinds in the data — they are flags (a missable window, a numeric
// PSN target), and bucketsOf() below folds them in. 'online' is listed
// because the rules ask for the filter; this list simply has none.
export const KIND_FILTERS = [
  { id: 'all', label: 'All kinds' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'counters', label: 'Counters' },
  { id: 'side', label: 'Side work' },
  { id: 'world', label: 'Open world' },
  { id: 'online', label: 'Online' },
];

export const KIND_LABEL = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  counters: 'Counter',
  side: 'Side work',
  world: 'Open world',
  online: 'Online',
};

// The four-stage road to the platinum, in the order a first playthrough
// should meet them. Stage membership is computed by stageOf(), never stored,
// so the roadmap can never drift out of step with the checklist.
export const STAGES = [
  {
    n: 1,
    title: 'Walk the story',
    blurb: 'Play the campaign start to finish. Twelve trophies sit on the critical path and ask for nothing but progress.',
    watch: 'One trophy in this whole guide can be missed for good, and its window is in Chapter 1 — read the Missables page before the story carries you past Jason\u2019s house.',
  },
  {
    n: 2,
    title: 'Threads between missions',
    blurb: 'The side work: jobs and storylines that run alongside the campaign and are easiest to finish while their people are still on the map.',
    watch: 'Side threads reward finishing what you start — several only count their closing job, so a thread left half-done earns nothing.',
  },
  {
    n: 3,
    title: 'Sweeps and tallies',
    blurb: 'Collectible sets and the nineteen counted trophies with PlayStation progress targets, worked steadily rather than in one grind.',
    watch: 'A tally banks when its activity closes out. Quitting mid-run is the classic way to lose the last point of a counter.',
  },
  {
    n: 4,
    title: 'The open-world residue',
    blurb: 'Free-roam feats and activities with no mission wrapped around them — and, when the other 54 are in, the platinum itself.',
    watch: 'Save the calm free-roam attempts for last and keep your wanted level down; a chase ruins more attempts than any difficulty spike.',
  },
];

export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json answered ${res.status}`);
  const parsed = await res.json();
  const list = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(list)) throw new Error('trophies.json holds no trophy array');
  return list;
}

export function hasTarget(trophy) {
  return typeof trophy.target === 'number' && trophy.target > 0;
}

// Every filter bucket a trophy belongs to: its stored kind, plus 'missable'
// when its window can close, plus 'counters' when PlayStation counts it.
export function bucketsOf(trophy) {
  const buckets = new Set();
  if (trophy.kind) buckets.add(trophy.kind);
  if (trophy.missable) buckets.add('missable');
  if (hasTarget(trophy)) buckets.add('counters');
  return buckets;
}

export function stageOf(trophy) {
  if (trophy.grade === 'platinum') return 4;
  if (trophy.kind === 'story' || trophy.missable) return 1;
  if (trophy.kind === 'side') return 2;
  if (trophy.kind === 'collectibles' || hasTarget(trophy)) return 3;
  return 4;
}

export function gradeRank(trophy) {
  const rank = GRADE_ORDER.indexOf(trophy.grade);
  return rank === -1 ? GRADE_ORDER.length : rank;
}

// The sources line for a trophy's guide pane: the data's own sources value
// when it carries one (a string, or a list to join), otherwise the standing
// citation for the whole list.
export function sourcesText(trophy) {
  const raw = trophy.sources;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length) return raw.filter(Boolean).join(' · ');
  return 'Exophase, for the official list (name, description, grade) · PSNProfiles, for PSN\u2019s progress targets';
}

export function countByGrade(trophies) {
  const tally = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (t.grade in tally) tally[t.grade] += 1;
  return tally;
}
