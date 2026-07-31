# DaVinci Resolve — finish pass (SAI: It's Not Watching Your Face)

**Timeline: 1080×1920, 30 fps, 45.06s (1352 frames).**

`master.mp4` is already a finished, postable video. Resolve is for grading, music, and swapping in your own footage — not for rebuilding the edit.

---

## Media pool

| File | Track | What it is |
|---|---|---|
| `master.mp4` | reference | The finished cut. Use as picture-lock reference, or as V1 if you only want to grade and add music. |
| `graphics_alpha.mov` | **V2** | Stat card, waveform, transcript, meters, step cards, end card. **Transparent everywhere else.** ProRes 4444, 247 MB. |
| `captions_alpha.mov` | **V3** | Word-locked kinetic captions. **91% transparent.** ProRes 4444, 358 MB. |
| `assets/voice.wav` | A1 | The voiceover. This is the master clock — everything is aligned to it. |
| `assets/stock/*.mp4` | V1 | Stock clips, one per beat (once a Pexels key is set — see below). |

Both `.mov` files are `yuva444p12le` — real alpha, read natively by Resolve. If they import opaque, set the clip's **Alpha Mode** to *Premultiplied*.

All video clips start at **00:00:00:00**. Aligned at frame 0, everything is in sync.

---

## Two ways to use this

**A. Grade and ship.** Drop `master.mp4` on V1, `voice.wav` on A1, music on A2. Grade, mix, export. Twenty minutes.

**B. Rebuild the picture.** Put your own footage (or your own stock choices) on V1, then `graphics_alpha.mov` on V2 and `captions_alpha.mov` on V3. The graphics and captions stay perfectly timed to the VO regardless of what's underneath, because they were generated from it.

Option B is the reason the alpha overlays exist. Use it when you want your own b-roll but not to re-time 15 beats of captions by hand.

---

## Beat map

Times are **measured from the audio**, not authored.

| In | Out | Beat | Note |
|---|---|---|---|
| 0.00 | 2.26 | hook | "isn't watching your face" |
| 2.26 | 4.44 | stopped | flash cut in |
| 4.44 | 7.22 | hirevue | whip in; source kicker on screen |
| 7.22 | 10.44 | **quarter** | 0.25% stat card — the proof beat |
| 10.44 | 12.16 | whatscoring | whip in |
| **12.16** | **13.18** | **yourwords** | 1.0s held answer. Do not cut into this. |
| 13.18 | 16.40 | shape | transcript weak vs strong |
| 16.40 | 22.58 | paceum | meters; filler runs hot |
| **22.58** | **25.38** | **mirror** | **Retention beat.** Tonal reset — let it breathe. |
| 25.38 | 26.98 | nobody | held on the same frame |
| 26.98 | 28.28 | goodnews | first warm grade in the video |
| 28.28 | 31.88 | trainable | face struck out vs answer structure |
| 31.88 | 37.20 | record | three step cards — the save-bait frame |
| 37.20 | 41.32 | hearums | filler marked on the waveform |
| 41.32 | 44.06 | close | end card, then 1.0s tail hold |

---

## Rules the edit shouldn't break

1. **12.16–13.18 "Your words."** is the answer to the question the hook asked. It's one second. Don't trim it, don't cut into it, don't put music under it.
2. **22.58–25.38 is the retention beat.** This is where the viewer reframes their own preparation. Motion settles here on purpose.
3. **It ends on the end card + 1.0s hold.** No logo sting, no outro.

---

## Grade

- Accent is **`#00E5A0`**; secondary **`#FF2E63`**. Both are already in the graphics — don't fight them in the grade.
- The engine already applies a per-beat grade (`cool` → `cold` → `dark` → `warm` → `accent`). The video deliberately warms up at 26.98s, on "Which is the good news." Preserve that arc.
- If you replace the footage, match it *to* the graphics.

## Music

- Tense, minimal, low. −24 to −26 LUFS under the VO.
- **Duck hard 12.16–13.18** ("Your words.").
- Lift at 26.98s (the warm turn) — the only optimistic moment.
- Out by 44.06s. The tail hold is silent.

## Export

H.264/H.265, 1080×1920, high bitrate, **−14 LUFS** integrated. Filename `final_resolve.mp4`.

---

## Regenerating

Change wording or timing in `script.json`, then:

```bash
cd 00_ENGINE/v2
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_ai_interviewer --force-tts
npm run master && npm run captions && npm run graphics
```

`--force-tts` re-records the voice; alignment then re-runs automatically because the audio changed, and every caption re-times itself. Editing only visuals (stock queries, grades, graphics) skips both TTS and whisper via the cache.

## Stock footage

13 Pexels clips, all **1080×1920 or better**, in `assets/stock/`. Credits in `assets/stock/ATTRIBUTION.md` (Pexels doesn't require attribution, but the record is kept so giving it stays your choice).

## Presenter — swapping stock for yourself

Two stock presenters stand in at `assets/face/presenter_a.mp4` and `presenter_b.mp4`, used on five beats:

| Beat | Time | Treatment |
|---|---|---|
| `hook` | 0.0–2.3 | `band` — horizontal strip across the upper-middle |
| `yourwords` | 12.2–13.2 | `pip` — rounded corner inset |
| `mirror` | 22.6–25.4 | `band` |
| `goodnews` | 27.0–28.3 | `pip` |
| `close` | 41.3–44.1 | `band` |

**To use your own footage: overwrite those two files and rebuild.** Nothing else changes — no timeline edit, no re-alignment.

```bash
# drop your clips in as assets/face/presenter_a.mp4 (and _b.mp4)
cd 00_ENGINE/v2
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_ai_interviewer
npm run master
```

Shooting notes for those clips:
- **Vertical, 1080×1920 or better.** The band crops to a wide strip and the pip to a tall box, so shoot with room on all sides.
- **Face high in frame.** The crop biases upward (`focus` defaults to 24% for band, 30% for pip). Per-beat override: `face: {focus: 30}` in `script.json`.
- **~10s per setup is plenty** — these are short punctuation moments, not narration.
- No audio needed; the clips render muted over the existing VO.
- Add `flip: true` if selfie-cam footage reads mirrored.

To make a beat full-frame presenter instead, set `mode: "full"`. To add a name strap, `strap: "Karan"`.
