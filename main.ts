// GTA VI Trophy Atlas — hand-in program (v4, Leonida Ledger build).
//
// What this file does, in order:
//   1. Reads the trophy catalogue out of app/data/trophies.json and
//      refuses to hand anything in unless all 55 trophies carry a
//      guide, a three-step breakdown, a timing note and a confidence
//      badge — a thin catalogue should fail here, not at the gate.
//   2. Copies app/ and screenshots/ into the output directory, in a
//      fixed sorted order so two runs write identical bytes.
//   3. Writes dossier.json there with the kit's own library, imported
//      unchanged from vendor/makefun-frontend.ts, under this bounty’s
//      caps.
// Every path is anchored to this file's directory, never to the
// caller's working directory, and the output folder is created
// recursively before anything is copied into it.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const EXPECTED_TROPHY_COUNT = 55;
const MINIMUM_STEPS = 3;

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputRoot =
  process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function fail(message: string): never {
  throw new Error(`trophy-atlas hand-in: ${message}`);
}

function readCatalogue(): void {
  const cataloguePath = join(repoRoot, "app", "data", "trophies.json");
  if (!existsSync(cataloguePath)) fail("app/data/trophies.json is missing");
  const parsed = JSON.parse(readFileSync(cataloguePath, "utf8")) as {
    trophies?: unknown;
  };
  const rows = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(rows)) fail("trophies.json holds no trophies array");
  if (rows.length !== EXPECTED_TROPHY_COUNT) {
    fail(`expected ${EXPECTED_TROPHY_COUNT} trophies, found ${rows.length}`);
  }
  for (const row of rows as Array<Record<string, unknown>>) {
    const label = typeof row.name === "string" ? row.name : "<unnamed>";
    if (typeof row.guide !== "string" || row.guide.trim() === "") {
      fail(`trophy "${label}" has no guide`);
    }
    if (!Array.isArray(row.steps) || row.steps.length < MINIMUM_STEPS) {
      fail(`trophy "${label}" has fewer than ${MINIMUM_STEPS} steps`);
    }
    if (typeof row.timing !== "string" || row.timing.trim() === "") {
      fail(`trophy "${label}" has no timing note`);
    }
    if (typeof row.confidence !== "string" || row.confidence.trim() === "") {
      fail(`trophy "${label}" has no confidence badge`);
    }
  }
}

function copyTree(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir).sort();
  for (const entry of entries) {
    const from = join(sourceDir, entry);
    const to = join(targetDir, entry);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

function main(): void {
  readCatalogue();
  mkdirSync(outputRoot, { recursive: true });
  copyTree(join(repoRoot, "app"), join(outputRoot, "app"));
  copyTree(join(repoRoot, "screenshots"), join(outputRoot, "screenshots"));
  const dossier = buildDossier(outputRoot, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputRoot, "dossier.json"), dossier);
  const where = relative(process.cwd(), outputRoot) || outputRoot;
  console.log(
    `trophy-atlas: handed in app/ + screenshots/ + dossier.json (${dossier.length} bytes) at ${where.split(sep).join("/")}`,
  );
}

main();
