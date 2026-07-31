# RENDER — v1 Amazon structures

40s · faceless · vertical 9:16 · AI-generated cinematic sequence

---

## Voice direction

**Character:** Low, level, unhurried. Someone reading you a fact they already find remarkable and therefore doesn't need to sell. Closer to a nature-documentary narrator than a news anchor, but drier than both.

**Pace:** ~150 words per minute. 93 spoken words = 37.2s, leaving 2.8s for the two scored pauses and the final hold inside a 40.0s cut. Do not rush the first line to fit more in — the hook needs air after it more than it needs speed. The script has been cut to fit at this pace; if a take comes in short, let the pauses breathe rather than adding words.

**Line-by-line:**
- **"Lasers just found 396 lost monuments..."** — completely flat. No lift on "396", no lean on "lost". The number does the work. Land the full stop and leave roughly 0.4s of silence before the next line.
- **"You were taught Amazonia was empty."** — slight downward inflection, as if quoting something settled and slightly dull. This line must sound believable, not sceptical. If the VO winks here, the reveal has nothing to break.
- **"Too poor to farm. Nothing built to last."** — two clipped fragments, hard stop between them. Slightly faster than the rest of the script. This is the assumption being stacked.
- **"...published the survey."** — return to neutral news register. This is the pivot; play it as information, not as a turn.
- **"...mapping the ground below."** — slow down noticeably. Drop pitch on "below". Then a full 0.5s of silence over the reveal transition. This is the single most important pause in the script.
- **"432 earthworks. 396 of them, never recorded."** — measured, almost like reading an inventory. Comma before "never recorded" is real — take it. Restraint here is what makes it land.
- **"Nobody knows why."** — quiet. No dramatic drop. Just true.
- **"The forest grew over them."** — softest line in the script. Let it trail slightly. Do not add emphasis; do not add a rising tag.

**Never:** upward inflection at line ends, breathy emphasis, or any "can you believe it" colouring. The register is astonish, and astonishment is undercut the moment the narrator performs it.

---

## Music brief

**Reference feel:** sparse orchestral-ambient. Sustained low strings, a single sub-bass pulse, no percussion kit, no drop.

- **0:00–0:06.0** — silence under the hook, or a single low sustained note at very low level. The hook should feel almost unscored.
- **0:06.0–0:15.6** — a slow low drone enters, one note, barely moving. Tension without direction.
- **0:15.6–0:20.4** — introduce a thin high metallic shimmer as the laser lines appear. Cold, glassy, quiet.
- **0:23.6** — **drop everything to near-silence for the 0.5s reveal pause at the end of shot 6.** The visual break is silent. Then the low strings return underneath, one tone higher than before.
- **0:24.1–0:34.1** — the string bed opens slightly and holds. No build, no crescendo.
- **0:34.1–0:40.0** — everything decays away. The final 0.7s hold is close to silent under "the forest grew over them."

**Sound design:** a soft canopy ambience (insects, distant birds) present from 0:00, cut abruptly to nothing at 0:23.6, and faded back in over the regrowth in the final shot. Add one dry, quiet tick when the laser scan lines first appear. No whooshes, no impacts, no risers.

**Level:** music sits at least 12dB under VO throughout. This script is carried by words.

---

## Caption style

- **Font:** heavy grotesque sans (Inter Black / Helvetica Now Black). Uppercase for numbers, sentence case for words.
- **Colour:** pure white, 90% opacity. Numbers in the same cyan used for the laser scan (#7FE3E8) so the palette carries into the type. No other colours.
- **Position:** lower third, centred, safe-area margin of 12% from the bottom so nothing collides with platform UI.
- **Motion:** hard cut on, hard cut off. No fades, no bounce, no typewriter, no karaoke word-highlighting. The cuts are the rhythm.
- **Burned-in captions:** yes — full VO subtitles as a separate, smaller track sitting above the on-screen text line, styled at 70% white, so the video plays soundless. The on-screen text from the shot table is the headline layer; the subtitle track is secondary and visually quieter.
- **0:20.4–0:24.1:** clear all text. The reveal transition carries no type at all.

---

## Edit notes

- **The 0:20.4 transition is the video.** Everything before it exists to set up an assumption; everything after it exists to break one. Budget your review time accordingly — if that one dissolve isn't smooth, use the pre-agreed 2-frame white flash-cut fallback in `BROLL.md` rather than burning the session on regenerations. Choose dissolve or flash-cut before the session starts.
- **Cut on movement continuity, not on beats.** Shots 1→2 and 7→8 should feel like one continuous camera. Don't add a transition effect; just match the motion.
- **First frame test:** shot 1 must be silent-scroll-stoppable on its own — the on-screen text "396 monuments. Under the Amazon." over an empty canopy is the entire pitch. If the text isn't legible at thumbnail size in frame one, resize it.
- **No bookend — this is a hard rule.** The final frame of shot 9 must NOT match the first frame of shot 1. Shot 1 is dawn, low, mist in visible valleys, horizon in frame; shot 9 is dusk, high, canopy texture only, no horizon and no landmark. Do not colour-match them in the grade, and do not "help" the loop. The video ends on regrowth, and it ends. Another script in this batch owns the matched-frame device; if both use it the batch reads as one template.
- **No end card, no logo sting, no "follow for more".** The last spoken line is the last thing that happens.
- **Grade:** unified LUT across all nine shots *except* the shot 1 / shot 9 relationship, which is deliberately unmatched (see above). Lift the cyan channel slightly in shots 5–6 and pull it back out by shot 8. Crush blacks consistently — mismatched black levels between AI-generated shots is the single biggest tell that these came from different generations.
- **Source line:** small persistent credit, bottom-left, 40% white, from 0:12.4 to end — `Pärssinen et al., Nature 2026`. Small enough not to compete, present enough to be checkable.

---

## Thumbnail

**Concept:** Split the vertical frame horizontally at the midpoint. Top half: dense unbroken green canopy, warm and ordinary. Bottom half: the identical framing with the trees stripped away, showing the cyan-shaded terrain and one enormous perfect square ditch carved into it. The split line is a hard edge, not a blend — the eye should read it as one landscape cut in half.

**Thumbnail text (4 words):** `UNDER THE AMAZON: 396`

Set in the caption face, white with `396` in cyan, positioned across the split line so it bridges both halves. No arrows, no circles, no face, no shocked expression.
