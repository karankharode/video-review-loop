#!/usr/bin/env node
/**
 * Voiceover — one continuous read.
 *
 * v1 synthesised line by line and laid each clip at a hand-authored beat start,
 * because the beats were the source of truth and the audio had to fit them.
 * v2 inverts that: the audio is the source of truth and the beats are derived
 * from it (see bin/align.mjs). So there is no reason to chop the read up —
 * one pass gives better prosody, no seams, and nothing to slot-fit.
 *
 * Sarvam caps a request at 2500 characters. Longer scripts are split on
 * sentence boundaries and concatenated, which is transparent to alignment.
 *
 *   node bin/tts.mjs <variation-folder> [--force]
 *
 * Reads   AVATAR_SCRIPT.md   (spoken words, nothing else)
 *         script.json        (voice.speaker / voice.pace / voice.lang)
 * Writes  assets/voice.wav
 */

import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.sarvam.ai/text-to-speech';
const MAX_CHARS = 2400;

function loadKey() {
  if (process.env.SARVAM_API_KEY) return process.env.SARVAM_API_KEY;
  // The key lives with the v1 pipeline; .env is gitignored and shared.
  for (const p of [join(HERE, '../.env'), join(HERE, '../../pipeline/.env')]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.trim().match(/^SARVAM_API_KEY=(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('No SARVAM_API_KEY. Set it in 00_ENGINE/pipeline/.env');
}

/** Split on sentence boundaries so a chunk never breaks mid-word. */
function chunk(text) {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/);
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + ' ' + s).trim().length > MAX_CHARS && cur) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur = (cur + ' ' + s).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Concatenate RIFF/WAVE buffers by keeping the first header and summing data. */
function concatWav(buffers) {
  if (buffers.length === 1) return buffers[0];
  const datas = buffers.map((b) => {
    // Walk the chunk list rather than assuming a 44-byte header — Sarvam
    // sometimes includes a LIST/INFO chunk before `data`.
    let off = 12;
    while (off < b.length - 8) {
      const id = b.toString('ascii', off, off + 4);
      const size = b.readUInt32LE(off + 4);
      if (id === 'data') return b.subarray(off + 8, off + 8 + size);
      off += 8 + size + (size % 2);
    }
    return b.subarray(44);
  });
  const header = Buffer.from(buffers[0].subarray(0, 44));
  const total = datas.reduce((n, d) => n + d.length, 0);
  header.writeUInt32LE(36 + total, 4);
  header.writeUInt32LE(total, 40);
  return Buffer.concat([header, ...datas]);
}

/**
 * One request to Sarvam.
 *
 * `temperature` is bulbul:v3's expressiveness control (0.01–2.0, Sarvam's
 * default 0.6). Low values give a flat, predictable read; higher values add
 * pitch variation and emotional colour. It is the only prosody control v3
 * exposes — `pitch` and `loudness` are v2-only and are silently ignored here,
 * so don't add them expecting an effect.
 *
 * Raising `temperature` also makes the read less repeatable, which matters
 * because this engine measures the result rather than predicting it. Expect
 * duration to move more between regenerates than it already does.
 */
async function synth(text, key, {speaker, lang, pace, temperature, model}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: {'api-subscription-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      target_language_code: lang,
      speaker,
      model,
      pace,
      ...(temperature === undefined ? {} : {temperature}),
      speech_sample_rate: 24000,
    }),
  });
  if (!r.ok) throw new Error(`Sarvam ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  if (!j.audios?.length) throw new Error('Sarvam returned no audio');
  return Buffer.from(j.audios[0], 'base64');
}

const folder = process.argv[2];
if (!folder) {
  console.error('usage: node bin/tts.mjs <variation-folder> [--force]');
  process.exit(1);
}
const force = process.argv.includes('--force');

const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
const voice = {
  speaker: 'priya',
  lang: 'en-IN',
  model: 'bulbul:v3',
  pace: 1.0,
  // Sarvam's default is 0.6. 0.85 keeps the read recognisably the same voice
  // while letting it lean into emphasis instead of reciting.
  temperature: 0.85,
  ...(spec.voice ?? {}),
};

// v3 ignores these; leaving them in a script implies a control that isn't there.
for (const dead of ['pitch', 'loudness']) {
  if (voice[dead] !== undefined && voice.model.startsWith('bulbul:v3')) {
    console.log(`   ! voice.${dead} is a bulbul:v2 parameter and does nothing on ${voice.model}`);
  }
}
if (voice.pace < 0.5 || voice.pace > 2) {
  console.error(`!! voice.pace ${voice.pace} is outside Sarvam's 0.5-2.0 range.`);
  process.exit(1);
}
if (voice.temperature !== undefined && (voice.temperature < 0.01 || voice.temperature > 2)) {
  console.error(`!! voice.temperature ${voice.temperature} is outside Sarvam's 0.01-2.0 range.`);
  process.exit(1);
}

const raw = readFileSync(join(folder, 'AVATAR_SCRIPT.md'), 'utf8');
// Same hygiene guard as v1: every character in this file is spoken aloud.
if (/^\s*[#|]|\[|\]|\*\*/m.test(raw)) {
  console.error('!! AVATAR_SCRIPT.md contains markdown, brackets or a table.');
  console.error('   Every character in that file is spoken aloud. Clean it first.');
  process.exit(1);
}

mkdirSync(join(folder, 'assets'), {recursive: true});
const out = join(folder, 'assets', 'voice.wav');
if (existsSync(out) && !force) {
  console.log(`-- voice.wav exists, skipping (use --force to regenerate)`);
  process.exit(0);
}

const text = raw.trim();
const pieces = chunk(text);
console.log(
  `${text.length} chars, ${pieces.length} request(s), speaker=${voice.speaker} ` +
    `pace=${voice.pace} temperature=${voice.temperature ?? 'default'} model=${voice.model}`,
);

const key = loadKey();
const bufs = [];
for (const [i, p] of pieces.entries()) {
  console.log(`  [${i + 1}/${pieces.length}] ${p.length} chars`);
  bufs.push(await synth(p, key, voice));
}

writeFileSync(out, concatWav(bufs));
console.log(`Wrote ${out}`);
