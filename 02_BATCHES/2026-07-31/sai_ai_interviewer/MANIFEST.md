# It's Not Watching Your Face — delivered output

**Variation:** `sai_ai_interviewer` · **Track:** SAI
**Duration:** 45.20s · **Frame:** 1080×1920

Built by the v2 engine. Everything here regenerates from `script.json` plus the
API keys — see `00_ENGINE/v2`. Media files are gitignored; this manifest is not.

## Files

| File | Size | What it is |
|---|---|---|
| `master_final.mp4` | 29.6 MB | **The deliverable.** Mastered, scored, ready to post. |
| `still_*.png` | — | 6 frames for thumbnail selection |

## Audio, measured

| Measure | Value | Target |
|---|---|---|
| Integrated loudness | **-14.10 LUFS** | −14 (IG / YouTube normalisation) |
| True peak | **-1.48 dBTP** | ≤ −1.0 |
| Loudness range | 2.80 LU | — |
| Music bed in the mix | -30.01 LUFS | -30 |
| SFX bus peak | -10 dBFS | -10 |

## Music

**Long Note Two** — Kevin MacLeod · CC BY 4.0

Credit line for the description:

> "Long Note Two" by Kevin MacLeod (incompetech.com) — licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

Ducked to the forced-alignment speech envelope, out at 44.06s.

## SFX cues

5 cues, scheduled from the timeline and capped deliberately.

| Time | Effect | Why |
|---|---|---|
| 0.02s | `whoosh_rev` | open |
| 12.16s | `impact` | held beat — mark it, then leave it alone |
| 22.58s | `riser` | retention beat — riser peaks on the turn |
| 22.60s | `impact` | retention beat — hit on the cut |
| 26.98s | `notification` | the warm turn |

## Sources

31 stock clips — see `assets/stock/ATTRIBUTION.md`.
Factual claims and their sources are in `SCRIPT.md`. Posting copy, if written, is in `POSTING.md`.

## Rebuild

```bash
cd 00_ENGINE/v2
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_ai_interviewer
npm run master
node bin/deliver.mjs
```
