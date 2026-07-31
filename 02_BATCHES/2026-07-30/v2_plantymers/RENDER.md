# RENDER — v2 Plantymers

**Target:** 50.0s, 9:16, 1080x1920. Faceless, VO over b-roll.

---

## Voice direction

**Character:** someone showing you something on a bench, not presenting to a room. Low-mid register, close-mic, slightly dry. Curious rather than impressed. The material is interesting enough — the read should be flat where the facts are strongest.

**Delivery notes by beat:**

- **0:00–0:06.3 (hook)** — Plain and unhurried. **"Five days at sixty degrees" is read as one flat unit — it is a condition, not a boast. Do not throw the temperature away, do not speed through it, and do not let an edit or a re-record drop it.** The 60°C caveat lives here in the voice as well as on screen, and that redundancy is deliberate: a caveat the viewer only sees is a caveat most viewers never receive. "Look at the wrapper" is an instruction, not a tease. Do not lift the end of the line.
- **0:06.3–0:14.5 (THEN)** — Slightly cooler, more clipped. "It outlives you" gets no emphasis at all; landing it flat is the whole point. A real beat of silence after "plastic."
- **0:14.5–0:30.5 (NOW / method)** — Pace picks up ~10%. This is the how-it-works stretch and it should feel like someone walking you through steps. Small pause after "Zein" so the word registers.
- **0:30.5–0:39.8 (properties)** — Land "Stronger than polyethylene" as three even words. Then a clear breath before the degradation number. Read "sixty to eighty percent" precisely, no rounding-up energy in the voice.
- **0:39.8–0:44.5 (honesty beat)** — This is the most important tonal shift in the video. Drop volume slightly. "Today, that's one square metre of film on a bench" should sound like a correction, an unmissable line between *is* and *could be*.
- **0:44.5–0:50.0 (dream payoff)** — Warmer, slower, quieter. "One day" carries the conditional; let it sit before the rest. Final word "banana" trails off rather than punching.

**Pace:** ~143 wpm overall. 116 spoken words = 48.7s, plus the two 0.5s hard silences = 49.7s in a 50.0s cut. Do not compress to fit — the pauses are load-bearing, especially the two before 0:39.8 and 0:44.5. If the read runs long, the fix is never to clip the first line.

**If using TTS:** medium-slow rate, low pitch variance, no "excited narrator" preset. Render `AVATAR_SCRIPT.md` verbatim; the "..." marks are the pauses listed above.

---

## Music brief

**Reference feel:** a single sustained warm pad with a slow, physical pulse underneath — something that sounds like a room rather than a track.

- **0:00–0:06.3** — Almost nothing. A low drone and one soft tone on the push-in. Let the hook sit nearly dry — the temperature has to be audible.
- **0:06.3–0:14.5** — The pad thins and goes slightly metallic/cold under the crude-oil beat. Add a faint high shimmer that feels sterile.
- **0:14.5** — Warmth returns on the maize cut. This is the only musical "event" in the piece and it should be felt, not announced. No drop, no riser.
- **0:14.5–0:39.8** — Gentle pulse, roughly 70–80 bpm feel, no drums. Very light plucked or marimba-ish motif under the method section.
- **0:39.8–0:44.5** — Pull the pulse out entirely. Pad only. Almost silence under the lab-bench line.
- **0:44.5–0:50.0** — Pad blooms, one warm resolving chord, decaying under the final line and continuing about a second past picture end.

**Levels:** music sits at -22 to -20 LUFS under VO, ducking 4dB on every VO line. Master to -14 LUFS integrated, true peak -1.0dBTP.

**Avoid:** trailer percussion, tension risers, ticking clocks, corporate-inspirational piano, anything with a build at 0:34.7.

---

## Caption style

Burned-in, not auto-generated.

- **Font:** clean grotesque (Inter Tight or Söhne), Semibold, all sentence case — no all-caps.
- **Size/position:** ~62px cap height, safe-area bottom third, sitting at 78% frame height so it clears both platform UI and the macro subject matter.
- **Colour:** bone white `#F6F3EC` with a 40%-opacity soft shadow. No stroke, no box, no highlight-word colour changes.
- **Timing:** phrase-level chunks of 3–6 words, appearing on the beat of speech and holding for the full phrase. No word-by-word karaoke pop — it fights the slow camera language.
- **On-screen text rows** from the shot table (`Day 5 · 60°C test`, `Zein — maize protein`, `Stronger than polyethylene`, `60–80% gone in 30 days`, `Lab stage — ~1 m² made`) are a **separate, smaller layer**: same font at Regular weight, ~34px, top-third, left-aligned, 70% opacity. These are the honesty layer and must never be omitted in the interest of a cleaner frame — especially `Day 5 · 60°C test` and `Lab stage — ~1 m² made`. Note that `Day 5 · 60°C test` is now a *second* carrier of the caveat, not the only one: the voiceover says "five days at sixty degrees" out loud. Keep both. They fail in different directions — the text covers muted playback, the voice covers viewers who don't read the frame.

---

## Edit notes

- **Cut on motion.** Every transition lands mid-movement (kernels falling, blade dragging, liquid settling) so the film feels continuous despite ten sources.
- **The colour snap at 0:14.5** is the structural hinge — the entire "then vs now" reads through grade, not through a graphic device. Do not add a split-screen or a wipe.
- **Two hard silences:** 0:14.0–0:14.5 (after "plastic") and 0:39.8–0:40.3 (before the lab-bench line). Both should be genuinely empty, VO and music. These 1.0s total are already inside the 50.0s budget — do not reclaim them for words.
- **Shot 7's cross-dissolve** is the only dissolve in the first nine shots. Shot 10's is the second and last. Everything else is a straight cut, so the two dissolves carry meaning.
- **Shot 10 is deliberately softer and brighter than everything before it** — it is the only imagined frame in the video, and the viewer should feel that difference without being told.
- **First-frame test:** the opening frame (browned banana vs yellow wrapped banana) must be legible as a comparison at thumbnail scale, with no sound and no text. If it isn't, reframe tighter before anything else is fixed.
- **Do not** add a "follow for more" end card, a link, or a question on the last frame. The video ends on soil.

---

## Thumbnail concept

Single frame: the two bananas from shot 1, shot from directly above on the bone-white bench, filling the frame — dark blotchy banana on the left, bright yellow wrapped banana on the right, with the film's seam catching one soft highlight. Hard vertical centre split implied by the gap between them, no drawn line. Warm 4800K key from frame left.

**Thumbnail text (4 words):** `Same five days. Corn.`

Set in the caption grotesque, Semibold, bone white, bottom-left, small — roughly 8% of frame height. The image does the work; the text only names the ingredient so the promise is honoured before the click.
