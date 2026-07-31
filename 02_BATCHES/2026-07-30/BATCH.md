# Batch — 2026-07-30

First live run of the engine. 5 variations, 3 NEWS + 2 SAI.
Knowledge base was empty at generation time, so nothing here is informed by your taste yet — this batch is what the engine produces cold. That's the baseline your feedback moves.

---

## Variation matrix

| # | Track | Topic | Register | Structure | Hook | Visual | Len | Mode |
|---|---|---|---|---|---|---|---|---|
| v1 | NEWS | 396 new earthworks found under the Amazon by lidar | **Astonish** | Reveal | Cold fact | AI cinematic | 39s | faceless |
| v2 | NEWS | Plant-protein plastics that biodegrade | **Dream** | Then vs now | Result first | B-roll + VO | 50s | faceless |
| v3 | NEWS | A broken octopus ribosome that works better | **Learn** | Single-thread | Contradiction | Kinetic type | 30s | faceless |
| v4 | SAI | Entry-level hiring vs. what employers actually screen for | **Warn** | Countdown | Uncomfortable question | Split screen | 44s | faceless |
| v5 | SAI | India's fresher hiring squeeze | **Recognise** | Direct address | Direct callout | Talking head | 58s | **Karan on camera** |

All five registers distinct, Learn and Dream both present, five structures, five hooks, five visual modes, five lengths, one on-camera. Differentiation contract passes.

---

## Loglines

**v1** — Airborne lidar stripped the canopy off 4,500 km² of Brazilian rainforest and found 432 earthworks, 396 of them never recorded. A civilisation the forest grew over.

**v2** — A wrapper made from plant protein that ends up as dirt. One square metre of it exists, on a bench. What happens if it scales.

**v3** — Octopus ribosomes are snapped in two, and the break is what makes them accurate. Nobody's proven that's why octopuses are clever.

**v4** — Employers still rank people skills above AI tooling, while entry-level seats shrink. The filter moved, and nobody practises for the thing it now tests.

**v5** — You've applied everywhere and started thinking it's you. Fresher hiring fell ~80% from FY22 to FY25. It's a market condition, not a character flaw.

---

## Needs shooting

**v5 only.** One shoot day:
- Two camera setups, talking head
- Five isolated takes of the line *"It's a market condition. Not a character flaw."* — this line carries the video and is locked against cutaways in the edit
- Six phone-shot cutaways (see `v5_fresher_squeeze/BROLL.md`, which is the authoritative timing file)
- Wardrobe must match any other on-camera piece shot the same week

v1–v4 are fully generatable, no shoot required.

---

## Critic pass — what was caught and fixed

A critic agent reviewed all five together. Every flag was fixed before this file was written.

**The one that mattered most:** v2's hook claimed "five days later, one banana is still yellow" — but the underlying test ran at 60°C. That caveat existed only in on-screen text and the caption. A caveat the viewer only sees is one most viewers never receive. The hook now speaks it: *"Five days at sixty degrees…"*

**Systemic defect found:** no script had been timed against its own words-per-minute. Three of five were physically undeliverable — v1 13% over, v3's closing line 50% over, v5 ~20% over on every row. All now recomputed and passing with slack. A mandatory timing gate has been added to `00_ENGINE/VARIATION_AXES.md` so this can't recur.

**Accuracy fixes:**
- v3 stated a whole-clade fact off a single specimen (n=1) and an in vitro result as a live-animal fact — both now hedged in the spoken audio, not just the fact-check table
- v4's headline stat was grammatically broken ("stopped hiring **them**" had no antecedent), misdated the Gartner survey (4Q25, published July 2026), and didn't say the sample was global while being captioned for Indian final-years
- v1's on-screen text asserted a build range that contradicted its own sources

**Tone fix:** v4 silently implied *fewer jobs → they judge how you talk → practise talking → get the job*. That syllogism is false and the line now says plainly: *"That's the market, not you."* v5 already refused that framing correctly.

**Craft note carried forward:** v1 and v3 both ended by matching their opening frame — the same authorial tic twice. v1's ending was changed. Worth watching for in future batches.

---

## Flags for you

- **Nothing is marked `[NEEDS SOURCE]`.** Every spoken claim in all five scripts traces to a named source, listed in each `SCRIPT.md` fact-check table.
- **v5's Times of India source could not be fetched** from this environment. Nothing is cited to it — every claim traces to Business Today (21 Mar 2026, citing Xpheno) instead. Worth a manual read before publishing.
- **v1 deliberately omits** the 1.25–3 million population estimate and the 183,000 km² extent. Both are sourced but both are modelled projections, and there was no room at 40s to mark them as estimates.
- **v4's SAI UI shot (0:35–0:40)** is a placeholder pending a real screen recording.
- **v4 is 44s**, which is off the standard 30/40/50/60 ladder. Flagging rather than silently normalising.

---

## Honest read on this batch

v5 is the best-written piece here and the only one that needed a structural cut rather than a trim. v4 is the tightest structurally — its hook question and closing line share a phrase and the loop closes cleanly.

The weakest is **v1**. Not badly made, but it's the most conventional thing in the batch — a lidar-reveal archaeology short is a format that already exists in volume, and its differentiation is coming from execution rather than from the idea. If you're going to kill one, that's the one, and knowing *why* you killed it would be more useful to the knowledge base than five greenlights.

The five hooks read as two voices, not five — v1/v2/v3 share a flat-declarative shape, v4/v5 share a second-person address. That maps to the two brands so it's defensible, but it shouldn't be recorded as a clean pass. Next batch should push one NEWS hook into a different grammatical shape.
