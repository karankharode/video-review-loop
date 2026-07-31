# Next task — background music for the v2 engine

Branch: `dev/background-music`

## Copy-paste this to start the new chat

```
Repo: /Users/Admin/Documents/Claude/Projects/Video Review Loop — read CLAUDE.md first, it has the architecture and the known failure modes; don't sweep the repo. Work on branch dev/background-music.
Task: add a background music bed to the v2 engine (00_ENGINE/v2) so every render ships with scored audio, driven from script.json like everything else.
Source licence-clean free music (Pixabay Music, Free Music Archive, YouTube Audio Library are the approved list in ENGINE_CONFIG.md) — calm ambient, low-mid energy, no vocals, nothing that fights an Indian-English VO.
It must never overpower the voice: target the bed around -26 LUFS against a -14 LUFS integrated master, and duck it under speech rather than sitting at one flat level.
Use assets/words.json — the per-word timings from forced alignment are already there, so ducking can follow the actual speech envelope instead of a guessed sidechain, and the bed can lift in the gaps between beats.
Verify on 02_BATCHES/2026-07-31/sai_ai_interviewer: rebuild, render Master, and check the measured LUFS of voice-only vs music-only vs the mix — don't judge it by ear alone.
```

## Why these constraints

- **`-26` bed / `-14` master** — the bed sits ~12 LU under the programme so it reads as atmosphere, not as a track. `-14` integrated is the platform normalisation target for IG/YouTube; mastering hotter just gets turned down and loses dynamics.
- **Duck to the speech envelope, not a sidechain guess.** `assets/words.json` has every word's start/end measured from the audio. That's a real gate signal — the bed can lift in the gaps between beats and settle under the words, which is what a human mixer does.
- **The two beats that need silence.** `yourwords` (12.2–13.2s) and the retention beat `mirror` (22.6–25.4s) are built on held silence. The music must duck hardest there, not swell. `DAVinci_BRIEF.md` marks both.
- **No vocals.** Any lyric competes with the VO for the same listening channel.

## Suggested shape

A `music` block in `script.json` (`{track, gain, duckDb, liftInGaps}`), a `bin/fetch-music.mjs` alongside `fetch-stock.mjs` with the same caching contract, and the mix applied at render — either as a Remotion `<Audio>` with a computed volume curve from `words.json`, or an ffmpeg post-pass. The Remotion route keeps the alpha overlays untouched and means the mix is visible in the studio preview.

## Definition of done

- `npm run master` produces a scored video with no clipping
- Measured: bed ≈ -26 LUFS, mix ≈ -14 LUFS integrated
- Music ducks under speech and lifts in gaps
- Track licence and attribution recorded next to the Pexels attribution
- Works on both variations, not just the SAI one
