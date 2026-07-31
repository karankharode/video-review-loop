# DaVinci Resolve — finish pass (v5 Kallaway)

Import the pipeline render, then finish like a Kallaway edit: grade, music, real face swap, caption nudge.

## Media pool

Import from `02_BATCHES/2026-07-30/v5_fresher_squeeze/`:

| Clip | Use |
|---|---|
| `final_kallaway.mp4` | Picture lock reference / base timeline |
| `voice.wav` | A1 master (replace timeline audio if re-linking) |
| `assets/face/hook.mp4` | Replace bottom plate 0–6s when you shoot |
| `assets/face/market.mp4` | Replace 23.3–32.7s |
| `assets/face/close.mp4` | Replace 56.2–60s |
| `assets/stills/*` | Optional — rebuild top panel manually |
| `assets/broll/*` / `kb_*.mp4` | Optional denser top cuts |

## Timeline

- Timeline: **1080×1920**, **30 fps**, 60.0s
- Track V1: `final_kallaway.mp4` (or rebuild split with Transform)
- Track A1: `voice.wav` (sync at 00:00)
- Track A2: sparse tension pad, −22 to −26 LUFS under VO
- **Duck A2 to near silence 23.3–32.7** (market-condition hold)

## Markers (set these)

| Time | Name | Note |
|---|---|---|
| 0.0 | HOOK | Face + counter both on |
| 3.8 | IT'S NOT YOU | Caption accent |
| 6.0 | COUNTER FULL | 6L → 1.2L |
| 10.5 | 80% GONE | Stat punch |
| 13.2 | SEVEN MONTHS | Offer/calendar |
| **23.3** | **MARKET HOLD** | **No cutaway. Face locked.** |
| 32.7 | CHAIRS | Resume b-roll density |
| 39.1 | ONE CONVERSATION | |
| 48.3 | PICK 3 | Save-bait notebook |
| 56.2 | CLOSE FACE | End on face + 1s hold |

## Grade

- Documentary: slight desat, mild contrast, cool shadows
- Match face plates to top-panel grade (not the reverse)
- No teal-orange, no film burn

## Face swap method

1. Put real `hook/market/close` on V2, crop to bottom ~45% of frame (or use OpenFX Transform + Crop).
2. Align in/out to markers above.
3. Soft edge optional; yellow rule stays from V1 or redraw as title.

## Export

- H.264 / H.265, 1080×1920, high bitrate
- −14 LUFS integrated master
- Filename: `final_kallaway_resolve.mp4`

## Remotion handoff

If Remotion exports a cleaner caption/motion pass (`00_ENGINE/remotion/out/`), import that as V1 instead of the Python preview, then only grade + music + real face in Resolve.
