// GTA VI Trophy Atlas — trophy data loading, labels, the roadmap, and display rules
// (including the spoiler shield). The trophy facts themselves live in data/trophies.json,
// each with the sources its guide cites; this file never invents a fact of its own.

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Side strand',
  completion: 'Completion',
  activities: 'Activities',
  collectibles: 'Collectibles',
  world: 'World & crime',
};

export async function loadTrophyDoc() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('trophies.json did not load');
  return response.json();
}

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

// Spoiler shield: a story trophy the player has not earned yet shows neither its
// name nor its official description — only its grade, kind and roadmap stage.
export function isMasked(trophy, state, earned) {
  return state.spoiler && isStoryTrophy(trophy) && !earned;
}

export function displayName(trophy, state, earned) {
  return isMasked(trophy, state, earned) ? '••• Story trophy — spoiler shield on •••' : trophy.name;
}

export function displayDescription(trophy, state, earned) {
  return isMasked(trophy, state, earned)
    ? 'Hidden by the spoiler shield until you earn it. Turn the shield off in Save & settings to peek.'
    : trophy.description;
}

// Which checklist filter chip a trophy belongs to. The official list contains no
// online trophies, so the "online" chip matches nothing — on purpose, and the
// app says so next to the chip rather than quietly showing an empty list.
export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'online') return false;
  if (kind === 'story') return trophy.kind === 'story' || trophy.kind === 'side';
  if (kind === 'collectibles') return trophy.tags?.includes('collectibles') || trophy.kind === 'collectibles';
  if (kind === 'activities') return trophy.tags?.includes('activities') || trophy.kind === 'activities';
  return trophy.kind === kind;
}

// The roadmap, in the order the cited guides measured: story first (banking
// counters as you travel), then the 100% checklist, then strands and clean-up,
// then the platinum itself. Trophy names under each step are filled in from
// data/trophies.json by stage, so the roadmap can never drift from the list.
export const ROADMAP = [
  {
    stage: 1,
    title: 'Step 1 — Story first, counters as you travel',
    when: 'Chapters 1–5 · about 60–80 hours · Sources: PowerPyx roadmap Step 1; GTABase',
    body: 'Play the five chapters in order. Story trophies unlock automatically as their named mission or chapter completes, and there is no mission replay — so keep a manual save at the start of every chapter and one before the final mission. Before Chapter 1 ends, do the balcony meditation at Jason’s house (Positive Mental Attitude): it is the one reported missable in the list. All through the story, scan new vehicles, study animals through binoculars, try each of the nine activity types once, and rob alongside your partner while both heroes are together.',
  },
  {
    stage: 2,
    title: 'Step 2 — The 100% checklist and the big counters',
    when: 'After the credits · about 100 hours · Sources: PowerPyx roadmap Step 2; GTABase checklist; Push Square',
    body: 'Open Progress → Stats → 100% Completion and work the checklist down; story progress already counts, and the targets are partial (70 of 80 challenges, 15 of 18 card sets, 200 of 277 vehicle scans). This is where the counters live: 250 stunts, 42 Shooting Range golds, drone races at 14 Top Fun locations, 20 different race wins, 100 WAiNK spots, the full Leonida map, vaults, trucks and gang operations. A Long Road (gold) lands when the checklist does.',
  },
  {
    stage: 3,
    title: 'Step 3 — Strands, characters and money clean-up',
    when: 'Free roam · about 10 hours plus money time · Sources: PowerPyx roadmap Step 3',
    body: 'Finish the character strands to their final missions — Andy, Kenton, Billy, Randy, Tyrone and Bret’s hunt — until eight stranger strands are complete. Then close the money trophies: launder $250,000 of Marked Bills through contacts, spend $100,000 across shops, buy every garage property and register ten keeper vehicles to the Scooter Bros app.',
  },
  {
    stage: 4,
    title: 'Step 4 — The platinum check',
    when: 'Minutes · Source: official list (Exophase)',
    body: 'Open the checklist here and filter to unearned. If it is empty, Vice Got a Price! is yours — the platinum unlocks by itself when the other 54 are earned. If a cryptic bronze is all that remains (Personal Best, Bad Luck I Guess, The Truth Is Out There), its guide in this atlas says honestly what is and is not confirmed, instead of sending you to a made-up coordinate.',
  },
];

export function stageTrophies(trophies, stage) {
  return trophies.filter((trophy) => trophy.stage === stage);
}

// Per-step progress for the roadmap view: how much of each step the saved
// tracker already covers, so the roadmap reads as a plan with a position on
// it rather than a static essay.
export function stepProgress(trophies, state, isEarned, stage) {
  const inStep = stageTrophies(trophies, stage);
  const earned = inStep.filter((trophy) => isEarned(state, trophy)).length;
  return { earned, total: inStep.length, pct: inStep.length ? Math.round((earned / inStep.length) * 100) : 0 };
}

// A plain-text progress summary the player can paste anywhere (a forum post,
// a message to a co-op partner): counts by grade, the counters under way and
// the next three trophies the planner would send them to.
export function shareSummary(doc, state, isEarned, counterOf, plannerOrderFn) {
  const trophies = doc.trophies;
  const earned = trophies.filter((t) => isEarned(state, t));
  const byGrade = (grade) => `${earned.filter((t) => t.grade === grade).length}/${trophies.filter((t) => t.grade === grade).length} ${grade}`;
  const lines = [
    `GTA VI Trophy Atlas — my platinum run: ${earned.length}/55 trophies`,
    ['platinum', 'gold', 'silver', 'bronze'].map(byGrade).join(' · '),
  ];
  const counters = trophies.filter((t) => t.target && counterOf(state, t) > 0 && !isEarned(state, t));
  if (counters.length) {
    lines.push('Counters under way: ' + counters.map((t) => `${t.name} ${counterOf(state, t)}/${t.target}`).join('; '));
  }
  const next = plannerOrderFn(trophies, state, isEarned, counterOf).slice(0, 3);
  if (next.length) lines.push('Next up: ' + next.map((t) => t.name).join(' → '));
  return lines.join('\n');
}

export function plannerReason(trophy, state, counterOf) {
  if (trophy.missable) return 'Missable — its Chapter 1 window closes first. Do this before anything else.';
  if (trophy.kind === 'story') return 'Story — unlocks automatically at its mission or chapter; keep a save at the chapter start.';
  if (trophy.kind === 'side') return 'Side strand — finish the whole strand, not just the next job.';
  if (trophy.target) {
    const now = counterOf(state, trophy);
    return now > 0
      ? `Counter at ${now} of ${trophy.target} ${trophy.targetLabel ?? ''} — already moving, keep banking it.`
      : `Counter trophy — ${trophy.target} ${trophy.targetLabel ?? ''} in total; start it early and log progress here.`;
  }
  if (trophy.kind === 'collectibles') return 'Collectible sweep — pair it with exploring a new district.';
  return 'Clean-up — a one-off moment; its guide says exactly what is confirmed and what is not.';
}

export function plannerOrder(trophies, state, isEarned, counterOf) {
  const weight = (trophy) => {
    if (trophy.missable) return 0;
    if (trophy.kind === 'story') return 1;
    if (trophy.target && counterOf(state, trophy) > 0) return 2;
    return 3 + (trophy.stage ?? 9);
  };
  return trophies
    .filter((trophy) => !isEarned(state, trophy))
    .sort((a, b) => weight(a) - weight(b) || (a.stage ?? 9) - (b.stage ?? 9) || a.id - b.id);
}
