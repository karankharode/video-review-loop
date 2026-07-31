# Sound design — the v2 engine

Binding rules for music beds and SFX. The engine enforces most of this; this
file exists so you know *why* before you override it.

---

## The one idea

**Nothing about the sound is authored to a clock.** `assets/words.json` holds
every word's measured start and end from forced alignment, so:

- the music duck follows the real speech envelope, and lifts in the real gaps
- SFX are placed relative to real beat boundaries
- effects are muted after the last real word, so a tail hold is actually silent

A sidechain compressor can do the first half of the first bullet. It cannot do
any of the rest, because it only knows about sound that has already happened.

---

## Levels

| Element | Target | Why |
|---|---|---|
| Programme (the master) | **−14 LUFS**, ≤ −1.0 dBTP | What Instagram and YouTube normalise to. Louder just gets turned down and loses dynamics on the way. |
| Music bed, as heard in the master | **−30 LUFS** | 16 LU under programme. Present, not competing. |
| SFX bus peak | **−10 dBFS** | Punctuation sits above the bed and below the voice. |
| SFX under speech | **−5 dB** | Enough that a whoosh never fights a consonant; not so much that the cue disappears. |

> The bed target was **−24 to −26** in the first cuts and it was audibly too
> present on review. −30 is the default now. Treat −24 as the ceiling for a video
> where the music is genuinely part of the feel, not the floor for atmosphere.

### Which knob for which complaint

These are easy to confuse and only one of them does what you want:

| Complaint | Knob |
|---|---|
| "The music is too loud." | Lower **`bedLufs`**. |
| "The music muddies the voice." | Raise **`duckDb`**. |

Raising `duckDb` does **not** make the bed quieter overall. `bedLufs` is
calibrated against the *ducked* result, so a deeper duck is compensated by a
larger make-up gain and the gaps come up to match. It changes the contrast
between speech and silence, not the level.

**`bedLufs` means the level in the *master*, not the level of the file.** Three
things sit between: the duck removes ~9 dB, and the master bus adds ~1–2 dB
lifting the programme to −14. `bin/fetch-music.mjs` measures both and writes
`makeupDb` into `music.json`. Normalising a bed file to −26 and stopping there
lands it around −33, which is inaudible.

---

## Music

Choose a bed by **measurement, not by ear** — you cannot hear a mix you have not
made yet, and "sounds nice on its own" is not the criterion.

Two numbers decide it:

1. **Energy in the 300–3400 Hz speech band, at matched loudness.** This is what
   masks the voice. On the two beds shipped so far the spread between candidates
   was 15.3 dB — far larger than any difference in how "good" they sounded.
2. **Loudness range (LRA) of the chosen window.** A bed should have no arc of
   its own. Under LRA ~5 is flat enough; a 28 LRA window will swell under a line
   and duck under another for reasons unrelated to the script.

Both are one ffmpeg call each. Pick the window, don't just take the track from 0s.

**Never a track with vocals.** A lyric competes with the VO for the same
listening channel. `fetch-music.mjs` filters any catalogue entry whose
instruments mention voice, choir or chant.

### Per-beat treatments

`music: {mode: ...}` on a beat:

| Mode | Effect | Use for |
|---|---|---|
| `hard` | Capped 18 dB down, no gap lift | A beat built on held silence |
| `settle` | Capped 11 dB down, no gap lift | A retention beat — motion settles, so the bed does |
| `lift` | Floor raised 3 dB, gaps may breathe | The one optimistic turn |
| `normal` | Default | Everything else |

`settle` is **inferred** from `retentionBeat`. `hold` infers nothing — it is a
*camera* property in this engine (`BeatPicture` reads it to choose push amount),
and treating it as a music cue silently ducks beats that are merely held on one
frame while somebody talks over them.

---

## SFX

### Sparsity is the whole rule

**Three to five effects per video.** One whoosh per cut is the single most
common way an edit starts sounding cheap: the ear stops hearing them as
punctuation and starts hearing them as texture. Overusing them is worse than
using none.

The engine therefore *scores* candidate moments and keeps only the best few.
`bin/build.mjs` logs everything it dropped and why, so the restraint is visible
rather than silent. On a 16-beat script it typically drops 9 candidates.

Raising `sfx.maxCount` past 6 should need an argument. Six is already only five
*moments*, because a riser resolving into a hit is two cues and one gesture.

### Alignment is the other rule

An effect's **moment** lands on the cut — not its file start. Every effect
carries an `anchor`: a riser's is its peak at the very end, an impact's is its
transient near the front, a whoosh's is mid-sweep. The scheduler subtracts the
anchor.

"A riser that peaks at the reveal" and "a hit that lands on the cut" are the
same instruction with different anchors. Getting it wrong by 200ms is the
difference between punctuation and mud.

### Rotation

Repeating one identical whoosh trains the ear to filter it out, which costs the
cue the only thing it was for. The scheduler rotates a deterministic variant per
kind — same gesture, different noise and slightly different length.

### Where cues come from

Synthesised, by default — see `bin/lib/sfx-synth.mjs`. Risers, whooshes,
impacts and pings *are* filtered noise sweeps and decaying sines, so generating
them costs nothing, carries no licence, needs no download, and reproduces from a
seed.

To use recorded effects instead, drop files into `00_ENGINE/v2/sfx-library/` or
a variation's `assets/sfx/`, named for the kind (`impact.wav`, or `impact-2.wav`
for a variant). A supplied file overrides the synthesised one, and its anchor is
found by locating its first transient.

---

## Why the buses are pre-mixed

Both the bed and the SFX are rendered to single WAVs at build time and played at
unity by Remotion.

`<Audio volume={fn}>` compiles a per-frame callback into **one nested ffmpeg
`volume` expression**, and a smooth 45s envelope at 30fps overruns the parser
outright (*"Missing ')' or too many args"*). The render dies in
`preprocessAudioTrack` — after bundling, so you pay the bundle before you find
out.

Baking is also the better shape: the studio preview then plays exactly what
renders, and `bin/master-audio.mjs --add-music` can rebuild the same mix offline
in seconds without re-rendering a frame.

---

## Verifying a mix

**Never by ear alone, and never against `voice.wav`.** The VO source and the
render use different level conventions — a consistent ~2.85 dB offset — which
buries a real signal in a fake one.

Compare two renders that differ only by the thing you changed. Keep the
music-free render as the reference. Then check the windows that matter:

```bash
# does the bed actually disappear where the brief says it must?
ffmpeg -ss 12.30 -t 0.80 -i with_music.mp4 -af astats -f null - 2>&1 | grep "RMS level"
ffmpeg -ss 12.30 -t 0.80 -i no_music.mp4   -af astats -f null - 2>&1 | grep "RMS level"
```

A correct hard duck adds **under 0.1 dB**. A correct gap lift adds **1.5–2 dB**.
