# Render pipeline

Free stack. No paid SaaS, no GPU for the default path.

```
./render.sh ../../02_BATCHES/2026-07-30/v6_cbfc_spiderman
MODE=kallaway ./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze
```

Kinetic mode: Sarvam voice + typography → `final.mp4`.  
Kallaway mode: reuses existing `voice.wav`, split-frame b-roll + face plates + bottom captions → `final_kallaway.mp4`.

---

## Setup (once)

```bash
brew install ffmpeg          # macOS
python3 -m venv .venv
.venv/bin/pip install requests pillow
cp .env.example .env         # then paste your Sarvam key into .env
```

`.env` is gitignored. Don't commit the key, and don't paste it into chat — this script reads it from disk.

---

## What each file does

| File | Role |
|---|---|
| `render.sh` | Orchestrator. Voice → length check → video. |
| `tts_sarvam.py` | Sarvam **bulbul:v3**. Chunks >2400 chars on sentence boundaries. |
| `kinetic.py` | Draws kinetic type with Pillow and encodes through FFmpeg — no stock footage, no assets, no network. |
| `kallaway.py` | Split-frame compositor: top b-roll/stills, bottom face plates, caption burn-in; muxes existing `voice.wav`. |
| `make_placeholders.py` | Draws top-panel diagram plates from `plates.json`. No stock, no binaries in the repo, fully regenerable. |
| `make_face_plates.py` | Animated stand-ins for unshot talking-head footage. Each plate carries its setup, timecode and line, so it doubles as a shot list. |
| `make_scratch_vo.py` | Beat-locked scratch guide track: synthesises each line separately and lays it at its exact beat start. |

Each variation folder needs two inputs:

- **`AVATAR_SCRIPT.md`** — the spoken words and nothing else. `render.sh` refuses to run if it finds markdown, brackets or a table, because every character in that file gets read aloud.
- **`beats.json`** — timing and on-screen text. `start`/`end`/`text`, plus optional `size`, `wrap`, `kicker`, `accent_line`.

---

## The two guards, and why they exist

**1. AVATAR_SCRIPT hygiene.** A stray `[NEEDS SOURCE]` or a bolded heading in that file becomes spoken audio in the finished video. This is the most common way these pipelines produce embarrassing output. `render.sh` greps for it and hard-fails.

**2. Voice-vs-beats length.** If the VO runs longer than the beats, the final card disappears before the last sentence lands and your payoff plays over black. The script fails if the voice overruns by more than 0.75s.

When it fails, **cut words — don't raise `pace`.** A rushed voice reads as an ad. The script being too long is real information, not an obstacle.

---

## Two measured facts about Sarvam (2026-07-31)

Both found while timing the v1 dendrite script. Both change how you read a failed length gate.

**1. Bulbul v3 speaks at ~120 wpm at `pace 1.0`, not 150.**

114 words came back as 56.8s — that's 120 wpm. Scripts in this repo are written and timed at **150 wpm**, which is normal unhurried on-camera delivery. So a TTS render of an on-camera script will overrun its beat map by roughly 25% and *the script is not the problem*.

For a faceless variation the VO **is** the deliverable, the 150 wpm assumption is simply wrong for it, and the fix is still to cut words. For an on-camera variation the presenter is the clock and the TTS is a stopwatch — `make_scratch_vo.py` runs at `pace 1.25` to bring the guide track to the rate the script was actually written for.

**2. Sarvam returns different durations for identical input.**

The same sentence, same speaker, same pace, four calls: **2.40s, 3.33s, 4.41s, 5.00s.** Byte counts track the durations, so the audio genuinely differs — it isn't a header artefact. Most of the spread is variable silence padding at the ends.

Consequences:
- **Never trust a single TTS run's length.** One measurement is not the script's length.
- `make_scratch_vo.py` trims leading/trailing silence and takes the best of three attempts per line. That's picking a take, not speeding anyone up.
- Because it checks **per line** against that line's slot, a failure now names the line that overran instead of reporting one useless total.

---

## FFmpeg on this machine has no `drawtext`

The Homebrew ffmpeg here (8.0.1) is built without freetype:

```bash
ffmpeg -hide_banner -filters | grep drawtext    # no output
```

`kallaway.py`, `make_placeholders.py` and `make_face_plates.py` all draw text with Pillow and composite it, so they're unaffected. **`kinetic.py` uses `drawtext` and will fail here** with *"No such filter: 'drawtext'"*.

Fix it by installing a build with freetype (`brew install ffmpeg` from a formula that enables it), or port `kinetic.py` to the Pillow approach the other three already use.

---

## Picking a voice

Bulbul v3 has 30+ speakers. Audition a few, then **lock one and stop revisiting it**:

```bash
for S in anushka abhilash karun manisha; do
  SPEAKER=$S python3 tts_sarvam.py test.txt "voice_$S.wav"
done
```

Consistency beats optimality here. A channel that changes voice between videos never becomes recognisable.

---

## Avatar mode (talking head) — separate path

`kinetic.py` covers the faceless typography videos. For avatar-mode videos you need lip-sync, and that needs CUDA:

1. Shoot **one** 30–60s reference clip of yourself — neutral face, small natural head movement, even light, plain background, looking at camera. Reused forever.
2. Generate `voice.wav` with `tts_sarvam.py` (runs anywhere).
3. Run **LatentSync** (Apache 2.0) or **MuseTalk** (MIT) on a free Kaggle T4 — 30 GPU-hours/week is plenty for 5 shorts a day.
4. Bring `final.mp4` back and cut in b-roll locally.

**Do not use Wav2Lip.** Its licence prohibits commercial use — the models were trained on the LRS2 dataset. LatentSync and MuseTalk exist to fill exactly this gap and are licence-clean.

---

## Cost

Sarvam TTS at 5 videos/day ≈ **₹270/month**, and the ₹1,000 free credit covers roughly the first 3–4 months. Everything else here is £0.
