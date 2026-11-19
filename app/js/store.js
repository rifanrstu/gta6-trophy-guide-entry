// Leonida Ledger — progress store.
// Everything a hunter records lives in one localStorage entry: which
// trophies are earned, how far each tracked counter has climbed, the
// private note attached to a trophy, and whether the spoiler shield is
// raised. Export writes that entry to a file; import reads it back.

const STORAGE_KEY = "leonida-ledger-progress-v1";

export function blankProgress() {
  return {
    earned: {},
    counters: {},
    notes: {},
    shieldOn: true,
  };
}

function sanitise(candidate) {
  const clean = blankProgress();
  if (!candidate || typeof candidate !== "object") return clean;
  if (candidate.earned && typeof candidate.earned === "object") {
    for (const [name, stamp] of Object.entries(candidate.earned)) {
      if (stamp) clean.earned[name] = String(stamp);
    }
  }
  if (candidate.counters && typeof candidate.counters === "object") {
    for (const [name, value] of Object.entries(candidate.counters)) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric >= 0) {
        clean.counters[name] = Math.floor(numeric);
      }
    }
  }
  if (candidate.notes && typeof candidate.notes === "object") {
    for (const [name, note] of Object.entries(candidate.notes)) {
      if (typeof note === "string" && note.trim()) {
        clean.notes[name] = note;
      }
    }
  }
  clean.shieldOn = candidate.shieldOn !== false;
  return clean;
}

export function loadProgress() {
  try {
    const rawText = window.localStorage.getItem(STORAGE_KEY);
    if (!rawText) return blankProgress();
    return sanitise(JSON.parse(rawText));
  } catch {
    return blankProgress();
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in strict privacy modes; the guide
    // still works for the session, it simply cannot remember.
  }
}

export function isEarned(progress, trophy) {
  return Boolean(progress.earned[trophy.name]);
}

export function toggleEarned(progress, trophy) {
  if (progress.earned[trophy.name]) {
    delete progress.earned[trophy.name];
  } else {
    progress.earned[trophy.name] = new Date().toISOString();
    if (trophy.target) {
      progress.counters[trophy.name] = trophy.target;
    }
  }
  saveProgress(progress);
}

export function counterValue(progress, trophy) {
  const stored = progress.counters[trophy.name];
  if (typeof stored === "number") return stored;
  return isEarned(progress, trophy) && trophy.target ? trophy.target : 0;
}

export function setCounter(progress, trophy, value) {
  const clamped = Math.max(
    0,
    Math.min(trophy.target ?? Number.MAX_SAFE_INTEGER, Math.floor(value) || 0),
  );
  progress.counters[trophy.name] = clamped;
  if (trophy.target && clamped >= trophy.target) {
    if (!progress.earned[trophy.name]) {
      progress.earned[trophy.name] = new Date().toISOString();
    }
  }
  saveProgress(progress);
  return clamped;
}

export function noteFor(progress, trophy) {
  return progress.notes[trophy.name] ?? "";
}

export function setNote(progress, trophy, text) {
  if (text.trim()) {
    progress.notes[trophy.name] = text;
  } else {
    delete progress.notes[trophy.name];
  }
  saveProgress(progress);
}

export function earnedCount(progress, trophies) {
  return trophies.filter((trophy) => isEarned(progress, trophy)).length;
}

export function completionPercent(progress, trophies) {
  if (!trophies.length) return 0;
  return Math.round((earnedCount(progress, trophies) / trophies.length) * 100);
}

export function exportProgress(progress) {
  const payload = {
    app: "leonida-ledger",
    version: 1,
    exportedAt: new Date().toISOString(),
    progress,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "leonida-ledger-progress.json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 4000);
}

export function importProgress(file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    const inner =
      parsed && typeof parsed === "object" && parsed.progress
        ? parsed.progress
        : parsed;
    const clean = sanitise(inner);
    saveProgress(clean);
    return clean;
  });
}

export function summaryLine(progress, trophies) {
  const earned = earnedCount(progress, trophies);
  const percent = completionPercent(progress, trophies);
  const remaining = trophies.length - earned;
  return (
    `Leonida Ledger: ${earned} of ${trophies.length} GTA VI trophies earned ` +
    `(${percent}%), ${remaining} still open. Roadmap, missable check and ` +
    `planner all live in the GTA VI Trophy Atlas.`
  );
}

// Demo seeding exists for screenshots and first impressions only: when
// the address carries ?demo=13 and nothing is saved yet, a believable
// mid-run ledger appears (thirteen earned, two counters under way).
export function seedDemoProgress(trophies) {
  const demo = blankProgress();
  const chosen = trophies.slice(0, 13);
  for (const trophy of chosen) {
    demo.earned[trophy.name] = "2026-11-19T12:00:00.000Z";
    if (trophy.target) demo.counters[trophy.name] = trophy.target;
  }
  const partial = trophies.filter(
    (trophy) => trophy.target && !demo.earned[trophy.name],
  );
  for (const trophy of partial.slice(0, 2)) {
    demo.counters[trophy.name] = Math.max(1, Math.floor(trophy.target / 3));
  }
  demo.shieldOn = true;
  return demo;
}
