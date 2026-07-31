# DaVinci Resolve — finish pass (v1 Waterjet Through Rock)

Everything except your face is already rendered. Resolve's job is: drop your footage on V1, grade, add music, export.

**Timeline: 1080×1920, 30 fps, 50.0s (1500 frames).**

---

## Media pool

| File | Track | What it is |
|---|---|---|
| `graphics_alpha.mov` | **V2** | Top-panel graphics, the accent rule and the progress bar. **Transparent below the rule** — your face shows through. ProRes 4444, 385 MB. |
| `captions_alpha.mov` | **V3** | Word-level animated captions. **97% transparent.** ProRes 4444, 191 MB. |
| *your footage* | **V1** | Full-frame, scaled so your head sits in the lower ~45%. See framing note below. |
| `voice.wav` | A1 | **Scratch guide track only.** Replace with your recorded audio. |
| `preview_placeholder.mp4` | — | Reference cut. Don't put it on the timeline; it's what to match. |
| `final_kallaway.mp4` | — | Python fast-preview. Same edit, cruder motion. Reference only. |
| `assets/face/*.mp4` | — | The placeholder cards. Each one names the setup, the timecode and the line. Use as a shot list, then delete. |

Both `.mov` files carry a real alpha channel (`yuva444p12le`). Resolve reads it natively — no keying, no alpha-mode fiddling. If they come in opaque, set the clip's **Alpha Mode** to *Premultiplied* in the media pool.

---

## Track order

```
V3   captions_alpha.mov      ← always on top
V2   graphics_alpha.mov
V1   your face footage       ← fills frame; visible below the rule
A1   your recorded audio
A2   music bed
```

All three video clips start at **00:00:00:00** and run the full 1500 frames. No trimming, no sliding. If they're aligned at frame 0 the whole thing is in sync.

---

## Framing your footage

The graphics occupy the **top 55%** of frame (1056px) and the accent rule sits at y=1056. Your face lives in the **bottom 45%** (859px).

So on V1: scale and position your clip so your eyeline sits around **y≈1350** in the 1920-tall frame. Shoot wider than you think — you're cropping into the lower third of a vertical frame, and the placeholder cards show exactly how much room you have.

The graphics layer is opaque above the rule, so anything in the top half of your footage is hidden. Don't fight it.

---

## Setup map — where to cut between takes

Six segments. These are *setup changes*, not gaps — you're on camera the whole 50s.

| In | Out | Setup | Beat |
|---|---|---|---|
| 00:00:00:00 | 00:00:06:18 | **A** — wide-ish, energy | Hook |
| 00:00:06:18 | 00:00:18:27 | **B** — tight, flat | The reveal + the setup |
| **00:00:18:27** | **00:00:20:09** | **B locked** | **"It doesn't." Do not move.** |
| 00:00:20:09 | 00:00:37:06 | **B** | The mechanism |
| 00:00:37:06 | 00:00:44:24 | **A** | The turn |
| 00:00:44:24 | 00:00:50:00 | **C** — closer, warm | Close + 1.2s dead hold |

---

## Markers to set

| Time | Frame | Name | Note |
|---|---|---|---|
| 0.0 | 0 | HOOK | "Two years away for ten years" |
| 6.8 | 204 | **THE REVEAL** | "It's not chemistry. It's pressure." |
| 12.8 | 384 | HARDER | Ceramic vs lithium |
| **18.9** | **567** | **IT DOESN'T** | **The turn. Locked frame, no cutaway.** |
| 20.3 | 609 | CRYO | Max Planck / Nature credit on screen |
| 22.7 | 681 | TRAPPED | The money graphic — lithium in the crack |
| 27.5 | 825 | SPLITS | Fracture from inside |
| 30.8 | 924 | **WATERJET** | The most quotable line — give it air |
| 37.2 | 1116 | THE TURN | Chemistry → engineering |
| 39.6 | 1188 | 3 FIXES | Save-bait frame |
| 44.8 | 1344 | CLOSE | Bookend: "It was the pressure." |
| 48.8 | 1464 | DEAD HOLD | 1.2s, no motion, neutral face |

---

## Two rules the edit must not break

1. **18.9–20.3s stays locked.** "It doesn't." is the two-word turn the piece is built on. No cutaway, no push-in, no music swell. The graphics layer already freezes here — don't add motion back.
2. **It ends on your face.** The last 1.2s is a dead hold. No graphic wipe, no end card, no logo sting. That frame is what gets screenshotted.

---

## Grade

- Clean and technical, not cinematic. Slight desaturation, mild contrast, cool shadows.
- The accent is **`#4CC9F0`** (cyan). Don't grade your skin tones toward it — let the contrast do the work.
- Match your footage *to* the graphics, not the reverse. The plates are the fixed reference.
- No teal-orange, no film burn, no light leaks.

---

## Music

- Sparse, tense, low. −24 to −26 LUFS under the VO.
- **Duck to near silence 18.5–20.5s.** The silence around "It doesn't." is doing the work.
- Lift slightly at 37.2s (the turn) — that's the only place the piece gets optimistic.
- Out by 48.8s. The dead hold is silent.

---

## Export

- H.264 or H.265, 1080×1920, high bitrate
- **−14 LUFS** integrated
- Filename: `final_resolve.mp4`

---

## Re-rendering the overlays

If you change wording or timing, edit `beats_kallaway.json`, then from `00_ENGINE/remotion`:

```bash
./link-assets.sh ../../02_BATCHES/2026-07-31/v1_dendrite_waterjet && npm run captions && npm run graphics
```

Outputs land in `00_ENGINE/remotion/out/`. Move them back here, replace on V2/V3 — timecode is unchanged as long as the beat starts didn't move.
