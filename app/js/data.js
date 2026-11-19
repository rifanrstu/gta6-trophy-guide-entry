// Leonida Ledger — data layer.
// Loads the trophy catalogue that ships with the app, normalises every
// record into the shape the views expect, and owns the static knowledge
// the guide is organised around: grade order, kind labels, the four
// roadmap stages and the confidence badge explanations.

export const GRADE_SEQUENCE = ["platinum", "gold", "silver", "bronze"];

export const GRADE_LABEL = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

export const KIND_LABEL = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  counters: "Counters",
  side: "Side jobs",
  world: "Open world",
  online: "Online",
};

export const KIND_SEQUENCE = [
  "story",
  "missable",
  "collectibles",
  "activities",
  "counters",
  "side",
  "world",
  "online",
];

// The platinum road, in the order a first run should walk it. Membership
// is decided by kind (and, for the finale, by the platinum itself), and
// every stage carries the warning its trophies deserve.
export const ROAD_STAGES = [
  {
    id: "arrival",
    title: "Stage 1 — Arrival: walk the story spine",
    kinds: ["story"],
    blurb:
      "Play the campaign in order and let the chapter trophies land as they come. Nothing here needs preparation beyond keeping the spoiler shield on until each one is earned.",
    watchOut:
      "Watch out: story trophies stay masked while the spoiler shield is on. That is deliberate — earn first, read afterwards.",
  },
  {
    id: "rounds",
    title: "Stage 2 — Rounds: open world, side jobs and activities",
    kinds: ["world", "side", "activities"],
    blurb:
      "Between chapters, clear the free-roam and side content that unlocks as the map opens. These trophies reward exploration, not sequencing.",
    watchOut:
      "Watch out: activity venues open gradually. If a place named in a guide is missing, one more story chapter usually unlocks it.",
  },
  {
    id: "tallies",
    title: "Stage 3 — Tallies: collectibles and long counts",
    kinds: ["collectibles", "counters"],
    blurb:
      "The slow burns. Sweep collectibles district by district and keep the counters ticking over in the ledger so no total ever surprises you at the end.",
    watchOut:
      "Watch out: a counter left until the finale turns into a grind. Ten minutes a session from the start beats a whole evening later.",
  },
  {
    id: "finale",
    title: "Stage 4 — Finale: the missable check and the platinum",
    kinds: ["missable", "online"],
    blurb:
      "Before the final story push, run the missable check below, close any online requirement with your crew, and let the platinum close the book.",
    watchOut:
      "Watch out: Positive Mental Attitude is the run's one true missable — a Chapter 1 moment on the balcony at Jason's house. Protect it with a spare save before you begin.",
  },
];

export const CONFIDENCE_MEANING = {
  "List-confirmed":
    "The name, description and grade match the published PlayStation list. The play advice is our own reading of that description and has not been verified inside the game.",
  "List + PSN target confirmed":
    "The list data matches PlayStation's published list and the tracked target is the count PlayStation itself reports for this trophy. Play advice remains our own reading.",
  "Description + reports":
    "The list data matches the published list, and the missable warning is drawn from the official description together with community reporting. Treat the timing note as load-bearing.",
};

const KNOWN_KINDS = new Set(KIND_SEQUENCE);
const KNOWN_GRADES = new Set(GRADE_SEQUENCE);

function asText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asSourceList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => asText(entry)).filter(Boolean);
  }
  const single = asText(value);
  return single ? [single] : [];
}

function asTarget(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return parsed > 0 ? parsed : null;
  }
  return null;
}

export function normaliseTrophy(raw, position) {
  const kindCandidate = asText(raw.kind).toLowerCase();
  const gradeCandidate = asText(raw.grade).toLowerCase();
  const target =
    asTarget(raw.target) ??
    asTarget(raw.count) ??
    asTarget(raw.psnTarget) ??
    asTarget(raw.progressTarget);
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map((step) => asText(step)).filter(Boolean)
    : [];
  return {
    position,
    name: asText(raw.name),
    description: asText(raw.description),
    grade: KNOWN_GRADES.has(gradeCandidate) ? gradeCandidate : "bronze",
    kind: KNOWN_KINDS.has(kindCandidate) ? kindCandidate : "activities",
    hidden: raw.hidden === true,
    missable: raw.missable === true || kindCandidate === "missable",
    guide: asText(raw.guide),
    sources: asSourceList(raw.sources ?? raw.source),
    target,
    steps,
    timing: asText(raw.timing),
    confidence: asText(raw.confidence) || "List-confirmed",
  };
}

export async function fetchTrophies() {
  const response = await fetch("data/trophies.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`trophy data failed to load (${response.status})`);
  }
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.trophies;
  if (!Array.isArray(rows)) {
    throw new Error("trophy data has no trophies array");
  }
  return rows.map((row, index) => normaliseTrophy(row, index));
}

export function stageIndexFor(trophy) {
  if (trophy.grade === "platinum") return ROAD_STAGES.length - 1;
  const found = ROAD_STAGES.findIndex((stage) =>
    stage.kinds.includes(trophy.kind),
  );
  return found === -1 ? 1 : found;
}

export function trophiesInStage(trophies, stageIndex) {
  return trophies.filter((trophy) => stageIndexFor(trophy) === stageIndex);
}

export function catalogueSummary(trophies) {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hiddenCount = 0;
  let missableCount = 0;
  for (const trophy of trophies) {
    byGrade[trophy.grade] += 1;
    if (trophy.hidden) hiddenCount += 1;
    if (trophy.missable) missableCount += 1;
  }
  return { total: trophies.length, byGrade, hiddenCount, missableCount };
}
