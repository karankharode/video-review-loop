#!/usr/bin/env node
/**
 * Music bed fetcher (Incompetech / Kevin MacLeod, CC BY 4.0).
 *
 *   node bin/fetch-music.mjs <variation-folder> [--force] [--list] [--pick <isrc>]
 *                            [--query "<terms>"]
 *
 * Reads   script.json  (music.query / music.trackId / music.bedLufs)
 *         assets/beats.json  (for the duration to cut the bed to)
 * Writes  assets/music/source/<slug>.mp3   raw download, cached
 *         assets/music/bed.wav             trimmed + normalised to bedLufs
 *         assets/music/music.json          the choice, so a rebuild is stable
 *         assets/music/ATTRIBUTION.md      title, artist, licence, credit line
 *
 * Why Incompetech rather than a search API: it publishes its whole catalogue as
 * JSON (title, feel, instruments, bpm, length, ISRC), which makes "calm ambient,
 * no vocals, low-mid energy" a query you can actually run and re-run instead of
 * a track someone once picked by ear. The library is entirely instrumental
 * except where `instruments` says otherwise, and those get filtered out — a
 * lyric competes with the VO for the same listening channel.
 *
 * Licence: Creative Commons BY 4.0. Free for commercial use, credit required.
 * The credit line is written into ATTRIBUTION.md — it is not optional, and the
 * point of recording it here is that it survives the render.
 *
 * No API key. The catalogue is a public file and is cached for a week.
 */

import {spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, isAbsolute, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyEnvelopeToPcm, buildEnvelope, resolveMusicConfig} from './lib/music.mjs';

/** Must match TARGET_I in bin/master-audio.mjs — the platform delivery target. */
const MASTER_TARGET_LUFS = -14;

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const CATALOGUE = 'https://incompetech.com/music/royalty-free/pieces.json';
const DOWNLOAD = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
const TRACK_PAGE = 'https://incompetech.com/music/royalty-free/index.html?isrc=';
const LICENCE = 'CC BY 4.0';
const LICENCE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Anything that puts a human voice in the mix, however wordless. */
const VOCAL = /voice|vocal|choir|chant|singer|soprano|tenor|acappella|a cappella/i;

const folder = process.argv[2];
if (!folder) {
  console.error('usage: node bin/fetch-music.mjs <variation-folder> [--force] [--list]');
  process.exit(1);
}
const force = process.argv.includes('--force');
const list = process.argv.includes('--list');
const pickIdx = process.argv.indexOf('--pick');
const pinned = pickIdx > -1 ? process.argv[pickIdx + 1] : null;
// --query overrides script.json for auditioning; it never writes the choice back,
// so the reproducible path stays "pin a trackId in script.json".
const queryIdx = process.argv.indexOf('--query');
const queryOverride = queryIdx > -1 ? process.argv[queryIdx + 1] : null;

const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
if (!spec.music && !list) {
  console.log('-- no `music` block in script.json; skipping the bed');
  process.exit(0);
}
const cfg = resolveMusicConfig(spec.music ?? {});

// Duration comes from the aligned beats when they exist, because that is the
// only number that reflects the voiceover we actually got back from Sarvam.
const beatsFile = join(folder, 'assets', 'beats.json');
const duration = existsSync(beatsFile)
  ? JSON.parse(readFileSync(beatsFile, 'utf8')).duration
  : (spec.targetDuration ?? 45);

const outDir = join(folder, 'assets', 'music');
const srcDir = join(outDir, 'source');
mkdirSync(srcDir, {recursive: true});

/**
 * ffmpeg writes its loudnorm JSON report to stderr, so both streams come back
 * joined — reading only stdout here silently returns nothing to parse.
 */
const ff = (args, opts = {}) => {
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-y', ...args], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    input: opts.input,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr?.slice(-2000)}`);
  return `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
};

/** Same, but hands back raw bytes for the sample-level work. */
const ffBinary = (args) => {
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-y', ...args], {maxBuffer: 512 * 1024 * 1024});
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr?.toString().slice(-2000)}`);
  return r.stdout;
};

// --- catalogue -------------------------------------------------------------

async function catalogue() {
  const cacheDir = join(ROOT, '.cache');
  mkdirSync(cacheDir, {recursive: true});
  const cache = join(cacheDir, 'incompetech-pieces.json');
  if (existsSync(cache) && Date.now() - statSync(cache).mtimeMs < CACHE_TTL_MS && !force) {
    return JSON.parse(readFileSync(cache, 'utf8'));
  }
  const r = await fetch(CATALOGUE);
  if (!r.ok) {
    if (existsSync(cache)) {
      console.log(`  ! catalogue fetch ${r.status}; using the cached copy`);
      return JSON.parse(readFileSync(cache, 'utf8'));
    }
    throw new Error(`catalogue fetch failed (${r.status})`);
  }
  const j = await r.json();
  writeFileSync(cache, JSON.stringify(j));
  return j;
}

const secs = (hhmmss) => {
  const p = String(hhmmss ?? '').split(':').map(Number);
  if (p.length !== 3 || p.some(Number.isNaN)) return 0;
  return p[0] * 3600 + p[1] * 60 + p[2];
};

/**
 * Score a track against the brief. Deliberately simple and inspectable: every
 * point is traceable to a term in `music.query` or a stated constraint, so
 * `--list` explains the pick rather than asserting it.
 */
function score(track, terms, maxBpm) {
  const hay = [track.title, track.feel, track.description, track.instruments]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let s = 0;
  const hits = [];
  for (const t of terms) {
    // `feel` is the curated mood field, so a hit there is worth more than a
    // hit in the prose description.
    if (String(track.feel ?? '').toLowerCase().includes(t)) {
      s += 3;
      hits.push(`feel:${t}`);
    } else if (hay.includes(t)) {
      s += 1;
      hits.push(t);
    }
  }

  const bpm = Number(track.bpm ?? 0);
  // bpm 0 means unmeasured, which in this catalogue is overwhelmingly the
  // ambient and drone material — exactly what a bed wants.
  if (bpm === 0) s += 2;
  else if (bpm <= maxBpm) s += 1;
  else s -= 3;

  // Long enough to cover the video without looping.
  const len = secs(track.length);
  if (len >= duration) s += 2;
  else if (len > 0) s -= 1;

  return {s, hits, len, bpm};
}

// --- local files -----------------------------------------------------------
//
// A track you already have always wins over a search. Drop files into
// 00_ENGINE/v2/music-library/ (or set MUSIC_LIBRARY, or give an absolute path)
// and reference one as `music.file`. Everything downstream — the window, the
// calibration, the duck, the attribution record — is identical either way; only
// where the audio came from changes.

const LIB_DIRS = [
  process.env.MUSIC_LIBRARY,
  join(ROOT, 'music-library'),
  join(HERE, '..', '..', 'music-library'),
].filter(Boolean);

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i;

/** Every audio file in the library dirs, deduped by resolved path. */
function libraryFiles() {
  const seen = new Map();
  for (const dir of LIB_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!AUDIO_EXT.test(name)) continue;
      const p = join(dir, name);
      if (!seen.has(p)) seen.set(p, {path: p, name});
    }
  }
  return [...seen.values()];
}

/** Read whatever the file itself claims about title and artist. */
function fileTags(path) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:format_tags=title,artist', '-of', 'json', path], {encoding: 'utf8'});
  try {
    const j = JSON.parse(r.stdout);
    return {
      title: j.format?.tags?.title ?? j.format?.tags?.TITLE ?? null,
      artist: j.format?.tags?.artist ?? j.format?.tags?.ARTIST ?? null,
      duration: Number(j.format?.duration ?? 0),
    };
  } catch {
    return {title: null, artist: null, duration: 0};
  }
}

/**
 * Resolve `music.file` to a path on disk. Accepts an absolute path, a path
 * relative to the variation, or a bare filename to look up in the library.
 */
function resolveLocalTrack(want) {
  const tries = [
    isAbsolute(want) ? want : null,
    join(folder, want),
    ...LIB_DIRS.map((d) => join(d, want)),
  ].filter(Boolean);
  for (const t of tries) if (existsSync(t)) return t;
  // Last resort: match on basename, so "lifted-up" finds a longer real filename.
  const stem = want.toLowerCase().replace(AUDIO_EXT, '');
  const hit = libraryFiles().find((f) => f.name.toLowerCase().includes(stem));
  return hit?.path ?? null;
}

const localWant = spec.music?.file ?? null;
let localPath = null;
if (localWant) {
  localPath = resolveLocalTrack(localWant);
  if (!localPath) {
    console.error(`!! music.file "${localWant}" not found.`);
    console.error(`   Looked in: ${LIB_DIRS.join(', ')}`);
    const have = libraryFiles();
    if (have.length) {
      console.error('   Library currently holds:');
      for (const f of have) console.error(`     ${f.name}`);
    } else {
      console.error('   The library is empty — drop audio files in and rerun.');
    }
    process.exit(1);
  }
}

if (list && localWant === null && libraryFiles().length) {
  console.log(`Local library (${libraryFiles().length} files) — reference one as music.file:`);
  for (const f of libraryFiles()) {
    const t = fileTags(f.path);
    console.log(`  ${f.name}${t.title ? `   "${t.title}"${t.artist ? ` — ${t.artist}` : ''}` : ''}  ${t.duration ? t.duration.toFixed(0) + 's' : ''}`);
  }
  console.log('');
}

const cat = localPath ? [] : await catalogue();

const usable = cat.filter((t) => {
  if (!t.filename || !t.filename.endsWith('.mp3')) return false;
  if (VOCAL.test(String(t.instruments ?? ''))) return false;
  return true;
});

const terms = String(queryOverride ?? spec.music?.query ?? 'calm ambient')
  .toLowerCase()
  .split(/[\s,]+/)
  .filter(Boolean);
const maxBpm = Number(spec.music?.maxBpm ?? 100);

const ranked = usable
  .map((t) => ({t, ...score(t, terms, maxBpm)}))
  .sort((a, b) => b.s - a.s || b.len - a.len);

if (list && !localPath) {
  console.log(`Catalogue: ${cat.length} pieces, ${usable.length} instrumental`);
  console.log(`Query: ${JSON.stringify(terms)}  maxBpm ${maxBpm}  need >= ${duration.toFixed(1)}s\n`);
  for (const r of ranked.slice(0, 25)) {
    console.log(
      `${String(r.s).padStart(3)}  ${r.t.isrc}  ${r.t.title.slice(0, 30).padEnd(30)}  ` +
        `${r.t.length}  bpm ${String(r.bpm).padStart(3)}  ${String(r.t.feel).slice(0, 34).padEnd(34)}  ${r.hits.join(',')}`,
    );
  }
  process.exit(0);
}

// A pinned trackId is the reproducible path: once a bed is chosen it should not
// move because the catalogue gained a better-scoring track next week.
const wantId = pinned ?? spec.music?.trackId ?? null;
let chosen;
let source;

if (localPath) {
  const tags = fileTags(localPath);
  const base = basename(localPath).replace(AUDIO_EXT, '');
  chosen = {
    title: spec.music?.title ?? tags.title ?? base,
    artist: spec.music?.artist ?? tags.artist ?? null,
    length: tags.duration,
    feel: spec.music?.feel ?? '(local file)',
    instruments: '(not declared)',
    bpm: null,
    isrc: null,
    uuid: null,
  };
  source = 'local';
  console.log(`-- ${chosen.title}${chosen.artist ? ` — ${chosen.artist}` : ''}  (local file)`);
  console.log(`   ${localPath}`);
  // A local file's licence cannot be inferred from the file, so it has to be
  // stated. Better a loud reminder here than a silent gap in ATTRIBUTION.md.
  if (!spec.music?.licence) {
    console.log(`   ! no music.licence in script.json — recorded as UNVERIFIED. Set it before publishing.`);
  }
} else {
  chosen = wantId ? usable.find((t) => t.isrc === wantId || t.uuid === wantId) : ranked[0]?.t;
  if (!chosen) {
    console.error(`!! No track matched${wantId ? ` id ${wantId}` : ''}. Try: node bin/fetch-music.mjs ${folder} --list`);
    process.exit(1);
  }
  if (wantId && VOCAL.test(String(chosen.instruments ?? ''))) {
    console.error(`!! ${chosen.title} lists vocals (${chosen.instruments}) — that fights the VO. Pick another.`);
    process.exit(1);
  }
  source = 'incompetech';
  console.log(`-- ${chosen.title} — ${chosen.length}, bpm ${chosen.bpm || 'n/a'}, ${chosen.feel}`);
  console.log(`   ${chosen.instruments}`);
}

const slug = String(chosen.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// --- obtain the audio ------------------------------------------------------

let mp3;
if (localPath) {
  // Copied in rather than referenced, so the variation stays self-contained and
  // a rebuild does not depend on a file still sitting in Downloads.
  mp3 = join(srcDir, basename(localPath));
  if (existsSync(mp3) && statSync(mp3).size > 10000 && !force) {
    console.log(`  = ${basename(mp3)} (cached)`);
  } else {
    cpSync(localPath, mp3);
    console.log(`  + ${basename(mp3)}  ${(statSync(mp3).size / 1e6).toFixed(1)}MB (copied from ${dirname(localPath)})`);
  }
} else {
  mp3 = join(srcDir, `${slug}.mp3`);
  if (existsSync(mp3) && statSync(mp3).size > 100000 && !force) {
    console.log(`  = ${slug}.mp3 (cached)`);
  } else {
    const url = DOWNLOAD + encodeURIComponent(chosen.filename);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`!! download failed (${res.status}) for ${url}`);
      process.exit(1);
    }
    writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
    console.log(`  + ${slug}.mp3  ${(statSync(mp3).size / 1e6).toFixed(1)}MB`);
  }
}

// --- trim, normalise, calibrate --------------------------------------------
//
// `bedLufs` is the level of the bed *as heard in the delivered master*, which
// is the only definition that means anything to a listener. Getting there takes
// three corrections, and skipping any of them lands the bed several dB adrift:
//
//   1. Normalise the window to a known nominal level.
//   2. Subtract what the duck takes away. The envelope spends most of the video
//      9 dB down, so a bed normalised to -26 before ducking plays at about -35.
//      This is measured by actually applying the envelope, not estimated.
//   3. Subtract what the master bus will add. bin/master-audio.mjs lifts the
//      programme to -14 LUFS, and that gain lifts the bed with it.
//
// Do only step 1 — as the first version of this did — and the bed measures
// -26 in a file nobody ever hears, then arrives ~7 dB too quiet in the master.

const bed = join(outDir, 'bed.wav');
const startAt = Number(spec.music?.startAt ?? 0);
const srcLen = secs(chosen.length);
const needsLoop = srcLen > 0 && srcLen - startAt < duration;
if (needsLoop) {
  console.log(`  ! source is ${srcLen}s from ${startAt}s — looping to cover ${duration.toFixed(1)}s`);
}

const measure = (file, extra = []) => {
  const out = ff([...extra, '-i', file, '-af', `loudnorm=I=${cfg.bedLufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = out.match(/\{[^{}]*"input_i"[\s\S]*?\}/g);
  if (!m) throw new Error(`could not read a loudnorm report from ffmpeg for ${file}`);
  return JSON.parse(m[m.length - 1]);
};

const loopArgs = needsLoop ? ['-stream_loop', '-1'] : [];
const trimmed = join(outDir, '.trimmed.wav');
ff([...loopArgs, '-ss', String(startAt), '-i', mp3, '-t', String(duration), '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', trimmed]);

// Two-pass loudnorm: measure the trimmed segment, then correct it. One pass
// guesses from a running estimate and lands a decibel or two off, which on a
// bed this quiet is the difference between atmosphere and audible.
const pass1 = measure(trimmed);
ff([
  '-i', trimmed,
  '-af',
  `loudnorm=I=${cfg.bedLufs}:TP=-1.5:LRA=11:measured_I=${pass1.input_i}:measured_TP=${pass1.input_tp}:` +
    `measured_LRA=${pass1.input_lra}:measured_thresh=${pass1.input_thresh}:offset=${pass1.target_offset}:linear=true`,
  '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le',
  bed,
]);
rmSync(trimmed, {force: true});

// --- step 2: how much does the duck actually take away? ---------------------
//
// Measured by applying the real envelope, because the answer depends on how
// much of this particular video is speech — a dense script loses more than a
// sparse one, and no fixed offset can know that.

const RATE = 48000;
const CH = 2;
const wordsFile = join(folder, 'assets', 'words.json');

const verify = measure(bed);
console.log(`  bed file: ${verify.input_i} LUFS, true peak ${verify.input_tp} dBTP`);

/** Apply an envelope to the bed and report what it measures. */
const duckedStats = (envelope) => {
  const raw = ffBinary(['-i', bed, '-f', 'f32le', '-ac', String(CH), '-ar', String(RATE), '-']);
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
  const peak = applyEnvelopeToPcm(pcm, envelope, {rate: RATE, channels: CH});
  const probe = join(outDir, '.ducked-probe.wav');
  ff(['-f', 'f32le', '-ar', String(RATE), '-ac', String(CH), '-i', '-', '-c:a', 'pcm_f32le', probe], {
    input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength),
  });
  const lufs = Number(measure(probe).input_i);
  rmSync(probe, {force: true});
  return {lufs, peakDb: 20 * Math.log10(peak || 1e-9)};
};

let duckLoss = 0;
let masterGain = 0;
let makeupDb = 0;
let ducked = null;

const voiceFile = join(folder, 'assets', 'voice.wav');
if (existsSync(voiceFile)) {
  const voiceLufs = Number(measure(voiceFile).input_i);
  masterGain = MASTER_TARGET_LUFS - voiceLufs;
  console.log(`  voice ${voiceLufs.toFixed(2)} LUFS, so the master bus will add ${masterGain.toFixed(2)} dB`);
}

if (existsSync(wordsFile) && existsSync(beatsFile)) {
  const {words} = JSON.parse(readFileSync(wordsFile, 'utf8'));
  const aligned = JSON.parse(readFileSync(beatsFile, 'utf8'));
  const shape = {words, beats: aligned.beats, duration: aligned.duration};

  // Measure the duck's cost on the uncorrected curve, then re-measure with the
  // correction folded in. Two passes because the loss depends only on the
  // envelope's shape, while the check for clipping depends on its level.
  duckLoss = duckedStats(buildEnvelope({...shape, music: {...(spec.music ?? {}), makeupDb: 0}})).lufs - cfg.bedLufs;
  makeupDb = -(duckLoss + masterGain);
  console.log(`  duck costs ${duckLoss.toFixed(2)} dB across this script`);

  ducked = duckedStats(buildEnvelope({...shape, music: {...(spec.music ?? {}), makeupDb}}));
  console.log(`  calibration: ${makeupDb >= 0 ? '+' : ''}${makeupDb.toFixed(2)} dB folded into the envelope`);
  console.log(`  bed in the master: ${(ducked.lufs + masterGain).toFixed(2)} LUFS (target ${cfg.bedLufs}), peak ${ducked.peakDb.toFixed(2)} dBFS`);

  // The bed is summed with the voice, so its own peak must leave room. This is
  // measured on the actual ducked waveform rather than inferred from the file's
  // headroom, because the envelope both lifts and attenuates.
  if (ducked.peakDb > -1) {
    console.log(`  ! ducked bed peaks at ${ducked.peakDb.toFixed(2)} dBFS — too hot to sum cleanly.`);
    console.log(`    Pick a lower-crest track, or lower music.bedLufs in script.json.`);
  }
} else {
  console.log('  ! no alignment yet — envelope not calibrated; rebuild after align');
}

// --- record ----------------------------------------------------------------

// A local file carries no licence information that can be read off the audio,
// so whatever script.json declares is what gets recorded — and if it declares
// nothing, that is recorded too, loudly, rather than being left blank.
const isLocal = source === 'local';
const artist = isLocal ? (chosen.artist ?? 'unknown') : 'Kevin MacLeod';
const licence = isLocal ? (spec.music?.licence ?? 'UNVERIFIED — set music.licence in script.json') : LICENCE;
const licenceUrl = isLocal ? (spec.music?.licenceUrl ?? '') : LICENCE_URL;
const sourceName = isLocal ? (spec.music?.source ?? 'local file') : 'Incompetech';
const sourceUrl = isLocal ? (spec.music?.sourceUrl ?? '') : TRACK_PAGE + chosen.isrc;

const credit = isLocal
  ? spec.music?.credit ??
    `"${chosen.title}"${chosen.artist ? ` by ${chosen.artist}` : ''}${sourceName !== 'local file' ? ` (${sourceName})` : ''}${licenceUrl ? ` — ${licence}: ${licenceUrl}` : ` — ${licence}`}`
  : `"${chosen.title}" by Kevin MacLeod (incompetech.com) — licensed under ${LICENCE}: ${LICENCE_URL}`;

const record = {
  title: chosen.title,
  artist,
  source: sourceName,
  sourceUrl,
  originPath: isLocal ? localPath : null,
  isrc: chosen.isrc,
  uuid: chosen.uuid,
  licence,
  licenceUrl,
  licenceVerified: isLocal ? Boolean(spec.music?.licence) : true,
  credit,
  feel: chosen.feel,
  instruments: chosen.instruments,
  bpm: chosen.bpm,
  sourceLength: chosen.length,
  startAt,
  looped: needsLoop,
  bedFile: 'bed.wav',
  bedLufs: Number(verify.input_i),
  bedTruePeak: Number(verify.input_tp),
  targetLufs: cfg.bedLufs,
  // The calibration. build.mjs and master-audio.mjs both fold this into the
  // envelope; without it the bed plays about 7 dB under the brief.
  makeupDb: Number(makeupDb.toFixed(3)),
  duckLossDb: Number(duckLoss.toFixed(3)),
  masterGainDb: Number(masterGain.toFixed(3)),
  bedLufsInMaster: ducked ? Number((ducked.lufs + masterGain).toFixed(2)) : null,
  duckedPeakDb: ducked ? Number(ducked.peakDb.toFixed(2)) : null,
  duration,
  chosenBy: isLocal ? `local file ${basename(localPath)}` : wantId ? 'pinned trackId' : `query ${JSON.stringify(terms)}`,
};
writeFileSync(join(outDir, 'music.json'), JSON.stringify(record, null, 2) + '\n');

const licenceLine = licenceUrl ? `[${licence}](${licenceUrl})` : licence;
const creditHeader = record.licenceVerified
  ? `**Credit is required by the licence.** Put this line in the video description on
every platform the video is posted to.

> ${credit}`
  : `> ⚠️ **Licence not declared.** This bed came from a local file, and nothing in
> the file states its terms. Set \`music.licence\` (and \`music.credit\` if one is
> required) in \`script.json\` before this video is published anywhere.
>
> Provisional credit line: ${credit}`;

writeFileSync(
  join(outDir, 'ATTRIBUTION.md'),
  `# Music attribution

${creditHeader}

| Field | Value |
|---|---|
| Track | ${chosen.title} |
| Artist | ${artist} |
| Source | ${sourceUrl ? `[${sourceName}](${sourceUrl})` : sourceName} |
${isLocal ? `| Original file | \`${localPath}\` |\n` : `| ISRC | ${chosen.isrc} |\n`}| Licence | ${licenceLine} |
| Feel | ${chosen.feel} |
| Instruments | ${chosen.instruments} |
| Bed file | ${verify.input_i} LUFS integrated, ${verify.input_tp} dBTP |
| Bed in the master | ${record.bedLufsInMaster ?? 'not calibrated'} LUFS, ducked to the speech envelope |

Selected by ${record.chosenBy}.${
    isLocal
      ? ` The audio was copied into \`assets/music/source/\`, so a rebuild does
not depend on the original file still being where it was found.`
      : ` Pin it in \`script.json\` as
\`music.trackId: "${chosen.isrc}"\` so a rebuild cannot quietly choose differently.`
  }
`,
);

console.log(`  wrote bed.wav, music.json, ATTRIBUTION.md`);
console.log(`  credit: ${credit}`);
