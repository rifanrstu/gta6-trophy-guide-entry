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

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The atlas promises 55 trophies; say so in the run log if the data file ever drifts.
const trophyDoc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyCount = Array.isArray(trophyDoc) ? trophyDoc.length : trophyDoc.trophies?.length ?? 0;
console.log(`GTA VI Trophy Atlas: handing in ${trophyCount} trophies with their guides.`);

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
