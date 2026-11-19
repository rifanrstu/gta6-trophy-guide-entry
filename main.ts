// GTA VI Trophy Atlas — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
// The atlas itself is the static app in app/: index.html, its stylesheet, the ES modules in
// app/js/ and the trophy data in app/data/trophies.json. It needs no build step and no network.
// This program's one job is to hand that app in exactly as the scorer expects: copy app/ and
// screenshots/ beside this file into the output directory, then write dossier.json with the
// vendored make.fun library (vendor/makefun-frontend.ts, left byte-for-byte as the kit ships it,
// because the gate rebuilds the dossier with its own copy and compares the two).
// Try the atlas locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Revision in this build: before handing anything in, the program now also checks the
// revision's promise — that every one of the 55 trophies carries a non-empty guide, a
// step breakdown of at least two steps, a timing line and a confidence note — and it
// logs how many steps it is handing in. A data file that drifted from that promise is
// visible in the run log instead of reaching the judge quietly half-finished.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The atlas promises 55 trophies; say so in the run log if the data file ever drifts,
// with the grade split the official list publishes (1 platinum, 2 gold, 6 silver, 46 bronze).
const trophyDoc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyList = Array.isArray(trophyDoc) ? trophyDoc : trophyDoc.trophies ?? [];
const gradeSplit = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => `${trophyList.filter((t) => t.grade === grade).length} ${grade}`).join(', ');

const stepCount = trophyList.reduce((sum, t) => sum + (Array.isArray(t.steps) ? t.steps.length : 0), 0);
const incomplete = trophyList.filter(
  (t) => !String(t.guide ?? '').trim() || !Array.isArray(t.steps) || t.steps.length < 2 || !String(t.timing ?? '').trim() || !String(t.confidence ?? '').trim(),
);
console.log(`GTA VI Trophy Atlas: handing in ${trophyList.length} trophies with their guides (${gradeSplit}) and ${stepCount} guide steps.`);
if (incomplete.length) {
  console.log(`Warning: ${incomplete.length} trophies are missing a guide, steps, timing or confidence: ${incomplete.map((t) => t.name).join('; ')}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps from the scorer's gate (reference/gate.json): text_max_bytes shapes the dossier text;
// the rest refuse an entry the scorer would refuse anyway (over 4 screenshots or one over
// 256 KiB; over 993 entries or 48 MiB in app/, which shares /output's own 1,000-entry cap
// with screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
