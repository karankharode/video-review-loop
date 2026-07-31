# Five Minutes, One Prompt — delivered output

**Variation:** `sai_opus_websites` · **Track:** SAI · **Pillar:** Build in Public
**Duration:** 43.50s · **Frame:** 1080×1920

Built by the v2 engine. Everything here regenerates from `script.json` plus the
API keys — see `00_ENGINE/v2`. Media files are gitignored; this manifest is not.

## Files

| File | Size | What it is |
|---|---|---|
| `master_final.mp4` | 30.0 MB | **The deliverable.** Mastered, scored, ready to post. |
| `still_*.png` | — | 6 frames for thumbnail selection |

## Audio, measured

| Measure | Value | Target |
|---|---|---|
| Integrated loudness | **-14.06 LUFS** | −14 (IG / YouTube normalisation) |
| True peak | **-1.45 dBTP** | ≤ −1.0 |
| Loudness range | 1.80 LU | — |
| Music bed in the mix | -30 LUFS | -30 |
| SFX bus peak | -10 dBFS | -10 |

## Music

**Killing Time** — Kevin MacLeod · CC BY 4.0

Credit line for the description:

> "Killing Time" by Kevin MacLeod (incompetech.com) — licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

Ducked to the forced-alignment speech envelope, out at 42.44s.

## SFX cues

6 cues, scheduled from the timeline and capped deliberately.

| Time | Effect | Why |
|---|---|---|
| 0.02s | `whoosh_rev` | declared on hook |
| 23.30s | `riser` | retention beat — riser peaks on the turn |
| 23.32s | `impact` | retention beat — hit on the cut |
| 25.70s | `impact` | held beat — mark it, then leave it alone |
| 28.18s | `notification` | the warm turn |
| 39.28s | `whoosh` | into the end card |

## Sources

23 stock clips — see `assets/stock/ATTRIBUTION.md`.
Factual claims and their sources are in `SCRIPT.md`. Posting copy, if written, is in `POSTING.md`.

## Rebuild

```bash
cd 00_ENGINE/v2
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_opus_websites
npm run master
node bin/deliver.mjs
```
