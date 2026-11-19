// GTA VI Trophy Atlas — rendering: scorecard, checklist rows, the guide pane,
// roadmap, missables, planner and the sources index. All text comes from
// data/trophies.json or js/data.js; this file only lays it out.
import { GRADE_ORDER, KIND_LABELS, ROADMAP, displayDescription, displayName, isMasked, plannerReason, stageTrophies } from './data.js';
import { counterOf, isEarned } from './store.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function badge(text, extra) {
  return el('span', `badge${extra ? ` ${extra}` : ''}`, text);
}

export function renderScorecard(doc, state, els) {
  const trophies = doc.trophies;
  const earnedCount = trophies.filter((t) => isEarned(state, t)).length;
  els.earnedCount.textContent = String(earnedCount);
  els.barFill.style.width = `${Math.round((earnedCount / trophies.length) * 100)}%`;
  const byGrade = (grade) => {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => isEarned(state, t)).length;
    return `${grade[0].toUpperCase()}${grade.slice(1)} ${got}/${all.length}`;
  };
  els.gradeLine.textContent = ['platinum', 'gold', 'silver', 'bronze'].map(byGrade).join(' · ');
}

export function renderChecklist(doc, state, ui, els, onSelect, onToggle) {
  const list = els.list;
  list.replaceChildren();
  let shown = 0;
  const trophies = [...doc.trophies].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  for (const trophy of trophies) {
    const earned = isEarned(state, trophy);
    if (!ui.matches(trophy, earned)) continue;
    shown += 1;
    const row = el('li', `trophy-row${earned ? ' is-earned' : ''}${ui.selected === trophy.name ? ' is-selected' : ''}`);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('change', () => onToggle(trophy, box.checked));
    const swatch = el('span', `swatch ${trophy.grade}`);
    const main = el('button', 'row-main');
    main.type = 'button';
    main.style.background = 'none';
    main.style.border = 'none';
    main.style.textAlign = 'left';
    main.style.padding = '0';
    const masked = isMasked(trophy, state, earned);
    main.append(
      el('span', 'row-name', displayName(trophy, state, earned)),
      el('span', 'row-desc', displayDescription(trophy, state, earned)),
    );
    main.addEventListener('click', () => onSelect(trophy.name));
    const badges = el('span', 'row-badges');
    badges.append(badge(trophy.grade, 'grade'));
    if (trophy.kind !== trophy.grade) badges.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind));
    if (trophy.missable) badges.append(badge('Missable', 'missable'));
    if (masked) badges.append(badge('Spoiler-hidden'));
    if (trophy.target) {
      const now = counterOf(state, trophy);
      badges.append(badge(now > 0 ? `${now} / ${trophy.target}` : `Target ${trophy.target}`, 'counter'));
    }
    row.append(box, swatch, main, badges);
    list.append(row);
  }
  els.resultLine.textContent = shown === 1 ? 'Showing 1 trophy' : `Showing ${shown} trophies`;
  els.onlineNote.hidden = ui.kind !== 'online';
}

export function renderDetail(doc, state, els, handlers) {
  const pane = els.detail;
  pane.replaceChildren();
  const trophy = doc.trophies.find((t) => t.name === handlers.selectedName) ?? doc.trophies.find((t) => t.missable) ?? doc.trophies[0];
  if (!trophy) return;
  const earned = isEarned(state, trophy);
  const masked = isMasked(trophy, state, earned);
  pane.append(el('p', 'kicker', `${trophy.grade.toUpperCase()} · ${KIND_LABELS[trophy.kind] ?? trophy.kind} · ROADMAP STEP ${trophy.stage ?? '—'}`));
  pane.append(el('h2', '', displayName(trophy, state, earned)));
  pane.append(el('p', 'official', `Official description: “${displayDescription(trophy, state, earned)}”`));
  const toggle = el('label', 'check');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.addEventListener('change', () => handlers.onToggle(trophy, box.checked));
  toggle.append(box, document.createTextNode(' Earned — saved in this browser'));
  pane.append(toggle);
  if (trophy.missable) {
    const warn = el('div', 'warn');
    warn.append(
      el('strong', '', '⚠ Missable. '),
      document.createTextNode(trophy.missableNote ?? 'This trophy has a one-time window — read its guide before you play past it.'),
    );
    pane.append(warn);
  }
  pane.append(el('h3', '', 'Guide — our own words, sources cited'));
  if (masked) {
    pane.append(el('p', '', 'The guide for this story trophy is hidden by the spoiler shield until the trophy is earned. Its facts and sources appear here the moment you tick it off.'));
  } else {
    pane.append(el('p', '', trophy.guide));
    if (trophy.target) pane.append(renderCounter(trophy, state, handlers));
    pane.append(el('h3', '', 'Sources beside this guide'));
    const sources = el('ul');
    for (const source of trophy.sources ?? []) {
      const item = el('li');
      const link = el('a', '', source.label);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
      sources.append(item);
    }
    pane.append(sources);
    pane.append(el('p', 'muted', 'Links open only when you follow them — the app itself fetches nothing and works offline.'));
  }
  pane.append(el('h3', '', 'Your note'));
  const note = document.createElement('textarea');
  note.placeholder = 'e.g. three card sets left, all in the north…';
  note.value = state.notes[trophy.name] ?? '';
  note.addEventListener('change', () => handlers.onNote(trophy, note.value));
  pane.append(note);
}

function renderCounter(trophy, state, handlers) {
  const wrap = el('div');
  wrap.append(el('h3', '', 'Progress counter'));
  const box = el('div', 'counter-box');
  const now = counterOf(state, trophy);
  const minus = el('button', '', '−');
  minus.type = 'button';
  minus.addEventListener('click', () => handlers.onCounter(trophy, now - 1));
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(trophy.target);
  input.value = String(now);
  input.setAttribute('aria-label', trophy.targetLabel ?? 'Progress');
  input.addEventListener('change', () => handlers.onCounter(trophy, Number(input.value)));
  const plus = el('button', '', '+');
  plus.type = 'button';
  plus.addEventListener('click', () => handlers.onCounter(trophy, now + 1));
  const bar = el('div', 'counter-bar');
  const fill = el('div');
  fill.style.width = `${Math.min(100, Math.round((now / trophy.target) * 100))}%`;
  bar.append(fill);
  box.append(minus, input, plus, el('span', '', `of ${trophy.target} ${trophy.targetLabel ?? ''}`), bar);
  wrap.append(box);
  return wrap;
}

export function renderRoadmap(doc, els) {
  const host = els.roadmapSteps;
  host.replaceChildren();
  for (const step of ROADMAP) {
    const card = el('article', 'step');
    card.append(el('p', 'when', step.when), el('h3', '', step.title), el('p', '', step.body));
    const names = stageTrophies(doc.trophies, step.stage).map((t) => t.name);
    if (names.length) card.append(el('p', 'muted', `Trophies in this step (${names.length}): ${names.join(' · ')}`));
    host.append(card);
  }
}

export function renderMissables(doc, els) {
  const host = els.missableList;
  host.replaceChildren();
  for (const trophy of doc.trophies.filter((t) => t.missable)) {
    const card = el('article', 'miss-card');
    card.append(
      el('h3', '', `${trophy.name} — ${trophy.grade}`),
      el('p', 'official', `Official description: “${trophy.description}”`),
      el('p', '', trophy.missableNote ?? ''),
      el('p', '', trophy.guide),
    );
    const sources = el('p', 'muted', `Sources: ${(trophy.sources ?? []).map((s) => s.label).join('; ')}`);
    card.append(sources);
    host.append(card);
  }
  const verdict = el('article', 'miss-card');
  verdict.append(
    el('h3', '', 'Everything else: not missable, by the descriptions'),
    el('p', '', 'No other trophy in the official list is flagged missable here. Story trophies unlock on completion, counters and collectibles stay open in free roam after the credits, and the launch guides this atlas cites report exactly one potentially missable trophy. A guide that flags half the list as missable is guessing — this page would rather flag one trophy well.'),
  );
  host.append(verdict);
}

export function renderPlanner(doc, state, els) {
  const host = els.plannerList;
  host.replaceChildren();
  const { plannerOrder } = els.plannerHelpers;
  const queue = plannerOrder(doc.trophies, state, isEarned, counterOf).slice(0, 10);
  if (!queue.length) {
    host.append(el('li', '', 'Nothing left — all 55 earned. Vice Got a Price! is yours.'));
    return;
  }
  queue.forEach((trophy, index) => {
    const item = el('li');
    item.append(
      el('strong', '', `${index + 1}. ${trophy.name} `),
      badge(trophy.grade, 'grade'),
      document.createTextNode(` — ${plannerReason(trophy, state, counterOf)}`),
    );
    host.append(item);
  });
}

export function renderSourcesIndex(doc, els) {
  const host = els.sourcesIndex;
  host.replaceChildren();
  for (const source of doc.sourcesIndex ?? []) {
    const item = el('li');
    const link = el('a', '', source.label);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
    host.append(item);
  }
}
