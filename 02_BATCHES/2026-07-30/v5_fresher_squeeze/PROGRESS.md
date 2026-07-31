# Progress handoff — Video Review Loop / v5 Fresher Squeeze

**Date:** 2026-07-31  
**For:** Continue in Claude, Cursor, or any agent. Read this first.

## What this project is

News-driven short-form video loop. Track **SAI**. Variation **v5 — The Fresher Squeeze** (India IT fresher hiring drop → “market condition, not character flaw”).

Binding rules:
- [`00_ENGINE/pipeline/README.md`](../00_ENGINE/pipeline/README.md)
- [`00_ENGINE/VARIATION_AXES.md`](../00_ENGINE/VARIATION_AXES.md)
- [`01_BRANDS/SAI/BRAND.md`](../01_BRANDS/SAI/BRAND.md)

## Done

### Kinetic (faceless) cut
- `AVATAR_SCRIPT.md` — spoken words only (129 words)
- `beats.json` — kinetic cards
- `voice.wav` — Sarvam bulbul:v3 speaker **priya**, **55.7s** (do not re-TTS unless asked)
- `final.mp4` — kinetic typography, 60s

### Kallaway split-frame cut (current main deliverable)
- `beats_kallaway.json` — visuals + faces + captions + pan directions
- `kallaway.py` — compositor with punch-in / Ken Burns resize on b-roll **and** face
- `MODE=kallaway ./render.sh …` skips TTS, reuses `voice.wav`
- `final_kallaway.mp4` — 1080×1920, 60s, same VO
- `assets/` — stills, AI face stand-ins (`face/hook|market|close.mp4`), `MANIFEST.md`
- `SHOOT_BRIEF.md` — Karan records 3 plates to replace stand-ins
- Stills: `still_k_01.png` (hook+counter), `still_k_02.png` (market hold), `still_k_03.png` (close)

### Remotion polish pass
- Project: `00_ENGINE/remotion/` (npm installed)
- Output: `final_kallaway_remotion.mp4` (also under `00_ENGINE/remotion/out/`)
- Studio: `cd 00_ENGINE/remotion && npm start`
- Re-copy assets after stills change: `./link-assets.sh`

### Animation (Python preview)
- `kallaway.py` — punch-in + pan/zoom on b-roll **and** face plates
- Re-render: `MODE=kallaway ./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze`

- Line intact: **“It's a market condition. Not a character flaw.”** — face hold 23.3–32.7s, no cutaway
- End on face, not b-roll
- No company logos on screen; Wipro spoken only
- Bottom 250px = Instagram UI safe zone for captions
- Cut words if VO long — never raise pace

## Layout (Kallaway)

```
TOP ~55%   b-roll / counter / stills (animated zoom+pan)
RULE       yellow 5px
BOTTOM     face plates on 0–6 / 23.3–32.7 / 56.2–60; else dim
CAPTIONS   dark pill, white + yellow highlights, above safe_bottom 250
```

## How to re-render

```bash
cd "00_ENGINE/pipeline"
# Kallaway (reuse voice)
MODE=kallaway ./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze
# Kinetic (re-TTS — avoid unless needed)
./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze
```

Needs: `00_ENGINE/pipeline/.venv` (pillow, requests), `ffmpeg`, `.env` with `SARVAM_API_KEY` only for TTS path.

## Remotion + DaVinci (scaffolded 2026-07-31)

- Remotion project: `00_ENGINE/remotion/` — `npm install` done, assets linked via `link-assets.sh`
- Run studio: `cd 00_ENGINE/remotion && npm start`
- Render: `npm run render` → `out/final_kallaway_remotion.mp4`
- DaVinci finish: variation `DAVinci_BRIEF.md` (markers, duck music, face swap, export)

Python `kallaway.py` now has stronger punch-in + pan/zoom on **b-roll and face**. Re-run `MODE=kallaway ./render.sh …` after any motion tweak.

Also point Claude at:
- This file: `PROGRESS.md`
- Remotion: `00_ENGINE/remotion/README.md`
- Resolve: `DAVinci_BRIEF.md`
- Shoot: `SHOOT_BRIEF.md`

## Do not

- Edit plan file in `.cursor/plans/` unless user asks
- Commit `.env` / API keys
- Use Wav2Lip
- Raise TTS pace to fix timing
