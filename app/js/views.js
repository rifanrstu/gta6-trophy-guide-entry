// Leonida Ledger — views.
// Pure renderers: each takes the catalogue, the saved progress and the
// current screen state, and returns the HTML for one region of the
// page. No view touches storage or the network; main.js wires events.

import {
  CONFIDENCE_MEANING,
  GRADE_LABEL,
  GRADE_SEQUENCE,
  KIND_LABEL,
  ROAD_STAGES,
  catalogueSummary,
  stageIndexFor,
  trophiesInStage,
} from "./data.js";
import {
  completionPercent,
  counterValue,
  earnedCount,
  isEarned,
  noteFor,
} from "./store.js";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function shielded(progress, trophy) {
  return (
    progress.shieldOn &&
    trophy.kind === "story" &&
    !isEarned(progress, trophy)
  );
}

function displayName(progress, trophy) {
  return shielded(progress, trophy) ? "— story trophy, still shielded —" : trophy.name;
}

function displayDescription(progress, trophy) {
  if (shielded(progress, trophy)) {
    return "Description hidden by the spoiler shield until this trophy is earned.";
  }
  return trophy.description;
}

export function gradeChip(trophy) {
  return `<span class="lx-grade lx-grade-${esc(trophy.grade)}">${esc(GRADE_LABEL[trophy.grade])}</span>`;
}

export function kindChip(trophy) {
  return `<span class="lx-kind">${esc(KIND_LABEL[trophy.kind] ?? trophy.kind)}</span>`;
}

export function confidenceChip(trophy) {
  return `<span class="lx-confidence" title="${esc(CONFIDENCE_MEANING[trophy.confidence] ?? "")}">${esc(trophy.confidence)}</span>`;
}

export function headerView(trophies, progress) {
  const summary = catalogueSummary(trophies);
  const earned = earnedCount(progress, trophies);
  const percent = completionPercent(progress, trophies);
  const gradeBits = GRADE_SEQUENCE.map(
    (grade) => `${summary.byGrade[grade]} ${GRADE_LABEL[grade].toLowerCase()}`,
  ).join(" · ");
  return `
    <div class="lx-masthead" id="masthead">
      <div class="lx-masthead-copy">
        <p class="lx-eyebrow">GTA VI Trophy Atlas — offline guide &amp; tracker</p>
        <h1 class="lx-title">The Leonida Ledger</h1>
        <p class="lx-standfirst">Every one of the ${summary.total} official PlayStation 5 trophies
        (${gradeBits}), each with a guide in our own words,
        the sources it rests on, a three-step breakdown, a timing note and an honesty badge.
        Progress saves in this browser; the page never touches the network.</p>
      </div>
      <div class="lx-scorebox" id="scorebox">
        <span class="lx-score-number">${earned}</span>
        <span class="lx-score-of">of ${summary.total} earned</span>
        <div class="lx-progress-track"><div class="lx-progress-fill" style="width:${percent}%"></div></div>
        <span class="lx-score-percent">${percent}% of the book</span>
      </div>
    </div>`;
}

export function navView(activeView) {
  const tabs = [
    ["guide", "Guide & checklist"],
    ["roadmap", "Platinum roadmap"],
    ["missables", "Missable watch"],
    ["planner", "Next up"],
    ["save", "Save & share"],
  ];
  const links = tabs
    .map(
      ([id, label]) =>
        `<a class="lx-tab${id === activeView ? " lx-tab-active" : ""}" href="#${id}" data-view-link="${id}">${label}</a>`,
    )
    .join("");
  return `<nav class="lx-tabs" id="view-tabs">${links}</nav>`;
}

function filterBarView(trophies, ui) {
  const kindOptions = ["all", ...Object.keys(KIND_LABEL)]
    .map(
      (kind) =>
        `<option value="${kind}"${ui.kind === kind ? " selected" : ""}>${kind === "all" ? "Every kind" : KIND_LABEL[kind]}</option>`,
    )
    .join("");
  const gradeOptions = ["all", ...GRADE_SEQUENCE]
    .map(
      (grade) =>
        `<option value="${grade}"${ui.grade === grade ? " selected" : ""}>${grade === "all" ? "Every grade" : GRADE_LABEL[grade]}</option>`,
    )
    .join("");
  const stateOptions = [
    ["all", "Earned and open"],
    ["open", "Still open"],
    ["earned", "Earned only"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}"${ui.state === value ? " selected" : ""}>${label}</option>`,
    )
    .join("");
  return `
    <div class="lx-filterbar" id="filterbar">
      <label class="lx-field">Search
        <input id="filter-search" type="search" placeholder="Trophy name or words…" value="${esc(ui.search)}">
      </label>
      <label class="lx-field">Kind
        <select id="filter-kind">${kindOptions}</select>
      </label>
      <label class="lx-field">Grade
        <select id="filter-grade">${gradeOptions}</select>
      </label>
      <label class="lx-field">State
        <select id="filter-state">${stateOptions}</select>
      </label>
      <label class="lx-shield-toggle">
        <input id="toggle-shield" type="checkbox" ${ui.shieldOn ? "checked" : ""}>
        Spoiler shield: mask unearned story trophies
      </label>
    </div>`;
}

export function matchesFilters(trophy, progress, ui) {
  if (ui.kind !== "all" && trophy.kind !== ui.kind) return false;
  if (ui.grade !== "all" && trophy.grade !== ui.grade) return false;
  if (ui.state === "earned" && !isEarned(progress, trophy)) return false;
  if (ui.state === "open" && isEarned(progress, trophy)) return false;
  const needle = ui.search.trim().toLowerCase();
  if (needle) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function checklistRow(trophy, progress, ui) {
  const earned = isEarned(progress, trophy);
  const selected = ui.selected === trophy.name;
  const counter = trophy.target
    ? `<span class="lx-row-counter">${counterValue(progress, trophy)}/${trophy.target}</span>`
    : "";
  const missableFlag = trophy.missable
    ? `<span class="lx-row-missable">missable</span>`
    : "";
  return `
    <li class="lx-row${earned ? " lx-row-earned" : ""}${selected ? " lx-row-selected" : ""}">
      <label class="lx-row-check">
        <input type="checkbox" data-action="toggle-earned" data-name="${esc(trophy.name)}" ${earned ? "checked" : ""}>
      </label>
      <button class="lx-row-main" type="button" data-action="select" data-name="${esc(trophy.name)}">
        <span class="lx-row-name">${esc(displayName(progress, trophy))}</span>
        <span class="lx-row-desc">${esc(displayDescription(progress, trophy))}</span>
        <span class="lx-row-meta">${gradeChip(trophy)} ${kindChip(trophy)} ${missableFlag} ${counter}</span>
      </button>
    </li>`;
}

export function detailView(trophy, progress) {
  if (!trophy) {
    return `
      <aside class="lx-detail lx-detail-empty" id="detail-pane">
        <h2>Pick a trophy</h2>
        <p>Select any row and its full guide opens here: the cited sources,
        the three-step breakdown, when to attempt it, and the badge that
        says how far the facts behind it have been checked.</p>
      </aside>`;
  }
  const earned = isEarned(progress, trophy);
  const steps = trophy.steps
    .map((step, index) => `<li><strong>Step ${index + 1}.</strong> ${esc(step)}</li>`)
    .join("");
  const sources = trophy.sources.length
    ? trophy.sources.map((source) => `<li>${esc(source)}</li>`).join("")
    : "<li>Sources: the official list on Exophase for the name, description and grade; PSNProfiles for the tracked target where one exists; the guide text is our own advice drawn from the official description.</li>";
  const counterBlock = trophy.target
    ? `
      <div class="lx-counter-box">
        <span>Tracked count: ${counterValue(progress, trophy)} of ${trophy.target}</span>
        <span class="lx-counter-buttons">
          <button type="button" data-action="counter-step" data-name="${esc(trophy.name)}" data-delta="-1">−1</button>
          <button type="button" data-action="counter-step" data-name="${esc(trophy.name)}" data-delta="1">+1</button>
          <button type="button" data-action="counter-step" data-name="${esc(trophy.name)}" data-delta="10">+10</button>
        </span>
      </div>`
    : "";
  return `
    <aside class="lx-detail" id="detail-pane">
      <p class="lx-detail-kicker">${gradeChip(trophy)} ${kindChip(trophy)} ${confidenceChip(trophy)} <span class="lx-kind">Roadmap stage ${stageIndexFor(trophy) + 1} of ${ROAD_STAGES.length}</span></p>
      <h2 class="lx-detail-name">${esc(displayName(progress, trophy))}</h2>
      <p class="lx-detail-desc">${esc(displayDescription(progress, trophy))}</p>
      ${trophy.missable ? `<p class="lx-detail-missable">Missable — protect this one with a spare save before its chapter.</p>` : ""}
      <p class="lx-detail-timing">${esc(trophy.timing)}</p>
      <h3>Guide, in our own words</h3>
      <p class="lx-detail-guide">${esc(trophy.guide)}</p>
      <h3>Three-step breakdown</h3>
      <ol class="lx-steps">${steps}</ol>
      ${counterBlock}
      <h3>Sources beside this guide</h3>
      <ul class="lx-sources">${sources}</ul>
      <p class="lx-confidence-note">${esc(CONFIDENCE_MEANING[trophy.confidence] ?? "")}</p>
      <label class="lx-note-field">Your note on this trophy
        <textarea id="note-editor" data-name="${esc(trophy.name)}" rows="3" placeholder="Where you found it, what nearly went wrong…">${esc(noteFor(progress, trophy))}</textarea>
      </label>
      <button class="lx-earn-button" type="button" data-action="toggle-earned" data-name="${esc(trophy.name)}">
        ${earned ? "Mark as not earned" : "Mark as earned"}
      </button>
    </aside>`;
}

export function guideView(trophies, progress, ui) {
  const visible = trophies.filter((trophy) => matchesFilters(trophy, progress, ui));
  const selected =
    trophies.find((trophy) => trophy.name === ui.selected) ?? visible[0] ?? null;
  const rows = visible.map((trophy) => checklistRow(trophy, progress, ui)).join("");
  return `
    ${filterBarView(trophies, ui)}
    <div class="lx-guide-grid">
      <section class="lx-list-pane" id="checklist">
        <p class="lx-list-count">${visible.length} of ${trophies.length} trophies shown</p>
        <ul class="lx-rows">${rows || `<li class="lx-row">No trophy matches those filters.</li>`}</ul>
      </section>
      ${detailView(selected, progress)}
    </div>`;
}

function stageBlock(trophies, progress, stage, index) {
  const members = trophiesInStage(trophies, index);
  const done = members.filter((trophy) => isEarned(progress, trophy)).length;
  const pct = members.length ? Math.round((done / members.length) * 100) : 0;
  const names = members
    .slice(0, 6)
    .map((trophy) => `<li>${esc(displayName(progress, trophy))}</li>`)
    .join("");
  const more =
    members.length > 6 ? `<li>…and ${members.length - 6} more in the checklist</li>` : "";
  return `
    <article class="lx-stage" id="stage-${esc(stage.id)}">
      <h2>${esc(stage.title)}</h2>
      <p>${esc(stage.blurb)}</p>
      <div class="lx-progress-track"><div class="lx-progress-fill" style="width:${pct}%"></div></div>
      <p class="lx-stage-progress">${done} of ${members.length} earned (${pct}%)</p>
      <ul class="lx-stage-names">${names}${more}</ul>
      <p class="lx-stage-watch">${esc(stage.watchOut)}</p>
    </article>`;
}

export function roadmapView(trophies, progress) {
  const blocks = ROAD_STAGES.map((stage, index) =>
    stageBlock(trophies, progress, stage, index),
  ).join("");
  return `
    <section class="lx-page" id="roadmap-page">
      <h2 class="lx-page-title">Roadmap to the platinum</h2>
      <p class="lx-page-lede">Four stages, built from the official descriptions: the story
      spine first, the open world in the gaps, the long tallies running underneath,
      and a final missable check before the platinum. Your own progress is drawn
      into every stage.</p>
      <div class="lx-stages">${blocks}</div>
    </section>`;
}

export function missablesView(trophies, progress) {
  const flagged = trophies.filter((trophy) => trophy.missable);
  const cards = flagged
    .map(
      (trophy) => `
      <article class="lx-missable-card">
        <p>${gradeChip(trophy)} ${confidenceChip(trophy)}</p>
        <h3>${esc(trophy.name)}</h3>
        <p>${esc(trophy.description)}</p>
        <p class="lx-detail-timing">${esc(trophy.timing)}</p>
        <p>${esc(trophy.guide)}</p>
        <p class="lx-missable-state">${isEarned(progress, trophy) ? "Earned — this run is safe." : "Not yet earned — keep the spare save until it pops."}</p>
      </article>`,
    )
    .join("");
  return `
    <section class="lx-page" id="missables-page">
      <h2 class="lx-page-title">Missable watch</h2>
      <p class="lx-page-lede">Honesty first: from the official descriptions, exactly
      ${flagged.length} of the ${trophies.length} trophies can be missed on a single run.
      Inventing more would make this page longer and the guide worse, so here is
      the one that matters, with its timing in full.</p>
      ${cards}
      <p class="lx-page-note">Every other trophy stays available after its unlock
      point, or belongs to a count that keeps growing. If a future patch changes
      that, this page — not the checklist — is where the correction belongs.</p>
    </section>`;
}

function plannerReason(trophy, progress) {
  if (trophy.missable && !isEarned(progress, trophy)) {
    return "Missable and still open — nothing outranks protecting this.";
  }
  const value = counterValue(progress, trophy);
  if (trophy.target && value > 0 && value < trophy.target) {
    return `Counter already moving (${value}/${trophy.target}) — finish what is warm.`;
  }
  if (trophy.kind === "story") {
    return "Next on the story spine; it unlocks more of the map as it lands.";
  }
  return `Stage ${stageIndexFor(trophy) + 1} of the roadmap — the earliest open stage first.`;
}

export function plannerView(trophies, progress) {
  const open = trophies.filter((trophy) => !isEarned(progress, trophy));
  const ranked = [...open].sort((a, b) => {
    const score = (trophy) =>
      (trophy.missable ? 0 : 1) * 100 +
      (trophy.target && counterValue(progress, trophy) > 0 ? 10 : 50) +
      stageIndexFor(trophy) * 20 +
      trophy.position;
    return score(a) - score(b);
  });
  const picks = ranked.slice(0, 6);
  const cards = picks
    .map(
      (trophy, index) => `
      <article class="lx-pick">
        <p class="lx-pick-rank">Next up ${index + 1} · Stage ${stageIndexFor(trophy) + 1}</p>
        <h3>${esc(displayName(progress, trophy))}</h3>
        <p>${gradeChip(trophy)} ${kindChip(trophy)} ${confidenceChip(trophy)}</p>
        <p>${esc(plannerReason(trophy, progress))}</p>
        <p class="lx-pick-timing">${esc(trophy.timing)}</p>
      </article>`,
    )
    .join("");
  return `
    <section class="lx-page" id="planner-page">
      <h2 class="lx-page-title">Next up — a plan from your own ledger</h2>
      <p class="lx-page-lede">Ranked from your saved progress, not from a generic list:
      the missable first while it is open, counters that are already warm next,
      then the earliest unfinished roadmap stage. Shielded story names stay
      masked here too.</p>
      <div class="lx-picks">${cards || `<p>Everything is earned. The book is closed — congratulations.</p>`}</div>
    </section>`;
}

export function saveView(trophies, progress) {
  const earned = earnedCount(progress, trophies);
  const percent = completionPercent(progress, trophies);
  const noted = Object.keys(progress.notes).length;
  return `
    <section class="lx-page" id="save-page">
      <h2 class="lx-page-title">Save &amp; share</h2>
      <p class="lx-page-lede">Your ledger lives only in this browser. Export it before
      you clear site data or change machines; import brings the whole book back —
      earned marks, counters, notes and the shield setting included.</p>
      <div class="lx-save-stats">
        <p><strong>${earned}</strong> earned of ${trophies.length} (${percent}%)</p>
        <p><strong>${noted}</strong> trophies carry your notes</p>
        <p>Spoiler shield is <strong>${progress.shieldOn ? "on" : "off"}</strong></p>
      </div>
      <div class="lx-save-actions">
        <button type="button" data-action="export">Export progress (.json)</button>
        <label class="lx-import-label">Import progress
          <input id="import-file" type="file" accept="application/json,.json">
        </label>
        <button type="button" data-action="copy-summary">Copy progress summary</button>
        <button type="button" data-action="reset">Reset the whole ledger</button>
      </div>
      <p class="lx-page-note" id="save-feedback" role="status"></p>
    </section>`;
}
