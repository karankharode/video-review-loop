#!/usr/bin/env node
/**
 * Generate AVATAR_SCRIPT.md from script.json, and check the timing gate.
 *
 *   node bin/avatar-script.mjs <variation-folder> [--check]
 *
 * The folder contract says AVATAR_SCRIPT.md must match every beat's `say`
 * verbatim, because `say` is the alignment key — a word that differs between
 * the two files is a caption that lands on the wrong syllable. Keeping two
 * copies of the same sentences in sync by hand is a guarantee that one day they
 * will not be, so this derives one from the other.
 *
 * `--check` verifies an existing file instead of writing one, and exits
 * non-zero on a mismatch, which is what a build should call.
 *
 * It also runs the arithmetic from VARIATION_AXES.md: spoken words over words
 * per minute against the target length. That gate is arithmetic, not judgement,
 * and it is the most common defect in a script — so it runs every time rather
 * than when someone remembers.
 */

import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const folderArg = process.argv[2];
if (!folderArg) {
  console.error('usage: node bin/avatar-script.mjs <variation-folder> [--check]');
  process.exit(1);
}
const folder = resolve(folderArg);
const checkOnly = process.argv.includes('--check');

const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
const dest = join(folder, 'AVATAR_SCRIPT.md');

const lines = spec.beats.map((b) => b.say.trim());
const words = lines.join(' ').split(/\s+/).filter(Boolean);

// Spoken words and nothing else — no title, no generated-by comment, not even a
// heading. bin/tts.mjs rejects this file if it contains markdown, because every
// character in it is read aloud, and a "#" becomes a spoken "hash".
const body = `${lines.join('\n\n')}\n`;

if (checkOnly) {
  if (!existsSync(dest)) {
    console.error(`!! ${dest} does not exist. Run without --check to generate it.`);
    process.exit(1);
  }
  // Compare on words alone: whitespace and the comment block are not the contract.
  const wordsOf = (s) =>
    s
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^#.*$/gm, '')
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');
  const have = wordsOf(readFileSync(dest, 'utf8'));
  const want = wordsOf(body);
  if (have !== want) {
    console.error('!! AVATAR_SCRIPT.md does not match script.json.');
    console.error('   Regenerate it:  node bin/avatar-script.mjs ' + folderArg);
    process.exit(1);
  }
  console.log('-- AVATAR_SCRIPT.md matches script.json');
} else {
  writeFileSync(dest, body);
  console.log(`-- wrote ${dest}`);
}

// --- timing gate -----------------------------------------------------------

const target = spec.targetDuration ?? null;
console.log(`   ${spec.beats.length} beats, ${words.length} spoken words`);
if (target) {
  // The engine has measured Sarvam anywhere from 120 to 175 wpm at pace 1.0, so
  // a single estimate would be false precision. The range is the honest answer.
  const lo = (words.length / 175) * 60;
  const hi = (words.length / 120) * 60;
  const mid = (words.length / 166) * 60;
  console.log(`   target ${target}s — estimate ${mid.toFixed(1)}s (range ${lo.toFixed(1)}-${hi.toFixed(1)}s at 175-120 wpm)`);
  if (mid > target * 1.1) {
    console.log(`   ! over target at the measured rate. Cut words from the middle beats, never the payoff, and never raise pace.`);
  }
}

const longCaptions = spec.beats.filter((b) => b.caption && b.caption.split(/\s+/).length > 6);
if (longCaptions.length) {
  console.log(`   ! captions over 6 words (unreadable in 1s): ${longCaptions.map((b) => b.id).join(', ')}`);
}

// --- the promise rule ------------------------------------------------------
//
// See VARIATION_AXES.md. The first three seconds have to carry context *and* a
// promise on every channel. Most of that is a judgement call, but the parts
// that are mechanical are worth failing loudly, because a dull hook is the one
// defect that costs the whole video and it is invisible in a shot table.

const hook = spec.beats[0];
if (hook) {
  const hookWords = hook.say.split(/\s+/).length;
  if (hookWords > 12) console.log(`   ! hook is ${hookWords} spoken words; the rule is 12`);
  if (!hook.caption) console.log('   ! hook has no caption — the first 3s must carry on-screen text');

  // A promise is a debt the rest of the video pays off. These are the shapes it
  // usually takes in a spoken hook. Crude on purpose: it prompts a re-read, it
  // does not certify anything.
  const promise =
    /\b(here'?s|this is|i'?ll|we'?ll|watch|why|how|what|proves?|proof|study|studies|research|found|in \d|three|two|five|actually|turns out|but|and there'?s)\b|—|\?|:/i;
  if (!promise.test(hook.say)) {
    console.log('   ! hook states a fact but promises nothing.');
    console.log('     Cover everything after 3s: if what remains is merely true, the viewer has no reason to wait.');
  }
  const staticOpen = !hook.stock && !hook.graphic;
  if (staticOpen) console.log('   ! hook has neither stock nor a graphic — the first 3s must be moving');
}
