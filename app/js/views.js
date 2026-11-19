// views.js — every screen of the ledger as an HTML string. Pure builders:
// they read the trophies and the store and hand markup back; main.js wires
// the events. Trophy text is always escaped before it reaches the page.

import {
  GRADE_FILTERS,
  GRADE_LABEL,
  KIND_FILTERS,
  KIND_LABEL,
  STAGES,
  bucketsOf,
  countByGrade,
  gradeRank,
  hasTarget,
  sourcesText,
  stageOf,
} from './data.js';

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// The spoiler shield: with spoilers on, an unearned story trophy shows
// neither its name nor its description — just that something waits there.
export function isShielded(trophy, store) {
  return store.spoilers && trophy.kind === 'story' && !store.isEarned(trophy.name);
}

function shownName(trophy, store) {
  return isShielded(trophy, store) ? 'A story trophy, still hidden' : trophy.name;
}

function shownDescription(trophy, store) {
  return isShielded(trophy, store)
    ? 'Shielded by the spoiler setting. Earn it in the story — or switch spoilers off in the checklist — to read what PlayStation says about it.'
    : trophy.description;
}

function medalSpan(trophy) {
  return `<span class="medal medal-${esc(trophy.grade)}" title="${esc(GRADE_LABEL[trophy.grade] || trophy.grade)}"></span>`;
}

function chipsFor(trophy) {
  const parts = [
    `<span class="chip chip-grade-${esc(trophy.grade)}">${esc(GRADE_LABEL[trophy.grade] || trophy.grade)}</span>`,
    `<span class="chip">${esc(KIND_LABEL[trophy.kind] || trophy.kind || 'Trophy')}</span>`,
    `<span class="chip chip-stage">Roadmap stage ${stageOf(trophy)} of 4</span>`,
  ];
  if (trophy.missable) parts.push('<span class="chip chip-miss">Missable</span>');
  if (trophy.hidden) parts.push('<span class="chip chip-hidden">Hidden on PSN</span>');
  return parts.join(' ');
}

export function matchesFilters(trophy, ui, store) {
  if (ui.grade !== 'all' && trophy.grade !== ui.grade) return false;
  if (ui.kind !== 'all' && !bucketsOf(trophy).has(ui.kind)) return false;
  if (ui.query) {
    const hay = `${shownName(trophy, store)} ${trophy.description} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(ui.query.toLowerCase())) return false;
  }
  return true;
}

function filterBarHTML(ctx) {
  const { ui, store } = ctx;
  const gradeChips = GRADE_FILTERS.map(
    (f) =>
      `<button type="button" class="fchip${ui.grade === f.id ? ' is-on' : ''}" data-action="grade" data-value="${f.id}">${f.label}</button>`,
  ).join('');
  const kindOptions = KIND_FILTERS.map(
    (f) => `<option value="${f.id}"${ui.kind === f.id ? ' selected' : ''}>${f.label}</option>`,
  ).join('');
  return `
  <section class="filterbar" aria-label="Checklist filters">
    <div class="fgroup" role="group" aria-label="Filter by grade">${gradeChips}</div>
    <div class="fgroup fgroup-right">
      <label class="ffield">Kind
        <select id="kind-select" data-action-select="kind">${kindOptions}</select>
      </label>
      <label class="ffield fsearch">Search
        <input id="search-box" type="search" placeholder="Name, description, kind…" value="${esc(ui.query)}">
      </label>
      <label class="toggle">
        <input type="checkbox" id="spoiler-toggle" data-action-check="spoilers"${store.spoilers ? ' checked' : ''}>
        Hide story spoilers
      </label>
    </div>
  </section>`;
}

function rowHTML(trophy, ctx) {
  const { store, ui } = ctx;
  const earned = store.isEarned(trophy.name);
  const counter = hasTarget(trophy)
    ? `<span class="row-count">${store.countOf(trophy)} / ${trophy.target} ${esc(trophy.targetLabel || '')}</span>`
    : '';
  return `
  <li>
    <button type="button" class="trow${earned ? ' is-earned' : ''}${ui.selected === trophy.name ? ' is-selected' : ''}" data-action="select" data-name="${esc(trophy.name)}">
      ${medalSpan(trophy)}
      <span class="row-main">
        <span class="row-name">${esc(shownName(trophy, store))}</span>
        <span class="row-desc">${esc(shownDescription(trophy, store))}</span>
      </span>
      <span class="row-side">
        ${trophy.missable ? '<span class="chip chip-miss">Missable</span>' : ''}
        ${counter}
        <span class="row-tick" aria-hidden="true">${earned ? '✓' : ''}</span>
      </span>
    </button>
  </li>`;
}

export function detailHTML(trophy, ctx) {
  const { store } = ctx;
  if (!trophy) return '<section class="detail"><p class="muted">Pick a trophy from the list and its guide opens here.</p></section>';
  const earned = store.isEarned(trophy.name);
  const shielded = isShielded(trophy, store);
  const steps = Array.isArray(trophy.steps) ? trophy.steps : [];
  const counterBlock = hasTarget(trophy)
    ? `
      <div class="counter-box">
        <p class="counter-head">Progress counter — <strong>${store.countOf(trophy)} / ${trophy.target}</strong> ${esc(trophy.targetLabel || '')}</p>
        <div class="bar"><div style="width:${Math.round((store.countOf(trophy) / trophy.target) * 100)}%"></div></div>
        <p class="counter-controls">
          <button type="button" class="btn" data-action="count-down">−1</button>
          <input type="number" class="count-input" data-count-input min="0" max="${trophy.target}" value="${store.countOf(trophy)}" aria-label="Set the counter">
          <button type="button" class="btn" data-action="count-up">+1</button>
        </p>
      </div>`
    : '';
  return `
  <section class="detail" aria-label="Trophy guide">
    <p class="chip-row">${chipsFor(trophy)}</p>
    <h2>${esc(shownName(trophy, store))}</h2>
    <p class="stage-line">On the roadmap this sits in <strong>stage ${stageOf(trophy)} of 4 — ${esc(STAGES[stageOf(trophy) - 1].title)}</strong>: ${esc(STAGES[stageOf(trophy) - 1].blurb)}</p>
    <p class="official"><span class="lbl">Official description</span>${esc(shownDescription(trophy, store))}</p>
    ${
      shielded
        ? '<p class="muted">The guide for this one stays under the same shield: it would quote the moment it is earned in.</p>'
        : `
    <div class="guide-block">
      <h3>The guide</h3>
      <p>${esc(trophy.guide)}</p>
    </div>
    <div class="steps-block">
      <h3>Step by step</h3>
      <ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </div>
    <p class="timing"><span class="lbl">Timing</span>${esc(trophy.timing || 'No special window: it can be earned whenever its condition is met.')}</p>
    <p class="confidence">Confidence <span class="badge">${esc(trophy.confidence || 'Medium')}</span></p>
    <p class="sources"><span class="lbl">Sources</span>${esc(sourcesText(trophy))}; the guide above is our own advice, written from the official description and not yet checked in the game.</p>
    ${counterBlock}
    <label class="note-label" for="note-box">Your note</label>
    <textarea id="note-box" data-note rows="3" placeholder="Where you left this, what to try next…">${esc(store.noteOf(trophy.name))}</textarea>`
    }
    <p class="detail-actions">
      <button type="button" class="btn ${earned ? 'btn-quiet' : 'btn-main'}" data-action="toggle-earned">${earned ? 'Earned ✓ — tap to undo' : 'Mark as earned'}</button>
    </p>
  </section>`;
}

export function checklistHTML(ctx) {
  const { trophies, ui } = ctx;
  const visible = trophies.filter((t) => matchesFilters(t, ui, ctx.store));
  const selected = trophies.find((t) => t.name === ui.selected) || visible[0] || trophies[0];
  return `
  ${filterBarHTML(ctx)}
  <div class="layout">
    <section class="list-pane" aria-label="Trophy checklist">
      <p class="list-meta">${visible.length} of ${trophies.length} trophies shown · tick progress is saved in this browser as you go.</p>
      <ul class="tlist">${visible.map((t) => rowHTML(t, ctx)).join('') || '<li class="muted pad">No trophy matches those filters.</li>'}</ul>
    </section>
    ${detailHTML(selected, ctx)}
  </div>`;
}

function stageMembers(trophies, n) {
  return trophies.filter((t) => stageOf(t) === n);
}

export function roadmapHTML(ctx) {
  const { trophies, store } = ctx;
  const sections = STAGES.map((stage) => {
    const members = stageMembers(trophies, stage.n);
    const done = members.filter((t) => store.isEarned(t.name)).length;
    const pct = members.length ? Math.round((done / members.length) * 100) : 0;
    const names = members
      .map(
        (t) =>
          `<li class="${store.isEarned(t.name) ? 'done' : ''}">${medalSpan(t)} ${esc(shownName(t, store))}${t.missable ? ' <span class="chip chip-miss">Missable</span>' : ''}</li>`,
      )
      .join('');
    return `
    <section class="stage-card">
      <p class="stage-kicker">Stage ${stage.n} of 4 · ${done} of ${members.length} earned</p>
      <h2>${esc(stage.title)}</h2>
      <p>${esc(stage.blurb)}</p>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <p class="watch"><span class="lbl">Watch out</span>${esc(stage.watch)}</p>
      <ul class="stage-list">${names}</ul>
    </section>`;
  }).join('');
  return `
  <div class="page">
    <h2 class="page-title">The road to the platinum</h2>
    <p class="page-lede">Four stages, in the order a first playthrough should meet them, built from the official descriptions: story first, then the threads that run beside it, then the sweeps and tallies, and the open-world residue last. The platinum — earned when the other 54 are — closes stage 4.</p>
    ${sections}
  </div>`;
}

export function missablesHTML(ctx) {
  const { trophies, store } = ctx;
  const flagged = trophies.filter((t) => t.missable);
  const cards = flagged
    .map(
      (t) => `
    <section class="stage-card miss-card">
      <p class="chip-row">${chipsFor(t)}</p>
      <h2>${esc(t.name)}</h2>
      <p class="official"><span class="lbl">Official description</span>${esc(t.description)}</p>
      ${t.missableNote ? `<p>${esc(t.missableNote)}</p>` : ''}
      <p class="timing"><span class="lbl">Timing</span>${esc(t.timing || '')}</p>
      <ol>${(t.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p class="sources"><span class="lbl">Sources</span>${esc(sourcesText(t))}</p>
      <p>${store.isEarned(t.name) ? '<strong>In the ledger already ✓</strong>' : '<strong>Not earned yet — its window is early, so plan for it before the story moves on.</strong>'}</p>
    </section>`,
    )
    .join('');
  return `
  <div class="page">
    <h2 class="page-title">Missables: the honest count is ${flagged.length}</h2>
    <p class="page-lede">Read strictly from the official descriptions, exactly one trophy in the list of 55 carries a window that closes: a single moment, early, that the story does not repeat. Everything else can be earned later, replayed, or swept up after the credits — we checked each description for chapter locks, one-time events and point-of-no-return language, and only this one qualifies.</p>
    ${cards}
    <section class="stage-card">
      <h2>How the rest were cleared</h2>
      <p>Story trophies sit on the critical path and pop as their scenes resolve. Collectible sets and the counted trophies stay open in free roam. Side threads can be finished after the credits. If a later patch or a fuller guide proves another window, this page — not the checklist — is where the flag belongs.</p>
    </section>
  </div>`;
}

function nextReason(trophy, store) {
  if (hasTarget(trophy) && store.countOf(trophy) > 0)
    return `Counter already moving: ${store.countOf(trophy)} of ${trophy.target} ${trophy.targetLabel || ''} banked.`;
  if (trophy.missable) return 'Its only window is in Chapter 1 — the earliest unfinished business there is.';
  if (stageOf(trophy) === 1) return 'On the story road: the next chapter carries it.';
  if (stageOf(trophy) === 2) return 'A side thread — tidy it up while its people are still on the map.';
  if (stageOf(trophy) === 3) return hasTarget(trophy) ? 'A tally that rewards steady sessions over one grind.' : 'Part of a collectible sweep; go district by district.';
  return 'Open-world residue: save it for a calm free-roam session.';
}

export function nextHTML(ctx) {
  const { trophies, store } = ctx;
  const pending = trophies
    .filter((t) => !store.isEarned(t.name) && t.grade !== 'platinum')
    .map((t) => ({
      t,
      moving: hasTarget(t) && store.countOf(t) > 0 ? 0 : 1,
      shielded: isShielded(t, store) ? 1 : 0,
    }))
    .sort(
      (a, b) =>
        a.moving - b.moving ||
        a.shielded - b.shielded ||
        stageOf(a.t) - stageOf(b.t) ||
        gradeRank(a.t) - gradeRank(b.t) ||
        a.t.name.localeCompare(b.t.name),
    )
    .slice(0, 15);
  const rows = pending
    .map(
      ({ t }) => `
    <li>
      <button type="button" class="trow" data-action="jump" data-name="${esc(t.name)}">
        ${medalSpan(t)}
        <span class="row-main">
          <span class="row-name">${esc(shownName(t, store))}</span>
          <span class="row-desc">${esc(nextReason(t, store))}</span>
        </span>
        <span class="row-side"><span class="chip chip-stage">Stage ${stageOf(t)}</span></span>
      </button>
    </li>`,
    )
    .join('');
  return `
  <div class="page">
    <h2 class="page-title">Next up</h2>
    <p class="page-lede">What the ledger would do next, from your own progress: counters already in motion first, then the earliest roadmap stage still open, with the heavier grades ahead of the bronze. Shielded story trophies queue by stage without spoiling themselves.</p>
    <ul class="tlist">${rows || '<li class="muted pad">Nothing left — the platinum is yours.</li>'}</ul>
  </div>`;
}

export function saveHTML(ctx) {
  const { trophies, store } = ctx;
  const byGrade = countByGrade(trophies);
  const earnedByGrade = countByGrade(trophies.filter((t) => store.isEarned(t.name)));
  const gradeRows = Object.keys(byGrade)
    .map((g) => `<li>${GRADE_LABEL[g]}: ${earnedByGrade[g]} of ${byGrade[g]} earned</li>`)
    .join('');
  return `
  <div class="page">
    <h2 class="page-title">Your save</h2>
    <p class="page-lede">Progress lives in this browser's local storage — ticks, counters and notes together. Take it with you: export writes one JSON file, import reads it back on any machine, and reset clears the slate.</p>
    <section class="stage-card">
      <h2>Where the run stands</h2>
      <ul class="save-stats">${gradeRows}</ul>
      <p>${store.earnedCount()} of ${trophies.length} trophies earned overall.</p>
      <label class="toggle">
        <input type="checkbox" data-action-check="spoilers"${store.spoilers ? ' checked' : ''}>
        Hide story spoilers until earned
      </label>
    </section>
    <section class="stage-card">
      <h2>Move the save</h2>
      <p class="save-actions">
        <button type="button" class="btn btn-main" data-action="export">Export progress (.json)</button>
        <label class="btn btn-quiet file-btn">Import from file<input type="file" id="import-file" accept=".json,application/json" hidden></label>
        <button type="button" class="btn btn-danger" data-action="reset">Reset everything</button>
      </p>
      <label class="note-label" for="import-box">…or paste an exported save here, then press Import pasted</label>
      <textarea id="import-box" rows="5" placeholder='{"app":"dusk-ledger", …}'></textarea>
      <p class="save-actions"><button type="button" class="btn" data-action="import-paste">Import pasted</button></p>
      <p id="save-msg" class="muted" role="status"></p>
    </section>
  </div>`;
}
