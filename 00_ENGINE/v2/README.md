# v2 — alignment-driven video engine

Built from scratch. Not a refactor of `00_ENGINE/pipeline` + `00_ENGINE/remotion`; a different idea about where timing comes from.

```bash
cd 00_ENGINE/v2
npm install
node bin/build.mjs ../../02_BATCHES/2026-07-31/sai_ai_interviewer --render
```

---

## The one idea

**v1: beats are authored, audio must fit them.**
You write "this line starts at 12.8s", generate a voiceover, and hope. It never quite matches, so every caption sits three or four frames off the word it belongs to. That near-miss is most of what makes an edit feel amateur, and no amount of nicer easing fixes it. v1 spent real effort papering over this — per-line TTS, silence trimming, best-of-three takes, per-line slot checks — all of it managing a problem it had created by authoring times up front.

**v2: audio is the clock, beats are derived.**
One continuous voiceover. `whisper --word_timestamps` measures where every word actually lands. Beats are declared as *text*, then resolved to time against that measurement. Captions inherit real per-word timings.

Consequences that fall out for free:
- Captions land **on** the word, not near it — and the word being spoken can be highlighted, which is the signature "a person edited this" cue in short-form.
- Change a word in the script and every caption, cut, graphic and transition moves with it. No re-timing pass.
- The length gate stops being arithmetic-on-paper and becomes a measurement. There is no "the TTS is slower than 150 wpm" problem, because nothing assumes a rate.
- Sarvam's duration non-determinism (documented in `../pipeline/README.md` — the same line came back 2.40s / 3.33s / 4.41s / 5.00s across four calls) stops mattering entirely. We don't predict the length; we measure it.

---

## Pipeline

```
bin/tts.mjs     one continuous VO          → assets/voice.wav
bin/align.mjs   whisper word timestamps    → assets/words.json, assets/beats.json
bin/fetch-stock.mjs  Pexels, one clip/beat → assets/stock/*.mp4 + ATTRIBUTION.md
bin/build.mjs   runs the above, then links → src/timeline.json, public/
```

Each step is independently runnable and cached. `build.mjs` is just the order.

### Caching

- **TTS** skips if `voice.wav` exists (`--force-tts` to redo).
- **Alignment** is keyed on a hash of the beats' spoken text plus the audio size. Editing a stock query or `targetDuration` does *not* re-run whisper; editing a `say` line does. `--force` overrides.
- **Stock** skips any clip already downloaded (`--force` to refetch).

Whisper `turbo` takes ~6 minutes on this CPU for a 45s file. Use `--model base.en` while iterating; it's much faster and the word boundaries are close enough for layout work.

---

## Script format

`script.json` in the variation folder. Beats declare *what is said*, not *when*.

```jsonc
{
  "design":  { "accent": "#00E5A0", "grain": 0.055, "vignette": 0.5 },
  "voice":   { "speaker": "priya", "pace": 1.0 },
  "beats": [{
    "id": "hook",
    "say": "The AI interview isn't watching your face.",  // alignment key
    "caption": "NOT YOUR FACE",                            // what's on screen
    "emphasis": ["NOT", "FACE"],                           // accent slabs
    "stock": { "type": "video", "query": "woman laptop dark room" },
    "graphic": { "kind": "counter", "to": 0.25, "suffix": "%" },
    "transitionIn": "flash",                               // none|cut|flash|whip|zoomblur
    "grade": "cool"                                        // cool|cold|dark|warm|accent
  }]
}
```

`say` **must** match `AVATAR_SCRIPT.md` word for word — it's the alignment key.

---

## What makes it look edited

| | |
|---|---|
| **Word-locked captions** | Each word enters on its own measured timestamp; the spoken word is highlighted |
| **Grade** | Per-beat filter chain + tint wash. This is the single biggest lever for making unrelated stock clips read as one video |
| **Transitions** | `flash`, `whip` (horizontal smear), `zoomblur` (punch out of blur) — each carries momentum across the cut |
| **Energy-driven FX** | Chromatic aberration and bloom fire **on cuts** and decay. A constant level just looks like a filter left on |
| **Grain** | SVG turbulence, reseeded every 2 frames so it reads as ~24fps film grain rather than 30fps shimmer |
| **Safe area** | Captions sit above 260px; the platform UI owns the bottom of a vertical feed |

Composition-level: `Master` (finished video), `CaptionsAlpha` and `GraphicsAlpha` (ProRes 4444 with alpha, for DaVinci Resolve).

```bash
npm run master     # out/master.mp4
npm run captions   # out/captions_alpha.mov
npm run graphics   # out/graphics_alpha.mov
```

Alpha renders need `--image-format=png`; `remotion.config.ts` sets JPEG globally for the master, and the npm scripts override it. Without that override the render fails with *"Pixel format was set to 'yuva444p10le' but the image format is not PNG."*

---

## Stock footage

Pexels. Needs a free key at [pexels.com/api](https://www.pexels.com/api/), placed in `00_ENGINE/pipeline/.env`:

```
PEXELS_API_KEY=...
```

Add it to the file directly — don't paste keys into chat.

Without a key the fetcher exits cleanly and every beat falls back to a generated gradient backdrop. The render still works; it just isn't cinematic. Add the key later and re-run `bin/fetch-stock.mjs` — nothing else changes.

Attribution for every clip is recorded in `assets/stock/ATTRIBUTION.md`. Pexels doesn't require credit, but losing the data means you can't choose to give it later.

**Avatar / talking head:** HeyGen and Higgsfield need an account, so they can't be wired up automatically. Export a clip yourself and drop it at `assets/face/<beatId>.mp4`; the same beat structure accommodates it.

---

## Known limits

- **Whisper mishears proper nouns.** "HireVue" came back as "hire view"; "percent" as "person". Only the *times* are consumed, never the text, so this is cosmetically invisible — but it does mean a beat boundary occasionally falls back to token count. Those beats are marked `matched: false` and reported at the end of an align run.
- **Alignment is greedy, not global.** A beat whose text diverges badly from the audio can desynchronise the following beat. In practice the ±3-word boundary search recovers it; a true DP alignment would be more robust and is the obvious next improvement.
- **No audio-reactive cutting yet.** Cuts land on beat boundaries, not on stressed syllables. The word timings needed to do it are already in `words.json`.
