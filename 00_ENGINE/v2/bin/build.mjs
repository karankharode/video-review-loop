#!/usr/bin/env node
/**
 * Orchestrator.
 *
 *   node bin/build.mjs <variation-folder> [--force-tts] [--skip-stock] [--render]
 *
 * Order matters and encodes the engine's central idea:
 *
 *   tts    → one continuous voiceover
 *   align  → whisper measures it; beats and per-word times fall out
 *   stock  → footage fetched per beat
 *   link   → aligned timeline + assets copied where Remotion can see them
 *   render → optional; master + alpha overlays
 *
 * Alignment sits *before* everything visual because in v2 the audio is the
 * clock. Change a word and every caption, cut and graphic moves with it.
 */

import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const folderArg = process.argv[2];
if (!folderArg) {
  console.error('usage: node bin/build.mjs <variation-folder> [--force-tts] [--skip-stock] [--render]');
  process.exit(1);
}
const folder = resolve(folderArg);
const forceTts = process.argv.includes('--force-tts');
const skipStock = process.argv.includes('--skip-stock');
const doRender = process.argv.includes('--render');

const step = (n, label) => console.log(`\n\x1b[1m[${n}] ${label}\x1b[0m`);
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, {stdio: 'inherit', cwd: ROOT, ...opts});

// --- 1. voice -------------------------------------------------------------
step(1, 'Voiceover');
run('node', ['bin/tts.mjs', folder, ...(forceTts ? ['--force'] : [])]);

// --- 2. alignment ---------------------------------------------------------
step(2, 'Forced alignment');
run('node', ['bin/align.mjs', folder]);

// --- 3. stock -------------------------------------------------------------
step(3, 'Stock footage');
if (skipStock) {
  console.log('-- skipped (--skip-stock)');
} else {
  try {
    run('node', ['bin/fetch-stock.mjs', folder]);
  } catch (e) {
    // Exit code 2 means "no API key" — a documented, recoverable state.
    if (e.status === 2) {
      console.log('-- continuing without stock; beats fall back to generated backdrops');
    } else {
      throw e;
    }
  }
}

// --- 4. link --------------------------------------------------------------
step(4, 'Link assets');

const beatsFile = join(folder, 'assets', 'beats.json');
if (!existsSync(beatsFile)) {
  console.error('!! No assets/beats.json — alignment did not complete.');
  process.exit(1);
}

// Remotion can only serve from public/, and composition durations must be
// known at bundle time, so this is a copy rather than a symlink.
const pub = join(ROOT, 'public');
rmSync(join(pub, 'stock'), {recursive: true, force: true});
mkdirSync(join(pub, 'stock'), {recursive: true});

const voice = join(folder, 'assets', 'voice.wav');
if (existsSync(voice)) cpSync(voice, join(pub, 'voice.wav'));

const stockDir = join(folder, 'assets', 'stock');
let available = [];
if (existsSync(stockDir)) {
  cpSync(stockDir, join(pub, 'stock'), {recursive: true});
  available = readdirSync(join(pub, 'stock'))
    .filter((x) => x.endsWith('.mp4'))
    .map((x) => x.replace(/\.mp4$/, ''));
}
const clips = available.length;

// Presenter clips: stock now, your own recordings later. Same drop-in path.
rmSync(join(pub, 'face'), {recursive: true, force: true});
mkdirSync(join(pub, 'face'), {recursive: true});
const faceDir = join(folder, 'assets', 'face');
let faces = [];
if (existsSync(faceDir)) {
  cpSync(faceDir, join(pub, 'face'), {recursive: true});
  faces = readdirSync(join(pub, 'face'))
    .filter((x) => x.endsWith('.mp4'))
    .map((x) => x.replace(/\.mp4$/, ''));
}

// Record which clips actually landed. The renderer cannot stat the filesystem,
// so without this it would request a missing clip and 404 the whole render
// instead of falling back to a generated backdrop.
const aligned = JSON.parse(readFileSync(beatsFile, 'utf8'));
aligned._stockAvailable = available;
aligned._faceAvailable = faces;
writeFileSync(join(ROOT, 'src', 'timeline.json'), JSON.stringify(aligned, null, 2));

writeFileSync(join(ROOT, '.active-variation'), folder + '\n');

const spec = JSON.parse(readFileSync(beatsFile, 'utf8'));
console.log(`-- linked ${spec.id}`);
console.log(`   beats:    ${spec.beats.length}`);
console.log(`   clips:    ${clips}`);
console.log(`   duration: ${spec.duration.toFixed(2)}s`);

// --- 5. render ------------------------------------------------------------
if (doRender) {
  step(5, 'Render');
  run('npx', ['remotion', 'render', 'src/index.ts', 'Master', 'out/master.mp4', '--concurrency=4']);
  console.log('\nAlpha overlays are separate (they need PNG frames):');
  console.log('  npm run captions');
  console.log('  npm run graphics');
} else {
  console.log('\nNext:');
  console.log('  npm run studio     # preview');
  console.log('  npm run master     # render the video');
}
