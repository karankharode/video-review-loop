# Five Minutes, One Prompt — building animated sites with Opus 5

**Track:** SAI · **Pillar:** Build in Public · **Audience:** builders, founders, dev-curious students
**Format:** Reel / Short, faceless, v2 engine · **Target:** ~45s · **Slug:** `sai_opus_websites`

> Describe it. Run it. Give notes. The loop, not the tool.

---

## ⚠️ Read this before publishing

**This video makes process claims about your own workflow, not sourced external
facts.** That is a different accuracy problem from the other two variations in
this batch, and it needs your sign-off rather than mine.

| Claim as spoken | Status | What you need to do |
|---|---|---|
| "I built this scrolling site in five minutes." | **Yours to verify** | Time an actual run before posting. If it took twelve minutes, say twelve — the specific number is the credibility, and it is trivially falsifiable by anyone who tries it. |
| "One tool. Claude Opus five, in the terminal." | ✅ Accurate | Claude Code runs Opus 5 in the terminal. |
| "It opens a browser, sees what's broken, and fixes it." | ✅ Accurate | Claude Code has browser tools — it can navigate a local dev server, read the page, screenshot it, and iterate. This video was itself made in that loop. |
| "Paste the palette. Two lines. Done." | **Yours to verify** | True in my experience of the workflow; check it matches yours. |
| "It will not guess your brand colours." | ✅ Fair | Reasonable and non-specific. |

**No invented numbers.** No user counts, no "10x faster", no benchmark. The only
quantity in the script is the five minutes, and that one is yours to stand behind.

**The b-roll is stock, and it is the weak point of this cut.** A video called
"here's the prompt" that never shows a screen is asking for a comment saying so.
Every beat here would be stronger with an actual screen recording of the run.
See *Upgrade path* below — the swap needs no timeline edit.

---

## Axis placement (see `00_ENGINE/VARIATION_AXES.md`)

| Axis | This video | `sai_ai_interviewer` | `sai_stage_fright` |
|---|---|---|---|
| **A — Register** | **Dream** — "imagine if" | Warn / Reveal | Recognise |
| **B — Structure** | Countdown (three steps) | Reveal | Single-thread explainer |
| **C — Visual** | Full b-roll + kinetic type | Same | Same |
| **D — Hook** | Result shown first, method withheld | Contradiction | Names the pain |
| **E — Length** | ~45s | ~45s | ~49s |

Three distinct Axis A registers across the batch. `Learn` and `Dream` both now
appear, which `VARIATION_AXES.md` requires. Opening words: "The" / "Nobody" /
"I" — no collision. No shared footage: offices, auditoriums, terminals.

---

## The hook, against the promise rule

> **"I built this scrolling site in five minutes. Here's the prompt."**
> On-screen: `5 MINUTES. ONE PROMPT.` · Reverse whoosh on frame 1 · scrolling site in motion

Cover everything after three seconds. What remains is a **result plus a debt** —
the prompt is owed and not yet delivered. That is the test in
`VARIATION_AXES.md`, and it is what the previous two hooks failed: both stated
something true and complete, so there was nothing to wait for.

The loop closes at `run` / `fixes` (the step people skip), not at the end card.

---

## Timing gate

123 spoken words across 14 beats, at **pace 1.15** and **temperature 0.95** —
both raised from the earlier variations. Estimate ~45s; the real number is
whatever `assets/beats.json` measures.

If it lands long, cut `why2` and `caveat`. Never cut `run` or `fixes` — that
pair is the payoff the hook promised.

---

## Shot table

*Times are read back from `assets/beats.json` after forced alignment.*

| Beat | Say | Caption | Grade | Graphic |
|---|---|---|---|---|
| `hook` | I built this scrolling site in five minutes. Here's the prompt. | 5 MINUTES. ONE PROMPT. | accent | — |
| `what` | Animated sections, scroll triggers, hover states. No template. | NO TEMPLATE | cool | — |
| `tool` | One tool. Claude Opus five, in the terminal. | OPUS 5, IN THE TERMINAL | accent | — |
| `step1` | Step one. Describe the feeling, not the layout. | FEELING, NOT LAYOUT | cool | steps |
| `why1` | Say cinematic. Say editorial. It picks the type and the spacing. | "CINEMATIC" · "EDITORIAL" | cool | transcript |
| `step2` | Step two. Name the scroll behaviour out loud. | NAME THE SCROLL | cool | — |
| `why2` | Sections that fade up. A header that shrinks. | FADE UP · SHRINK | cool | — |
| **`step3`** | Step three, and this is the one people skip. | THE STEP PEOPLE SKIP | dark | — |
| **`run`** | Ask it to open the page and look at it. | ASK IT TO LOOK | accent | waveform |
| **`fixes`** | It opens a browser, sees what's broken, and fixes it. | IT SEES WHAT'S BROKEN | warm | — |
| `notes` | You are not writing code. You are giving notes. | YOU'RE GIVING NOTES | warm | versus |
| `caveat` | It will not guess your brand colours. | IT WON'T GUESS | cool | — |
| `fix` | Paste the palette. Two lines. Done. | PASTE THE PALETTE | warm | — |
| `close` | Five minutes to a first version you can react to. | SOMETHING TO REACT TO | warm | endcard |

**`step3`** is the retention beat. **`run`** is the held beat — nothing under it.
**`fixes`** is the turn; the grade warms and stays warm.

---

## Sound

Bed: **"Killing Time"** — Kevin MacLeod, CC BY 4.0, window from 45s. Chosen by
measurement: at matched loudness it puts **11 dB less energy in the 300–3400 Hz
speech band** than every other bright/driving candidate, and that window has the
flattest loudness range in the shortlist (LRA 2.0). Bright and grooving at
100 bpm, so it carries momentum without arguing with the voice.

`bedLufs -30` — the new engine default, four decibels quieter than the previous
cut's bed.

**The credit is required by CC BY.** See `POSTING.md`.

---

## Upgrade path — replace the stock with a real screen recording

The strongest version of this video shows the actual run. The engine is built for
that swap:

1. Record the terminal + browser session at 1080×1920 (or crop to it).
2. Drop clips into `assets/stock/` named for the beat: `tool.mp4`, `run.mp4`,
   `fixes.mp4`, `fix.mp4`.
3. `node bin/build.mjs <this folder> --skip-stock` — the fetcher is skipped, your
   files are used, and **no timeline edit or re-alignment is needed**.

The four beats above are the ones where stock is doing the least work.

---

## Virality check

1. **Stops a scroll without sound?** Yes — `5 MINUTES. ONE PROMPT.` over motion.
2. **Worth saving?** Yes — three named steps, repeatable.
3. **Worth sending?** Yes, to anyone who has said "I can't design".
4. **Feels recognised?** "You are not writing code, you are giving notes" names
   what the workflow actually feels like.
5. **One clear next action?** Describe the feeling, name the scroll, ask it to run.
