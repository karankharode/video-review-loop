#!/usr/bin/env node
/**
 * Stock footage fetcher (Pexels).
 *
 * One clip per beat, cached by beat id. Re-running is cheap: anything already
 * downloaded is skipped, so iterating on the edit never re-hits the API.
 *
 *   node bin/fetch-stock.mjs <variation-folder> [--force] [--beat <id>]
 *
 * Reads   script.json  (beats[].stock.query)
 * Writes  assets/stock/<beatId>.mp4
 *         assets/stock/ATTRIBUTION.md   photographer + source URL per clip
 *
 * Needs PEXELS_API_KEY (free at pexels.com/api) in 00_ENGINE/pipeline/.env or
 * the environment. Without it this exits non-zero and the build falls back to
 * generated backgrounds — the render still works, it just isn't cinematic.
 *
 * Pexels licence: free for commercial use, no attribution *required*, but
 * crediting the photographer is requested. ATTRIBUTION.md keeps the record so
 * that's a decision you can make later rather than one you've lost the data for.
 */

import {readFileSync, writeFileSync, mkdirSync, existsSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function loadKey() {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY;
  for (const p of [join(HERE, '../.env'), join(HERE, '../../pipeline/.env')]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.trim().match(/^PEXELS_API_KEY=(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

const folder = process.argv[2];
if (!folder) {
  console.error('usage: node bin/fetch-stock.mjs <variation-folder> [--force]');
  process.exit(1);
}
const force = process.argv.includes('--force');
const onlyIdx = process.argv.indexOf('--beat');
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const key = loadKey();
if (!key) {
  console.error('!! No PEXELS_API_KEY found.');
  console.error('   Get one free at https://www.pexels.com/api/ and add to');
  console.error('   00_ENGINE/pipeline/.env as:  PEXELS_API_KEY=...');
  console.error('   (Add it to the file yourself — do not paste keys into chat.)');
  process.exit(2);
}

const spec = JSON.parse(readFileSync(join(folder, 'script.json'), 'utf8'));
const outDir = join(folder, 'assets', 'stock');
mkdirSync(outDir, {recursive: true});

/**
 * Score a Pexels video file. We want portrait or near-portrait, big enough to
 * punch into, and not so huge that a 15-beat fetch costs gigabytes.
 */
function pickFile(video) {
  const files = (video.video_files ?? []).filter((f) => f.width && f.height);
  if (!files.length) return null;

  // The frame is 1080x1920 and the compositor pushes in up to ~1.15x, so the
  // long edge needs >=1920px or the result is visibly soft. An earlier version
  // scored distance from 1440, which quietly ranked a 1280-tall file ABOVE a
  // 1920-tall one and fetched 720p for every beat.
  const scored = files.map((f) => {
    const portrait = f.height >= f.width;
    const longEdge = Math.max(f.width, f.height);
    // Hard preference for enough resolution; among those, smallest wins so we
    // don't pull 4K files we immediately downscale.
    const enough = longEdge >= 1920 ? 4 : longEdge >= 1440 ? 1 : 0;
    const thrift = -longEdge / 10000;
    return {f, score: (portrait ? 3 : 0) + enough + thrift};
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].f;
}

async function search(query) {
  // Ask for portrait first; fall back to any orientation rather than failing,
  // since the compositor cover-crops anyway.
  for (const params of [
    `orientation=portrait&per_page=8`,
    `per_page=8`,
  ]) {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&${params}`;
    const r = await fetch(url, {headers: {Authorization: key}});
    if (r.status === 401) throw new Error('Pexels rejected the key (401).');
    if (!r.ok) continue;
    const j = await r.json();
    if (j.videos?.length) return j.videos;
  }
  return [];
}

const attribution = [];
let fetched = 0;
let reused = 0;
const failures = [];

for (const beat of spec.beats) {
  if (only && beat.id !== only) continue;
  const st = beat.stock;
  if (!st || st.type === 'reuse') continue;

  const dest = join(outDir, `${beat.id}.mp4`);
  if (existsSync(dest) && statSync(dest).size > 10000 && !force) {
    console.log(`  = ${beat.id} (cached)`);
    reused++;
    continue;
  }

  try {
    const videos = await search(st.query);
    if (!videos.length) {
      failures.push([beat.id, `no results for "${st.query}"`]);
      console.log(`  ! ${beat.id} — no results for "${st.query}"`);
      continue;
    }
    // Prefer a clip at least as long as the beat is likely to need.
    const wanted = videos.find((v) => v.duration >= 6) ?? videos[0];
    const file = pickFile(wanted);
    if (!file) {
      failures.push([beat.id, 'no usable file']);
      continue;
    }

    const res = await fetch(file.link);
    if (!res.ok) throw new Error(`download ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));

    const mb = (statSync(dest).size / 1e6).toFixed(1);
    console.log(`  + ${beat.id}  ${file.width}x${file.height} ${wanted.duration}s  ${mb}MB`);
    attribution.push({
      beat: beat.id,
      query: st.query,
      photographer: wanted.user?.name ?? 'unknown',
      photographerUrl: wanted.user?.url ?? '',
      source: wanted.url,
    });
    fetched++;
  } catch (e) {
    failures.push([beat.id, String(e.message ?? e)]);
    console.log(`  ! ${beat.id} — ${e.message ?? e}`);
  }
}

// --- presenters ------------------------------------------------------------
//
// Stock stand-ins for a talking head. Declared once at the top of script.json
// as `presenters: [{name, query}]` and referenced by beats as
// `face: {asset: "<name>", mode: "band"|"pip"|"full"}`.
//
// These land in assets/face/ - the same folder your own recordings go into.
// When you shoot, overwrite the file and the timeline needs no edit.

const faceDir = join(folder, 'assets', 'face');
if ((spec.presenters ?? []).length && !only) {
  mkdirSync(faceDir, {recursive: true});
  console.log('\npresenters:');
  for (const p of spec.presenters) {
    const dest = join(faceDir, `${p.name}.mp4`);
    if (existsSync(dest) && statSync(dest).size > 10000 && !force) {
      console.log(`  = ${p.name} (cached)`);
      reused++;
      continue;
    }
    try {
      const videos = await search(p.query);
      if (!videos.length) {
        failures.push([p.name, `no results for "${p.query}"`]);
        console.log(`  ! ${p.name} - no results`);
        continue;
      }
      const wanted = videos.find((v) => v.duration >= 8) ?? videos[0];
      const file = pickFile(wanted);
      if (!file) {
        failures.push([p.name, 'no usable file']);
        continue;
      }
      const res = await fetch(file.link);
      if (!res.ok) throw new Error(`download ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      const mb = (statSync(dest).size / 1e6).toFixed(1);
      console.log(`  + ${p.name}  ${file.width}x${file.height} ${wanted.duration}s  ${mb}MB`);
      attribution.push({
        beat: `presenter:${p.name}`,
        query: p.query,
        photographer: wanted.user?.name ?? 'unknown',
        photographerUrl: wanted.user?.url ?? '',
        source: wanted.url,
      });
      fetched++;
    } catch (e) {
      failures.push([p.name, String(e.message ?? e)]);
      console.log(`  ! ${p.name} - ${e.message ?? e}`);
    }
  }
}

if (attribution.length) {
  const existing = existsSync(join(outDir, 'ATTRIBUTION.md'))
    ? readFileSync(join(outDir, 'ATTRIBUTION.md'), 'utf8')
    : '';
  const rows = attribution
    .map((a) => `| \`${a.beat}\` | ${a.photographer} | [source](${a.source}) | \`${a.query}\` |`)
    .join('\n');
  const doc = existing.includes('| Beat |')
    ? existing.trimEnd() + '\n' + rows + '\n'
    : `# Stock attribution\n\nPexels licence: free for commercial use, attribution not required but requested.\n\n| Beat | Photographer | Source | Query |\n|---|---|---|---|\n${rows}\n`;
  writeFileSync(join(outDir, 'ATTRIBUTION.md'), doc);
}

console.log(`\n${fetched} fetched, ${reused} cached, ${failures.length} failed`);
if (failures.length) {
  console.log('Failed beats fall back to a generated background at render time:');
  for (const [id, why] of failures) console.log(`  ${id}: ${why}`);
}
