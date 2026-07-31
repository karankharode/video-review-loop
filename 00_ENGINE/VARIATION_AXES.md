# Variation Axes

The failure mode of any batch generator is five videos that are the same video wearing different hats. This file exists to prevent that.

**Rule: within one batch, no two variations may share a value on Axis A, and they must differ on at least two of the remaining axes.**

---

## Axis A — Emotional register (the "what does the viewer feel" axis)

This is the primary axis. One variation per register, max.

| Register | The feeling | What it looks like |
|---|---|---|
| **Learn** | "I didn't know that." | A concrete mechanism explained. The viewer leaves with a fact they can repeat at dinner. |
| **Dream** | "Imagine if." | A near-future scene rendered vividly. The viewer leaves picturing themselves in it. |
| **Warn** | "Wait, is this happening?" | A real trend with a consequence they haven't connected yet. Never fearmongering — the warning must be true and actionable. |
| **Recognise** | "That's literally me." | Names an experience the viewer thought was theirs alone. |
| **Astonish** | "That can't be real." | A single almost-unbelievable true fact, held up and turned around. |

Karan's stated brief — *"they will learn something or at least dream about something"* — means **Learn and Dream must both appear in every batch of 5.**

---

## Axis B — Narrative structure

- **Countdown** — "Three things about X." Numbered, fast, save-bait.
- **Single-thread explainer** — one idea, start to finish, no list.
- **Reveal** — build a wrong assumption, then break it at ~60%.
- **Story** — one named person or moment, told as a scene.
- **Direct address / rant** — talking to camera, argument-shaped, opinionated.
- **Then vs now** — before/after, split-screen logic.

## Axis C — Visual mode

- Talking head + b-roll cutaways
- Full b-roll with VO (no face)
- Screen recording / UI walkthrough
- Text-on-motion (kinetic typography over footage)
- AI-generated cinematic scene sequence
- Split screen or side-by-side comparison

## Axis D — Hook mechanism

- Cold fact stated flat, no setup
- Uncomfortable question to camera
- Contradiction of a common belief
- Result shown first, method withheld
- Mid-action open ("...and that's when they realised")
- Direct callout of the viewer's situation

## Axis E — Length

30s / 40s / 50s / 60s. At least two different lengths per batch.

---

## Timing gate — mechanical, run on every script before it leaves the pipeline

Added 2026-07-30 after the first batch shipped three of five scripts that were physically undeliverable at their stated length.

For every row: `spoken_words ÷ wpm × 60` must be ≤ the slot, **plus** any pause the render notes mandate. Then check the total against the stated length.

This is arithmetic, not judgement, and it is the single most common defect. Watch for:

- **Spelled-out numerals.** "396" is five spoken words. "4,500" is five. A row that looks short on the page can be 40% over.
- **Mandated pauses.** A render note saying "real pause before this line" is time. Count it.
- **The closing line.** Overruns concentrate at the end, which is exactly where the payoff lives. A final line that only fits when rushed is a video with no ending.

If a script is over: cut from the middle rows, never from the payoff. If the payoff itself is too long, the script is too long — cut elsewhere to make room for it.

---

## Differentiation check (run before delivering a batch)

Fail any of these and the batch is rewritten, not shipped:

1. Are all five Axis A registers distinct? Are Learn and Dream both present?
2. Do any two variations open with the same first word? → rewrite
3. Could any two variations be cut from the same footage? → they're not differentiated
4. Read the five hooks in a row. Do they sound like five different people made them?
5. Does each one pass "would a stranger stop scrolling *without sound*"?
6. Does each one leave the viewer with either a fact they can repeat or an image they can picture? If neither — cut it.

---

## Anti-slop rules (apply to every track)

- Never open with "Did you know", "Here's the thing", "Let me tell you", "In this video"
- Never use: unlock, game-changer, revolutionise, level up, dive in, in today's world, the future is here, mind-blowing
- No stat without a source in the script file. Unverifiable → mark `[NEEDS SOURCE]` and flag it in delivery
- No fabricated quotes, user numbers, or testimonials — ever
- The payoff must be earned by the end of the video, not deferred to a link
