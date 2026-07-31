# Render brief — v4 "What Are You Practising For?"

**Runtime:** 45.0s | **Aspect:** 9:16 | **Mode:** faceless, VO + generated b-roll

---

## Voice direction

**Casting:** Indian English, neutral urban accent, age-read 26–32. Slightly lower pitch than the channel default. This one should sound like a friend who found something out and came to tell you — not a newsreader, and not a motivational speaker.

**Register:** level and unhurried. The temptation on a warn-register script is to push urgency into the voice. Resist it — the facts carry the weight, and any vocal alarm on top makes the whole thing read as fearmongering. If the take sounds like it belongs over a stock-market crash graphic, it is wrong.

**Pace:** ~145 wpm overall — 103 spoken words = 42.6s, plus ~1.0s of scored ellipsis and countdown micro-beats = 43.6s inside a 45.0s cut. Not uniform:

| Beat | Direction |
|---|---|
| 0:00–0:05.0 | Slowest line in the video. Full beat on the ellipsis (~350ms). Ask the question genuinely, do not accuse. |
| 0:05.0–0:15.0 | Flat, factual, reportorial. Zero editorialising. "Twenty-two percent" gets no emphasis — the number is doing its own work. Do not swallow "worldwide" or "at least one" to make the line fit; the line already has the time it needs. |
| 0:15.0–0:25.0 | Warms up. The word "train" at 0:24 lifts slightly — this is the good news arriving. |
| 0:25.0–0:29.4 | Level, not urgent. "That's the market, not you" is the reassurance beat of the whole video — say it plainly, no warmth added and no lift at the end. Then "Three fixes" lands hard and clipped. |
| 0:29.4–0:39.8 | Instructional, brisk, even. Each numeral gets a ~200ms micro-beat after it: "Three. ⟨beat⟩ Say your answers out loud." |
| 0:39.8–0:45.0 | Slows back to the opening tempo. "That's what you're practising for" is warm, close-mic, almost quiet. "Save this" is one notch up and matter-of-fact. |

**Never:** rising interrogative inflection on the countdown items, hype energy on "Three fixes", or a smile audible on the Gartner lines.

**Enunciation flags for TTS:** "Gartner" (hard G, GART-ner). "Drexel" (DREK-sull). "SAI" as one syllable, "sigh", not S-A-I. Ellipses in AVATAR_SCRIPT.md are ~350ms holds.

---

## Music brief

**Reference feel:** restrained electronic underscore. Muted pulse, sub-bass, a single sustained pad. Think documentary cold-open, not trailer.

- **0:00–0:05.0** — near silence. One low sub-hit on the cut in, then only room tone under the hook. Silence at the open outperforms music here.
- **0:05.0–0:25.0** — a steady 90bpm pulse enters, quiet, no melody. It should be felt more than heard.
- **0:25.0–0:29.4** — the only build in the track. Add a filtered riser resolving exactly on the "3" stamp at 0:26. Do not let it crest into a drop.
- **0:29.4–0:39.8** — pulse continues, add a light percussive tick on each numeral change to sell the countdown.
- **0:39.8–0:45.0** — everything drops away except the pad, which resolves warm on "That's what you're practising for." Let the last 0.8s ring out clean under the save icon.

**Mix:** VO at −6dB, music ducked to −22dB under speech and −16dB in the gaps. No sound effects on the statistic reveals — a whoosh on "22%" is the exact production choice that makes a true number feel manufactured.

---

## Caption style

- **Font:** heavy geometric sans, tight tracking, all caps for the numerals and stat callouts, sentence case for everything else.
- **Colour:** white body copy; **amber #F4A93C** reserved exclusively for numbers and the countdown numerals. Nothing else is ever amber in the type.
- **Placement:** lower third, safe-area aware, always clear of the centre divider. When the active panel is on the right, nudge captions 6% left so they never sit on top of the live half.
- **Behaviour:** word-by-word pop-on synced to the VO, 2–4 words visible at a time. No karaoke highlight, no bounce, no drop shadow — a 4px dark outline only.
- **The stat cards are different.** At 0:09.0–0:15.0 and 0:15.0–0:20.0, the source attribution sits as a small static card in the upper third: `Gartner · 110 heads of HR · surveyed Q4 2025` and `Drexel LeBow · 600+ employers · Jul 2026`. Small, unglamorous, persistent for the full row. This is the single highest-value element in the edit — it is what stops the video being screenshotted as an unsourced claim.
- **The Gartner card must say `surveyed Q4 2025`, not `Jul 2026`.** July 2026 is the *publication* date; the fieldwork was 4Q25. Dating a survey by its press release is the kind of small error that costs the whole video its credibility when someone opens the source.
- **Hard rule for the editor:** the on-screen text at 0:09.0–0:15.0 reads `22% — at least one leader`. The qualifier is not optional and must not be trimmed for fit. If it does not fit, reduce the type size, not the words.

---

## Edit notes

1. **Cut on the beat, not on the breath.** Shot lengths are 5.0 / 4.0 / 6.0 / 5.0 / 5.0 / 4.4 / 5.2 / 5.2 / 5.2 — derived from their VO lines, not a uniform grid. Do not "tidy" them back to 5s each: the 22% line needs its 6.0s to say "at least one leader" without rushing. Cut exactly on those marks and the countdown still feels metronomic.
2. **The 25.0s pattern break is the whole retention strategy.** Cut into Shot 6 hard, no dissolve, no transition. Both panels ignite on the same frame. If you soften this, the video dies at the 60% mark.
3. **The divider never moves** from 0:00 to 0:39.8. Any wobble across shots reads as sloppy generation. Composite the divider as a single overlay layer across all eight split shots rather than relying on it being baked into each generation.
4. **Left panel stays visible at ~25% after 0:15.0.** Do not black it out. The argument is that both things are true at once; if the left disappears, the tension disappears.
5. **The countdown numerals (3, 2, 1)** live in the same corner position, same size, same amber, for their full row each (5.2s). At 0:44 the "1" morphs into the save icon — one continuous shape, not a cut.
6. **Shot 9 must match Shot 1's framing.** Lay them on top of each other in the timeline and check before locking. If the chair has moved, the payoff is lost.
7. **No logo sting at the head.** Brand mark, if any, appears only in the final 1.5s at 40% opacity, bottom corner, clear of the save icon.
8. **Product beat check (0:34.6–0:39.8):** swap the generated UI for a real SAI screen recording if one exists. Ensure whatever is on screen shows *spoken-answer scoring* — not a text input, not a grammar correction. That distinction is a brand hard rule.
9. **Shot 7 (0:29.4–0:34.6) is shot on a phone, not generated.** One real person from behind, both halves cropped from the same locked-off take. See `BROLL.md`. Do not send it to a generator as a fallback — the generative version has no stopping condition and will consume the session.

---

## Thumbnail concept

**Visual:** the split frame from Shot 6, held. Note Shot 6 is generative; the shot 7 phone footage is not a thumbnail candidate (no face by design). Left half — a narrowing doorway of light with a long shadow reaching toward it, cold slate. Right half — a full-amplitude amber waveform filling the frame. Hard amber divider down the centre. No face. High contrast so it reads at 120px.

**Thumbnail text (4 words):** `FEWER SEATS. LOUDER SCREENING.`

Set in heavy condensed caps, white with the second line in amber, stacked across the lower third, one line per panel so each half of the image carries its own half of the sentence.

**Alternate (3 words):** `PRACTISING FOR WHAT?` — use this if the video is placed alongside other split-screen thumbnails in the batch and needs to differentiate on type rather than image.
