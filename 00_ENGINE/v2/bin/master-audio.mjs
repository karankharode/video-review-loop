#!/usr/bin/env node
/**
 * Master bus: bring the finished render to the platform loudness target, and
 * optionally mix the music bed in here instead of in Remotion.
 *
 *   node bin/master-audio.mjs [variation] [--in out/master.mp4]
 *                             [--out out/master_final.mp4] [--add-music]
 *
 * Two jobs, and the first one is not optional:
 *
 * 1. **Normalise to -14 LUFS / -1.5 dBTP.** Remotion cannot do this — it mixes
 *    the layers it is given and writes them out. The VO-only render measured
 *    -15.86 LUFS, so every master needs this pass whether or not it has music.
 *    -14 integrated is what IG and YouTube normalise to; mastering hotter just
 *    gets turned down at the platform and loses the dynamics on the way.
 *
 * 2. **`--add-music`** is the ffmpeg fallback route. It applies the *same*
 *    envelope from bin/lib/music.mjs to the bed offline and mixes it onto a
 *    VO-only video. Use it when you want to iterate on the mix without paying
 *    for a full frame render — the Remotion route re-renders every frame to
 *    change a duck by a decibel, this route takes seconds. The trade is that
 *    the bed is then invisible in the studio preview, so the render and the
 *    delivered file no longer sound the same. Treat it as the iteration path
 *    and the Remotion route as the deliverable.
 *
 * Video is stream-copied in both modes. Nothing here touches the picture.
 */

import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, rmSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyEnvelopeToPcm, buildEnvelope} from './lib/music.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const addMusic = process.argv.includes('--add-music');
const inFile = resolve(ROOT, argOf('--in', 'out/master.mp4'));
const outFile = resolve(ROOT, argOf('--out', 'out/master_final.mp4'));

// The variation is only needed for --add-music. build.mjs leaves the last one
// built in .active-variation, so the common case needs no argument.
const positional = process.argv.slice(2).find((a) => !a.startsWith('--') && a !== argOf('--in') && a !== argOf('--out'));
const activeFile = join(ROOT, '.active-variation');
const folder = positional
  ? resolve(positional)
  : existsSync(activeFile)
    ? readFileSync(activeFile, 'utf8').trim()
    : null;

if (!existsSync(inFile)) {
  console.error(`!! ${inFile} does not exist. Render it first:  npm run master`);
  process.exit(1);
}

const TARGET_I = -14;
const TARGET_TP = -1.5;
const TARGET_LRA = 11;

const ff = (args, opts = {}) => {
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-y', ...args], {
    encoding: opts.binary ? 'buffer' : 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    input: opts.input,
  });
  if (r.status !== 0) {
    const err = opts.binary ? r.stderr.toString() : r.stderr;
    throw new Error(`ffmpeg failed:\n${err?.slice(-2000)}`);
  }
  return opts.binary ? r.stdout : `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
};

const measure = (file) => {
  const out = ff(['-i', file, '-af', `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`, '-f', 'null', '-']);
  const m = out.match(/\{[^{}]*"input_i"[\s\S]*?\}/g);
  if (!m) throw new Error(`no loudnorm report for ${file}`);
  return JSON.parse(m[m.length - 1]);
};

let source = inFile;
const scratch = [];

// --- optional: mix the bed in offline ---------------------------------------

if (addMusic) {
  if (!folder) {
    console.error('!! --add-music needs a variation folder (or a prior build to have written .active-variation)');
    process.exit(1);
  }
  const bed = join(folder, 'assets', 'music', 'bed.wav');
  const wordsFile = join(folder, 'assets', 'words.json');
  const beatsFile = join(folder, 'assets', 'beats.json');
  for (const [f, what] of [[bed, 'bed.wav'], [wordsFile, 'words.json'], [beatsFile, 'beats.json']]) {
    if (!existsSync(f)) {
      console.error(`!! missing ${what} — run: node bin/build.mjs ${folder}`);
      process.exit(1);
    }
  }

  const {words} = JSON.parse(readFileSync(wordsFile, 'utf8'));
  const aligned = JSON.parse(readFileSync(beatsFile, 'utf8'));
  const script = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
  const metaFile = join(folder, 'assets', 'music', 'music.json');
  const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf8')) : {};
  // Same calibration the Remotion route uses. Reading it from music.json rather
  // than recomputing is what keeps the two mixes identical.
  const env = buildEnvelope({
    words,
    beats: aligned.beats,
    duration: aligned.duration,
    music: {...(script.music ?? {}), makeupDb: meta.makeupDb ?? 0},
  });

  // Decode to float samples, apply the envelope, hand it straight back. Doing
  // it in JS rather than as an ffmpeg `volume` expression is what keeps this
  // route bit-identical to the Remotion one — both read env.sampleAt().
  const RATE = 48000;
  const CH = 2;
  console.log('-- applying the duck envelope to the bed');
  const raw = ff(['-i', bed, '-f', 'f32le', '-ac', String(CH), '-ar', String(RATE), '-'], {binary: true});
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
  const peak = applyEnvelopeToPcm(pcm, env, {rate: RATE, channels: CH});
  console.log(`   ducked bed peak ${(20 * Math.log10(peak || 1e-9)).toFixed(2)} dBFS`);

  const ducked = join(ROOT, 'out', '.ducked-bed.wav');
  scratch.push(ducked);
  ff(['-f', 'f32le', '-ar', String(RATE), '-ac', String(CH), '-i', '-', '-c:a', 'pcm_s16le', ducked], {
    input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength),
  });

  const mixed = join(ROOT, 'out', '.mixed.mp4');
  scratch.push(mixed);
  // normalize=0 keeps amix from halving both inputs to avoid clipping; the
  // levels are already deliberate and the loudnorm pass below is what makes the
  // programme fit, so an automatic -6 dB here would just undo the mix.
  ff([
    '-i', inFile,
    '-i', ducked,
    '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:normalize=0[a]',
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
    mixed,
  ]);
  source = mixed;
  console.log('-- mixed bed onto the render');
}

// --- normalise --------------------------------------------------------------

const before = measure(source);
console.log(`-- in:  ${before.input_i} LUFS, ${before.input_tp} dBTP, LRA ${before.input_lra}`);

// Two-pass: the measurement above feeds the correction, so the result lands on
// target instead of near it.
ff([
  '-i', source,
  '-af',
  `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:measured_I=${before.input_i}:` +
    `measured_TP=${before.input_tp}:measured_LRA=${before.input_lra}:measured_thresh=${before.input_thresh}:` +
    `offset=${before.target_offset}:linear=true`,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000',
  outFile,
]);

const after = measure(outFile);
console.log(`-- out: ${after.input_i} LUFS, ${after.input_tp} dBTP, LRA ${after.input_lra}`);
console.log(`   ${outFile}`);

if (Number(after.input_tp) > -0.5) {
  console.log(`   ! true peak ${after.input_tp} dBTP is close to full scale — check for clipping`);
}

for (const f of scratch) rmSync(f, {force: true});
