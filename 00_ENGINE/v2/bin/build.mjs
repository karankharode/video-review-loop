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
 *   music  → a bed, normalised to a known level
 *   link   → aligned timeline + assets copied where Remotion can see them,
 *            plus the music duck envelope computed from the aligned words
 *   render → optional; master + alpha overlays
 *
 * Alignment sits *before* everything visual because in v2 the audio is the
 * clock. Change a word and every caption, cut and graphic moves with it.
 */

import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {applyEnvelopeToPcm, buildEnvelope, describeEnvelope} from './lib/music.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// design.ts is the single source of truth for the frame rate and it is
// TypeScript, so it is read rather than duplicated — a second copy of this
// number would eventually disagree with the first.
const FPS = (() => {
  const src = readFileSync(join(ROOT, 'src', 'core', 'design.ts'), 'utf8');
  const m = src.match(/export const FPS\s*=\s*(\d+)/);
  if (!m) throw new Error('could not read FPS from src/core/design.ts');
  return Number(m[1]);
})();

const folderArg = process.argv[2];
if (!folderArg) {
  console.error('usage: node bin/build.mjs <variation-folder> [--force-tts] [--skip-stock] [--render]');
  process.exit(1);
}
const folder = resolve(folderArg);
const forceTts = process.argv.includes('--force-tts');
const skipStock = process.argv.includes('--skip-stock');
const skipMusic = process.argv.includes('--skip-music');
const doRender = process.argv.includes('--render');

const step = (n, label) => console.log(`\n\x1b[1m[${n}] ${label}\x1b[0m`);

/**
 * Print the envelope into a copy of the bed, at sample resolution.
 *
 * Uses the same applyEnvelopeToPcm as bin/master-audio.mjs, so the bed Remotion
 * plays and the bed the offline mix builds are the same waveform.
 */
const duckBed = (src, dest, env) => {
  const RATE = 48000;
  const CH = 2;
  const dec = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-y', '-i', src, '-f', 'f32le', '-ac', String(CH), '-ar', String(RATE), '-'], {maxBuffer: 512 * 1024 * 1024});
  if (dec.status !== 0) throw new Error(`ffmpeg decode failed:\n${dec.stderr?.toString().slice(-1000)}`);
  const pcm = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, Math.floor(dec.stdout.byteLength / 4));
  const peak = applyEnvelopeToPcm(pcm, env, {rate: RATE, channels: CH});
  const enc = spawnSync(
    'ffmpeg',
    ['-nostdin', '-hide_banner', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', String(CH), '-i', '-', '-c:a', 'pcm_s16le', dest],
    {input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength), maxBuffer: 512 * 1024 * 1024},
  );
  if (enc.status !== 0) throw new Error(`ffmpeg encode failed:\n${enc.stderr?.toString().slice(-1000)}`);
  return peak;
};
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

// --- 3b. music ------------------------------------------------------------
//
// After alignment because the bed is cut to the measured duration, not the
// duration the script hoped for. A missing bed is not fatal: the render just
// ships without music, same as it ships without stock.
step('3b', 'Music bed');
if (skipMusic) {
  console.log('-- skipped (--skip-music)');
} else {
  try {
    run('node', ['bin/fetch-music.mjs', folder]);
  } catch (e) {
    console.log(`-- continuing without music: ${e.message ?? e}`);
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

// Music: same availability contract as stock, plus the duck envelope.
//
// The envelope is computed here rather than in the renderer for two reasons.
// It needs words.json, which lives with the variation and never reaches
// public/. And the offline ffmpeg mix has to be able to reproduce the identical
// curve — baking it into the timeline is what makes the two routes agree
// instead of drifting into two slightly different mixes.
rmSync(join(pub, 'music'), {recursive: true, force: true});
const bedFile = join(folder, 'assets', 'music', 'bed.wav');
const wordsFile = join(folder, 'assets', 'words.json');
if (existsSync(bedFile) && existsSync(wordsFile)) {
  mkdirSync(join(pub, 'music'), {recursive: true});

  const script = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
  const {words} = JSON.parse(readFileSync(wordsFile, 'utf8'));
  const meta = existsSync(join(folder, 'assets', 'music', 'music.json'))
    ? JSON.parse(readFileSync(join(folder, 'assets', 'music', 'music.json'), 'utf8'))
    : {};
  // makeupDb comes from fetch-music's calibration, not from script.json — it is
  // a measurement of this voiceover, not an authored value.
  const env = buildEnvelope({
    words,
    beats: aligned.beats,
    duration: aligned.duration,
    music: {...(script.music ?? {}), makeupDb: meta.makeupDb ?? 0},
  });
  // The duck is printed into the copy Remotion plays, rather than passed to
  // <Audio volume={fn}>.
  //
  // Remotion turns a per-frame volume callback into one nested ffmpeg `volume`
  // expression, and a smooth curve over 1352 frames produces enough distinct
  // values to overrun ffmpeg's expression parser outright:
  //   "Missing ')' or too many args in 'if(between(t,...)...'"
  // Baking it sidesteps that, and it is the better shape anyway — the studio
  // preview then plays exactly what renders.
  const duckedPeak = duckBed(bedFile, join(pub, 'music', 'bed.wav'), env);

  aligned._music = {
    src: 'music/bed.wav',
    bedLufs: meta.bedLufsInMaster ?? meta.bedLufs ?? env.cfg.bedLufs,
    endAt: env.endAt,
    credit: meta.credit ?? '',
    title: meta.title ?? '',
    /** The bed in public/ already has the envelope applied. */
    ducked: true,
    duckedPeakDb: Number((20 * Math.log10(duckedPeak || 1e-9)).toFixed(2)),
  };

  const rows = describeEnvelope(env, aligned.beats);
  // Reported relative to the bed's own nominal level, so the numbers read as
  // duck depth. The calibration gain is a constant offset on every point and
  // showing it in each row would just obscure the shape.
  const mk = meta.makeupDb ?? 0;
  console.log(`-- music: ${meta.title ?? 'bed'}, ${meta.bedLufsInMaster ?? '?'} LUFS in the master`);
  console.log(`   duck depth per beat, relative to the bed's nominal level:`);
  for (const r of rows) {
    const tag = r.mode === 'normal' ? '' : `  <- ${r.mode}`;
    console.log(
      `   ${r.id.padEnd(12)} ${r.start.toFixed(2).padStart(6)}-${r.end.toFixed(2).padStart(6)}  ` +
        `${(r.minDb - mk).toFixed(1).padStart(6)} .. ${(r.maxDb - mk).toFixed(1).padStart(5)} dB${tag}`,
    );
  }
  console.log(`   ducked bed peaks at ${aligned._music.duckedPeakDb} dBFS, out at ${env.endAt.toFixed(2)}s`);
} else if (existsSync(bedFile)) {
  console.log('-- music bed found but no words.json; skipping (the duck needs the alignment)');
}

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
  // Remotion mixes the layers but cannot set programme loudness, so the render
  // is not the deliverable until this has run.
  run('node', ['bin/master-audio.mjs']);
  console.log('\nAlpha overlays are separate (they need PNG frames):');
  console.log('  npm run captions');
  console.log('  npm run graphics');
} else {
  console.log('\nNext:');
  console.log('  npm run studio     # preview');
  console.log('  npm run master     # render the video');
}
