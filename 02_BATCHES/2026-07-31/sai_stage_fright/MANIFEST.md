# They Can't See It — delivered output

**Variation:** `sai_stage_fright` · **Track:** SAI · **Pillar:** Confidence Building
**Duration:** 49.50s · **Frame:** 1080×1920

Built by the v2 engine. Everything here regenerates from `script.json` plus the
API keys — see `00_ENGINE/v2`. Media files are gitignored; this manifest is not.

## Files

| File | Size | What it is |
|---|---|---|
| `master_final.mp4` | 43.8 MB | **The deliverable.** Mastered, scored, ready to post. |
| `still_*.png` | — | 6 frames for thumbnail selection |

## Audio, measured

| Measure | Value | Target |
|---|---|---|
| Integrated loudness | **-14.02 LUFS** | −14 (IG / YouTube normalisation) |
| True peak | **-1.49 dBTP** | ≤ −1.0 |
| Loudness range | 2.20 LU | — |
| Music bed in the mix | -24 LUFS | -24 |
| SFX bus peak | -10 dBFS | -10 |

## Music

**Lifted Up** — Hartzmann · Pixabay Content License

Credit line for the description:

> "Lifted Up" by Hartzmann (Pixabay) — Pixabay Content License: https://pixabay.com/service/license-summary/

Ducked to the forced-alignment speech envelope, out at 48.38s.

## SFX cues

6 cues, scheduled from the timeline and capped deliberately.

| Time | Effect | Why |
|---|---|---|
| 0.02s | `whoosh_rev` | open |
| 19.74s | `riser` | retention beat — riser peaks on the turn |
| 19.76s | `impact` | retention beat — hit on the cut |
| 24.58s | `impact` | held beat — mark it, then leave it alone |
| 28.95s | `notification` | the warm turn |
| 46.40s | `whoosh` | into the end card |

## Sources

10 stock clips — see `assets/stock/ATTRIBUTION.md`.
Factual claims and their sources are in `SCRIPT.md`. Posting copy, if written, is in `POSTING.md`.

## Rebuild

```bash
cd 00_ENGINE/v2
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_stage_fright
npm run master
node bin/deliver.mjs
```
