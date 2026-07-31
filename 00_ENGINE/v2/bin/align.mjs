#!/usr/bin/env node
/**
 * Forced alignment - the thing v2 exists for.
 *
 * v1 authored beat times by hand ("this line starts at 12.8s") and hoped the
 * audio agreed. It never quite did, and every caption sat a few frames off the
 * word it belonged to. That near-miss is most of what makes an edit feel
 * amateur, and no amount of nicer easing fixes it.
 *
 * Here, whisper transcribes the real voiceover with per-word timestamps. Each
 * beat's declared `say` text is matched against that word stream, so beats and
 * captions inherit times measured from the audio itself. Re-record the VO and
 * every caption moves with it.
 *
 *   node bin/align.mjs <variation-folder> [--model turbo] [--force]
 *
 * Reads   script.json, assets/voice.wav
 * Writes  assets/words.json   every word with start/end
 *         assets/beats.json   beats resolved to time, plus their own words
 */

import {execFileSync} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';

const folder = process.argv[2];
if (!folder) {
  console.error('usage: node bin/align.mjs <variation-folder> [--model turbo] [--force]');
  process.exit(1);
}
const modelIdx = process.argv.indexOf('--model');
const model = modelIdx > -1 ? process.argv[modelIdx + 1] : 'turbo';
const force = process.argv.includes('--force');

const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
const wav = join(folder, 'assets', 'voice.wav');
if (!existsSync(wav)) {
  console.error(`!! No ${wav}. Run bin/tts.mjs first.`);
  process.exit(1);
}

const beatsOut = join(folder, 'assets', 'beats.json');
const wordsOut = join(folder, 'assets', 'words.json');

/**
 * Cache key.
 *
 * Whisper takes minutes; the inputs change in seconds. Key on exactly what
 * alignment depends on - the spoken text of each beat, and the audio itself.
 * Keying on script.json's mtime would re-transcribe after an edit to an
 * unrelated field like targetDuration or a stock query.
 */
const alignKey = createHash('sha1')
  .update(spec.beats.map((b) => b.say).join(' '))
  .update(String(statSync(wav).size))
  .digest('hex')
  .slice(0, 16);

/**
 * Extend every beat to the start of the next one, so the picture holds through
 * a pause instead of cutting to nothing.
 *
 * A beat's measured `end` is where its last word stops. The speaker then
 * breathes, and until the next beat begins there is no beat on screen — which
 * the compositor renders as an empty frame. An editor holds the shot through a
 * breath; nobody cuts to black for 700ms.
 *
 * This used to close gaps only under 0.6s, which is why it looked fine for a
 * long time: the first script's pauses were all shorter than that. The next
 * voiceover came back slower, its pauses measured 0.62-0.86s, and five blank
 * frames appeared in the middle of the video. There is no threshold at which a
 * hole becomes correct, so there is no threshold here.
 *
 * Applied on load rather than only when whisper runs, because this is a
 * presentation decision about measured times — not a measurement — and baking
 * it into the cache would mean a fix to this rule needs a 6-minute re-align to
 * take effect.
 */
function closeGaps(beats) {
  let closed = 0;
  let longest = 0;
  for (let i = 0; i < beats.length - 1; i++) {
    const gap = beats[i + 1].start - beats[i].end;
    if (gap > 0) {
      beats[i].end = beats[i + 1].start;
      closed++;
      longest = Math.max(longest, gap);
    }
  }
  if (closed) {
    console.log(`-- held ${closed} beat${closed === 1 ? '' : 's'} through a pause (longest ${longest.toFixed(2)}s)`);
  }
  return beats;
}

if (!force && existsSync(beatsOut)) {
  let cached = null;
  try {
    cached = JSON.parse(readFileSync(beatsOut, 'utf8'));
  } catch (e) {
    console.log(`-- cache unreadable (${e.message}); re-aligning`);
  }
  if (cached && cached._alignKey === alignKey) {
    console.log(
      `-- alignment cached (${cached.beats.length} beats, ` +
        `${Number(cached.duration).toFixed(2)}s). Use --force to re-run whisper.`,
    );
    // Non-alignment fields may have changed since; refresh them from script.json
    // while keeping the measured times.
    const byId = new Map(cached.beats.map((b) => [b.id, b]));
    const merged = {
      ...spec,
      duration: cached.duration,
      _alignKey: alignKey,
      beats: closeGaps(
        spec.beats.map((b) => {
          const c = byId.get(b.id);
          return c
            ? {...b, start: c.start, end: c.end, matched: c.matched, words: c.words}
            : b;
        }),
      ),
    };
    writeFileSync(beatsOut, JSON.stringify(merged, null, 2));
    process.exit(0);
  }
  if (cached) {
    console.log(`-- cache key changed (${cached._alignKey} -> ${alignKey}); re-aligning`);
  }
}

/** Lowercase, strip punctuation. */
const norm = (w) =>
  w
    .toLowerCase()
    .replace(/[^a-z0-9%'\s]/g, '')
    .replace(/'/g, '')
    .trim();

/** Whisper writes numerals where the script writes words, and vice versa. */
const NUMBERS = {
  2021: 'twentytwentyone',
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
  5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 100: 'hundred',
};
const canon = (w) => NUMBERS[w] ?? w;

const tokens = (s) => norm(s).split(/\s+/).filter(Boolean).map(canon);

// --- transcribe -----------------------------------------------------------

const work = join(tmpdir(), `align-${process.pid}`);
mkdirSync(work, {recursive: true});

console.log(`-- whisper (${model}) transcribing with word timestamps...`);
try {
  execFileSync(
    'whisper',
    [
      wav, '--model', model, '--language', 'en',
      '--word_timestamps', 'True',
      '--output_format', 'json',
      '--output_dir', work,
      '--verbose', 'False',
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26},
  );
} catch (e) {
  console.error('!! whisper failed.');
  console.error(String(e.stderr ?? e).slice(-1500));
  process.exit(1);
}

const jsonFile = readdirSync(work).find((f) => f.endsWith('.json'));
const tr = JSON.parse(readFileSync(join(work, jsonFile), 'utf8'));

/** Flatten to a single word stream. */
const words = [];
for (const seg of tr.segments ?? []) {
  for (const w of seg.words ?? []) {
    const t = norm(w.word);
    if (!t) continue;
    words.push({raw: w.word.trim(), t: canon(t), start: +w.start, end: +w.end});
  }
}
if (!words.length) {
  console.error('!! whisper returned no word timestamps.');
  process.exit(1);
}
console.log(`-- ${words.length} words, audio ends ${words.at(-1).end.toFixed(2)}s`);

// --- match beats to the word stream --------------------------------------

/**
 * Greedy two-pointer with bounded lookahead.
 *
 * Whisper mishears proper nouns - "HireVue" comes back as "hire view",
 * "percent" as "person". An exact walk desynchronises and never recovers.
 * Instead each beat consumes roughly its own token count, and the boundary is
 * refined by searching a small window for the beat's last token. Beats that
 * fall back to plain token count are marked and reported, never silently
 * fudged.
 *
 * Only the *times* are consumed downstream - caption text comes from the
 * script - so a mistranscribed word costs nothing as long as its timing is
 * right.
 */
let cursor = 0;
const beats = [];
let lowConfidence = 0;

for (const b of spec.beats) {
  const bt = tokens(b.say);
  const startIdx = cursor;
  let endIdx = Math.min(words.length, cursor + bt.length);

  const last = bt.at(-1);
  let found = false;
  for (
    let k = Math.max(startIdx + 1, endIdx - 3);
    k <= Math.min(words.length, endIdx + 3);
    k++
  ) {
    if (words[k - 1]?.t === last) {
      endIdx = k;
      found = true;
      break;
    }
  }
  if (!found) lowConfidence++;

  const slice = words.slice(startIdx, endIdx);
  if (!slice.length) {
    console.warn(`  !! beat "${b.id}" matched no words`);
    continue;
  }

  beats.push({
    ...b,
    start: +slice[0].start.toFixed(3),
    end: +slice.at(-1).end.toFixed(3),
    matched: found,
    words: slice.map((w) => ({
      text: w.raw.replace(/^[^\w']+|[^\w'%.]+$/g, ''),
      start: +w.start.toFixed(3),
      end: +w.end.toFixed(3),
    })),
  });
  cursor = endIdx;
}

closeGaps(beats);
beats.at(-1).end = Math.max(beats.at(-1).end, words.at(-1).end);

const duration = +(beats.at(-1).end + (spec.tailHold ?? 1.0)).toFixed(3);

mkdirSync(join(folder, 'assets'), {recursive: true});
writeFileSync(wordsOut, JSON.stringify({words}, null, 2));
writeFileSync(
  beatsOut,
  JSON.stringify({...spec, duration, _alignKey: alignKey, beats}, null, 2),
);

// --- report ---------------------------------------------------------------

console.log('');
for (const b of beats) {
  console.log(
    `${b.matched ? '  ' : ' ~'} ${b.start.toFixed(2).padStart(6)} - ` +
      `${b.end.toFixed(2).padStart(6)}  ${b.id}`,
  );
}
console.log(`\nDuration ${duration.toFixed(2)}s (incl. ${spec.tailHold ?? 1.0}s tail hold)`);

if (spec.targetDuration) {
  const delta = duration - spec.targetDuration;
  const ok = Math.abs(delta) <= 2;
  console.log(
    `Target ${spec.targetDuration}s - ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}s, ` +
      `${ok ? 'within tolerance' : 'OUT OF TOLERANCE'}`,
  );
  if (delta > 2) console.log('Script runs long. Cut words - do not raise voice.pace.');
}
if (lowConfidence) {
  console.log(
    `\n~ ${lowConfidence} beat boundary(ies) fell back to token count. Times are ` +
      `approximate for those; check them in the studio.`,
  );
}
