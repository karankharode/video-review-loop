# RENDER — v3 Octopus RNA
30s · faceless · text-on-motion · LEARN register

---

## Voice direction

**Casting:** neutral, unhurried, mid-to-low register. Someone telling you something they find genuinely interesting, at normal conversational volume. Not a narrator. Not a documentary baritone. If it sounds like it's being announced, it's wrong.

**Target pace:** ~150 wpm. 72 spoken words = 28.8s, plus three scored pauses (0.3s before "better", 0.4s after "fewer mistakes", 0.4s before "But") = 29.9s in a 30.0s cut. Read the whole thing at one steady pace and let the edit create the drama — do not accelerate into the statistic. The script was cut specifically so the closing line has room; do not spend that room anywhere else.

**Line-level direction:**

| Line | Direction |
|---|---|
| "Every octopus has a broken ribosome." | Flat, matter-of-fact, no lift on "broken". The word does its own work; selling it kills it. |
| "The break is what makes it better." | Slight lean on "better". This is the contradiction — one beat of pause before it, none after. |
| "Ribosomes build proteins. In octopuses, that strand is snapped in two." | Fastest line in the piece. It's setup, treat it as setup. Clean stop after "proteins". |
| "Right where the ribosome checks the amino acid is correct." | Slow down noticeably. This is the mechanism sentence — the thing the viewer is meant to repeat tonight. Stress "checks". |
| "In the dish, it makes fewer mistakes." | Short, clipped, almost thrown away. "In the dish" is a scope marker, not a throat-clear — say it, do not swallow it, and never drop it in a pickup. Let the silence after it sit for ~0.4s. |
| "Put that break into E. coli, and its errors halve." | Slight rise into "halve", then stop hard. No trailing inflection. Pronounce "E. coli" as *ee-coal-eye* — `AVATAR_SCRIPT.md` spells it `ee-coli` so the TTS engine does not read it as the letter E. |
| "The one deep-sea octopus they checked didn't have it." | Drop volume slightly — this is an aside, and the drop makes it feel like one. Do not lean on "one" as if it were a weakness; read it as a plain fact about the study. |
| "Nobody's proven that's why octopuses are clever. But the break follows the brains." | The most important read in the video. Say "nobody's proven" plainly and without apology — it is not a hedge, it is the interesting part. Then a real pause before "But", and land "follows the brains" with quiet confidence. |

**Do not:** add breath-y emphasis, upward "influencer" inflection, or any pause longer than 0.5s. There is no room.

---

## Music brief

**Reference feel:** sparse, low-BPM electronic underscore — sub-bass pulse plus a single sustained pad, the sort of thing that sits under a science documentary title card rather than a trailer.

- **0.0–5.5s:** sub-bass pulse only, roughly 2 hits, plus a single low drone. Deliberately under-scored so the hook carries on voice alone.
- **5.5–17.1s:** pad enters, slow harmonic movement, no percussion beyond the pulse. Builds by density, not volume.
- **17.1s:** one filtered impact on the cut to the bacterial culture, landing exactly with the `2×` numeral. This is the only transient hit in the track.
- **17.1–24.3s:** everything strips back to the drone. The deep-sea shot should feel acoustically emptier than what preceded it.
- **24.3–30.0s:** pad returns underneath, resolving on a single held chord that decays past the last frame rather than ending on it.

**Mix:** music sits at −18 to −20 LUFS under VO; ducks 4 dB on every VO line. Master to −14 LUFS integrated, true peak −1 dBTP. **No whoosh transitions.** One low sub-drop is permitted on the 17.1s cut and nowhere else.

---

## Caption style

- Burned-in, always on — this plays muted by default and the kinetic type is the primary read.
- The on-screen text column in SCRIPT.md **is** the caption layer. Do not additionally run a word-by-word auto-caption track; two competing text systems on screen is the single fastest way to make this look generic.
- Condensed grotesque, all caps, heavy weight, tight tracking. Amber (#E8933A-ish) on dark, except shot 7 which is cold white by design.
- Safe area: keep all type between 12% and 78% of frame height. Nothing in the bottom 22% (platform UI) or top 12%.
- Maximum two lines on screen at once, maximum six words total. If a line needs a third row, cut a word instead.

---

## Edit notes

- **Cut discipline:** seven cuts in 30 seconds, all on the beat. Shot lengths are derived from their own VO lines (see the runtime check in `SCRIPT.md`) — they are not a uniform grid, and evening them out will break a line. Shots 1→2 and 3→4 are *not* cuts — they are continuous camera moves, and that continuity is what sells the zoom-from-animal-to-molecule structure. Do not insert cuts there to raise the pace.
- **The 17.1s cut is the spine of the edit.** It's the only tonal break — warm organic to cold clinical — and it should feel abrupt. Do not soften it with a dissolve.
- **Shot 6 must be completely static.** Camera, type, everything. In a piece where every other frame is moving, stillness is what makes the statistic register as evidence.
- **Colour:** grade all eight shots to one LUT so the CG molecular shots and the live footage share a single film. Match grain across the cut at 6.5s especially — that's where the seam is most visible.
- **The fracture motif** (draws in shot 1, breaks in shot 2, heals in shot 8) is the only recurring graphic element. Resist adding any other motif; the type is already carrying a lot.
- **The closing shot runs 24.3–30.0s — 5.7s, the longest in the piece.** That length is deliberate: the line needs 5.2s plus the mandated pause before "But". If the edit runs long anywhere, take it from shots 3–7, never from here.
- **Last frame holds on `NOT PROVEN. BUT IT TRACKS.`** with the healed fracture. Hard cut to black on 30.0s, no fade — the loop back to the octopus in shot 1 should be seamless if the platform auto-repeats.
- **Do not add** an end card, a subscribe animation, or a "follow for more" tag. The last line is the payoff; anything after it steps on it.

---

## Thumbnail concept

Extreme close-up of a single octopus eye, filling most of the frame, warm amber skin against near-black water. A single hairline white fracture line runs vertically across the frame, passing beside the eye — not through it — with a faint amber glow along its edges. High contrast, dark enough that the fracture line is the brightest thing in the image.

**Thumbnail text (3 words):** `BROKEN ON PURPOSE`

Set bottom-left, heavy condensed caps in amber, angled to nothing (flat), sitting entirely in the black negative space so it never overlaps the animal. The fracture line and the type are the only two bright elements — they should read at 120px wide.
