#!/usr/bin/env node
/**
 * Move the finished output into the variation folder.
 *
 *   node bin/deliver.mjs [variation-folder] [--stills 6] [--no-alpha]
 *
 * `out/` is the engine's scratch space — it holds whatever was rendered last,
 * and the next build overwrites it. A variation folder is where a video
 * actually lives: script, sources, assets and the finished file, together, so
 * you can open one directory and have the whole thing.
 *
 * Copies (never moves — the engine's copy stays until the next render):
 *
 *   master_final.mp4     the deliverable, mastered to -14 LUFS
 *   captions_alpha.mov   } if they exist and --no-alpha wasn't passed
 *   graphics_alpha.mov   }
 *   still_*.png          evenly spaced frames, for thumbnail picking
 *   MANIFEST.md          what this is, how it measures, what it was built from
 *
 * The manifest is the point. A folder full of media tells you nothing about
 * whether the mix is right; the manifest records the measured loudness, the
 * cue list, the track and its licence, so a review does not start with
 * "which of these is the final one?"
 */

import {spawnSync} from 'node:child_process';
import {cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'out');

const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const positional = process.argv.slice(2).find((a) => !a.startsWith('--') && a !== argOf('--stills'));
const activeFile = join(ROOT, '.active-variation');
const folder = positional
  ? resolve(positional)
  : existsSync(activeFile)
    ? readFileSync(activeFile, 'utf8').trim()
    : null;

if (!folder || !existsSync(folder)) {
  console.error('!! No variation folder. Pass one, or run a build first so .active-variation exists.');
  process.exit(1);
}

const stillCount = Number(argOf('--stills', 6));
const noAlpha = process.argv.includes('--no-alpha');

const master = join(OUT, 'master_final.mp4');
if (!existsSync(master)) {
  console.error(`!! ${master} does not exist. Render and master first:  npm run master`);
  process.exit(1);
}

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-y', ...args], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  return `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
};
const probe = (file, entries) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', entries, '-of', 'default=nw=1', file], {encoding: 'utf8'});
  return Object.fromEntries(
    (r.stdout ?? '')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('=')),
  );
};
const loudness = (file) => {
  const out = ff(['-i', file, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = out.match(/\{[^{}]*"input_i"[\s\S]*?\}/g);
  return m ? JSON.parse(m[m.length - 1]) : null;
};

// The build wrote this alongside the timeline; it is the record of what the
// render actually contained rather than what the script asked for.
const timeline = JSON.parse(readFileSync(join(ROOT, 'src', 'timeline.json'), 'utf8'));
const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));

// Sanity: refuse to file one variation's render under another's name. Getting
// this wrong is silent and expensive to discover later.
if (timeline.id !== spec.id) {
  console.error(`!! out/ holds a render of "${timeline.id}" but you asked to deliver "${spec.id}".`);
  console.error(`   Rebuild that variation first:  node bin/build.mjs ${folder}`);
  process.exit(1);
}

console.log(`-- delivering ${spec.id} → ${folder}`);

const copied = [];
const take = (src, destName) => {
  if (!existsSync(src)) return false;
  const dest = join(folder, destName);
  cpSync(src, dest);
  copied.push({name: destName, mb: statSync(dest).size / 1e6});
  console.log(`   + ${destName}  ${(statSync(dest).size / 1e6).toFixed(1)}MB`);
  return true;
};

take(master, 'master_final.mp4');
if (!noAlpha) {
  take(join(OUT, 'captions_alpha.mov'), 'captions_alpha.mov');
  take(join(OUT, 'graphics_alpha.mov'), 'graphics_alpha.mov');
}

// --- stills ----------------------------------------------------------------

const meta = probe(master, 'format=duration:stream=width,height');
const dur = Number(meta.duration ?? timeline.duration);

// Stills are named for their timestamp, so a shorter re-render leaves the old
// ones behind pointing at frames that no longer exist. Clear them first.
for (const f of readdirSync(folder)) {
  if (/^still_.*\.png$/.test(f)) rmSync(join(folder, f), {force: true});
}

const stills = [];
for (let i = 0; i < stillCount; i++) {
  // Spread across the body, skipping the first and last moment — a still from
  // frame 0 is usually a fade and never the thumbnail you want.
  const t = ((i + 0.5) / stillCount) * dur;
  const name = `still_${t.toFixed(1)}s.png`;
  ff(['-ss', String(t), '-i', master, '-frames:v', '1', join(folder, name)]);
  if (existsSync(join(folder, name))) stills.push({name, t});
}
console.log(`   + ${stills.length} stills`);

// --- manifest --------------------------------------------------------------

const l = loudness(master);
const music = timeline._music;
const sfx = timeline._sfx;
const musicMeta = existsSync(join(folder, 'assets', 'music', 'music.json'))
  ? JSON.parse(readFileSync(join(folder, 'assets', 'music', 'music.json'), 'utf8'))
  : null;

const attribution = existsSync(join(folder, 'assets', 'stock', 'ATTRIBUTION.md'))
  ? (readFileSync(join(folder, 'assets', 'stock', 'ATTRIBUTION.md'), 'utf8').match(/^\|/gm) ?? []).length - 2
  : 0;

const rows = (a) => a.filter(Boolean).join('\n');

writeFileSync(
  join(folder, 'MANIFEST.md'),
  `# ${spec.title} — delivered output

**Variation:** \`${spec.id}\` · **Track:** ${spec.track ?? '—'}${spec.pillar ? ` · **Pillar:** ${spec.pillar}` : ''}
**Duration:** ${dur.toFixed(2)}s · **Frame:** ${meta.width}×${meta.height}

Built by the v2 engine. Everything here regenerates from \`script.json\` plus the
API keys — see \`00_ENGINE/v2\`. Media files are gitignored; this manifest is not.

## Files

| File | Size | What it is |
|---|---|---|
${rows(
  copied.map((c) => {
    const what =
      c.name === 'master_final.mp4'
        ? '**The deliverable.** Mastered, scored, ready to post.'
        : c.name === 'captions_alpha.mov'
          ? 'Captions only, transparent — drop over your own edit in Resolve.'
          : c.name === 'graphics_alpha.mov'
            ? 'Graphics only, transparent.'
            : '';
    return `| \`${c.name}\` | ${c.mb.toFixed(1)} MB | ${what} |`;
  }),
)}
| \`still_*.png\` | — | ${stills.length} frames for thumbnail selection |

## Audio, measured

| Measure | Value | Target |
|---|---|---|
| Integrated loudness | **${l?.input_i ?? '?'} LUFS** | −14 (IG / YouTube normalisation) |
| True peak | **${l?.input_tp ?? '?'} dBTP** | ≤ −1.0 |
| Loudness range | ${l?.input_lra ?? '?'} LU | — |
${music ? `| Music bed in the mix | ${music.bedLufs} LUFS | ${spec.music?.bedLufs ?? '—'} |\n` : ''}${sfx ? `| SFX bus peak | ${sfx.peakDb} dBFS | ${spec.sfx?.peakDb ?? -10} |\n` : ''}
${
  music
    ? `## Music

**${musicMeta?.title ?? music.title}**${musicMeta?.artist ? ` — ${musicMeta.artist}` : ''} · ${musicMeta?.licence ?? '—'}

${musicMeta?.licenceVerified === false ? '> ⚠️ **Licence not declared.** Set `music.licence` in `script.json` before publishing.\n\n' : ''}${musicMeta?.credit ? `Credit line for the description:\n\n> ${musicMeta.credit}\n` : ''}
Ducked to the forced-alignment speech envelope, out at ${music.endAt.toFixed(2)}s.

`
    : ''
}${
  sfx
    ? `## SFX cues

${sfx.cues.length} cue${sfx.cues.length === 1 ? '' : 's'}, scheduled from the timeline and capped deliberately.

| Time | Effect | Why |
|---|---|---|
${sfx.cues.map((c) => `| ${c.at.toFixed(2)}s | \`${c.kind}\` | ${c.why} |`).join('\n')}
`
    : ''
}
## Sources

${attribution > 0 ? `${attribution} stock clips — see \`assets/stock/ATTRIBUTION.md\`.` : 'See `assets/stock/ATTRIBUTION.md`.'}
Factual claims and their sources are in \`SCRIPT.md\`. Posting copy, if written, is in \`POSTING.md\`.

## Rebuild

\`\`\`bash
cd 00_ENGINE/v2
node bin/build.mjs ${folder.replace(/^.*\/02_BATCHES/, '../../02_BATCHES')}
npm run master
node bin/deliver.mjs
\`\`\`
`,
);
console.log('   + MANIFEST.md');
console.log(`-- ${copied.length} file${copied.length === 1 ? '' : 's'} + ${stills.length} stills delivered`);
