// main.ts — the hand-in program for the Dusk Ledger entry (Node 22,
// standard library only). It proves the trophy data is complete, copies
// app/ and screenshots/ from beside this file into the output directory,
// and writes the dossier the judge reads with the vendored library.
//   MAKEFUN_OUTPUT_DIR=out node main.ts     (outside the grader, out/ is a
//   stand-in for /output; the grader runs it with /output itself)

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ——— Prove the guide's data before handing anything in ———
// Every one of the 55 trophies must carry a guide, a three-step breakdown,
// a timing line and a confidence value; a blank anywhere fails loudly here
// rather than quietly in front of the gate.
const rawData = JSON.parse(readFileSync(join(repoDir, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = Array.isArray(rawData) ? rawData : rawData.trophies;
if (!Array.isArray(trophies)) throw new Error('app/data/trophies.json holds no trophies array');
if (trophies.length !== 55) throw new Error(`expected 55 trophies, found ${trophies.length}`);

const problems: string[] = [];
for (const trophy of trophies) {
  const label = typeof trophy?.name === 'string' && trophy.name ? trophy.name : '(unnamed trophy)';
  if (typeof trophy?.guide !== 'string' || !trophy.guide.trim()) problems.push(`${label}: guide is blank`);
  const steps = Array.isArray(trophy?.steps) ? trophy.steps.filter((s: unknown) => typeof s === 'string' && s.trim()) : [];
  if (steps.length < 3) problems.push(`${label}: only ${steps.length} usable steps, needs 3`);
  if (typeof trophy?.timing !== 'string' || !trophy.timing.trim()) problems.push(`${label}: timing line is blank`);
  if (typeof trophy?.confidence !== 'string' || !trophy.confidence.trim()) problems.push(`${label}: confidence value is blank`);
}
if (problems.length) throw new Error(`trophy data is incomplete:\n  ${problems.slice(0, 8).join('\n  ')}`);

// ——— Copy the entry and write its dossier ———
mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (reference/gate.json): the dossier text cap
// shapes the bytes, the rest refuse up front what the scorer would refuse.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Dusk Ledger handed in: 55 trophies validated, dossier written to ${outDir}`);
