// Sunset Panel Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: it copies this repository's app/ and screenshots/ into the
// output directory and writes output/dossier.json with the vendored make.fun
// library, so the sealed scorer can check the entry and the judge can read it.
// Run it twice and the two outputs must be byte-identical.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root: the folder this program lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader hands the program a writable /output; anywhere else, the caller
// names the directory with MAKEFUN_OUTPUT_DIR.
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Refuses to hand in a repository whose app entry point is missing. */
function requireAppEntryPoint() {
  const entryPoint = join(repoRoot, 'app', 'index.html');
  if (!existsSync(entryPoint) || !statSync(entryPoint).isFile()) {
    throw new Error(`app/index.html is missing under ${repoRoot}`);
  }
}

requireAppEntryPoint();
mkdirSync(outputRoot, { recursive: true });

// The app, whole: every static file the browser loads, and nothing else.
cpSync(join(repoRoot, 'app'), join(outputRoot, 'app'), { recursive: true });

// The screenshots, if the maker has taken them.
mkdirSync(join(outputRoot, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputRoot, 'screenshots'), { recursive: true });
}

// The dossier the judge reads, built from exactly what was just copied, with
// the scorer's own caps (reference/gate.json): the text budget shapes the bytes;
// the other caps refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files in all, or a path under app/ over 1000 bytes. app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json.
const dossier = buildDossier(outputRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputRoot, 'dossier.json'), dossier);
