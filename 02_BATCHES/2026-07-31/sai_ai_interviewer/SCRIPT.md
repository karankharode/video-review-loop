# SAI — It's Not Watching Your Face

**Track:** SAI
**Pillar:** Interview + Placement Prep (entering on the *AI at work* bridge)
**Audience:** Final-year students and freshers facing AI video interviews in Indian campus placements
**Emotional register:** Recognise → Learn. Removes a fear, then replaces it with a mechanism.
**Structure:** Reveal — break the assumption at 0s, spend the rest paying it off
**Hook mechanism:** Contradiction of a common belief
**Visual mode:** Stock-led kinetic edit — 4K b-roll, word-locked captions, motion graphics
**Length:** 45.1s measured (YouTube Shorts / Reel)
**Engine:** `00_ENGINE/v2` — timings are derived from forced alignment, not hand-authored

---

## Sources

- **Fortune**, 19 Jan 2021 — "HireVue stops using facial expressions to assess job candidates amid audit of its A.I. algorithms" — https://fortune.com/2021/01/19/hirevue-drops-facial-monitoring-amid-a-i-algorithm-audit/ (**primary** — the removal, the audit, the client list)
- **SHRM** — "HireVue Discontinues Facial Analysis Screening" — https://www.shrm.org/topics-tools/news/talent-acquisition/hirevue-discontinues-facial-analysis-screening (corroborates removal; HR-industry record)
- **Center for Democracy & Technology** — "HireVue 'AI Explainability Statement' Mostly Fails to Explain What it Does" — https://cdt.org/insights/hirevue-ai-explainability-statement-mostly-fails-to-explain-what-it-does/ (the sceptical read — used to keep the script from overclaiming what the AI understands)
- **arXiv 2504.05683** — "Are Zero-Shot and Few-Shot Pre-trained LLMs Ready for HR Spoken Interview Transcript Analysis?" — https://arxiv.org/pdf/2504.05683 (peer-reviewable grounding that transcript/NLP analysis is the live research direction)

**Provenance of the 0.25% figure:** HireVue's own stated internal research, reported in the coverage above — nonverbal data contributed roughly a quarter of one percent of predictive power, which is why visual analysis was dropped. The script attributes it as *their* number, out loud, because it is a company self-report and not an independent finding.

---

## The one thing the viewer leaves with

The AI is not judging your face — it is reading your words, your structure and your filler. Your face is not trainable in a week. The shape of an answer is.

---

## Hook — first 3 seconds

**Spoken (7 words, well inside the ≤12 rule):**
> "The AI interview isn't watching your face."

**On-screen text at 0s (4 words, ≤6 rule):**
`NOT YOUR FACE`

### Alternates considered

| # | Spoken hook | On-screen | Why not chosen |
|---|---|---|---|
| B | "You've been practising the wrong half of the interview." | `THE WRONG HALF` | Strong Recognise energy, but it accuses before it informs. The viewer's first feeling should be relief, not "I've wasted my time." |
| C | "Your face is worth 0.25% of your AI interview score." | `0.25%` | The most arresting number in the piece, but leading with a decimal makes it feel like a statistics video. The number lands harder at 9s once the claim needs proof. |

**Why A won:** it contradicts something the viewer actively believes and is anxious about — that a camera is reading their expressions — and it does it in seven words with no setup. It buys the next fifteen seconds outright, because the only possible next thought is *"then what IS it doing?"*, which is exactly the script's spine.

---

## Shot-by-shot

Row times below are **measured, not authored.** `bin/align.mjs` transcribes the real voiceover with per-word timestamps and resolves each beat against it; this table is a readout of `assets/beats.json`. Re-record the VO and these numbers change on the next build.

| Time | Beat | Visual | Voiceover (exact words) | On-screen text |
|---|---|---|---|---|
| 0.0–2.3 | `hook` | Webcam POV — candidate lit by a laptop screen, slow push-in | "The AI interview isn't watching your face." | `NOT YOUR FACE` |
| 2.3–4.4 | `stopped` | Face-mesh / landmark overlay glitching out. Flash cut in. | "It stopped doing that in 2021." | `STOPPED IN 2021` |
| 4.4–7.2 | `hirevue` | Server rack, cool blue, slow dolly. Whip in. | "HireVue pulled facial scoring from its product." | `HIREVUE, 2021` + kicker `Fortune · Jan 2021` |
| 7.2–10.4 ~ | `quarter` | **Stat card.** `0.25%` counts up and stops hard. Zoom-blur in. | "Their own numbers: your face added a quarter of one percent." | `0.25%` |
| 10.4–12.2 | `whatscoring` | Whip-pan, waveform ignites | "So what is it scoring?" | `SO WHAT IS IT SCORING?` |
| 12.2–13.2 | `yourwords` | **Hold.** Full-frame waveform, flash cut. | "Your words." | `YOUR WORDS` |
| 13.2–16.4 | `shape` | Transcript builds line by line; weak vs strong answer marked | "Did you answer the question. Did your answer have a shape." | `DID IT HAVE A SHAPE` |
| 16.4–22.6 ~ | `paceum` | Meters fill: pace / hesitation / filler. Filler runs hot. | "And in a lot of setups, your pace, your hesitation, and every um." | `PACE · PAUSES · UM` |
| **22.6–25.4** | `mirror` | **Retention beat.** Mirror shot, zoom-blur in, motion settles. | "So the thing you've been rehearsing in the mirror isn't scored." | `NOT THE MIRROR` |
| 25.4–27.0 | `nobody` | Same frame, held. No cutaway. | "The thing nobody practises is." | `NOBODY PRACTISES IT` |
| 27.0–28.3 | `goodnews` | Light lifts — first warm grade in the video. Flash in. | "Which is the good news." | `THAT'S GOOD NEWS` |
| 28.3–31.9 | `trainable` | Face struck through vs an answer-structure stack assembling | "You can't train your face. You can train an answer's shape." | `SHAPE IS TRAINABLE` |
| 31.9–37.2 | `record` | Three numbered step cards land in sequence. Whip in. | "Pick one question. Record yourself answering it. Play it back once." | `RECORD ONE ANSWER` |
| 37.2–41.3 | `hearums` | Waveform with filler words marked in accent-2 | "You'll hear the ums before you hear anything else." | `YOU'LL HEAR THEM` |
| 41.3–44.1 | `close` | End card. Zoom-blur in, then hold. | "That's the part the machine is actually listening to." | `SAVE THIS` → `SAI scores spoken answers` |

Total: **45.06s** including a 1.0s tail hold.

`~` marks a beat whose boundary fell back to token count because whisper mistranscribed a word inside it — "percent" came back as "person", "um" as "arm". Only the *times* are consumed downstream (caption text comes from this script), so the mistranscription is invisible in the render; it just means those two boundaries are approximate to within a word.

---

## Timing gate

| | Authored estimate | **Measured** |
|---|---|---|
| Spoken words | 129 | 122 (whisper merged some contractions) |
| Rate | 150 wpm assumed | **175 wpm actual** |
| Speech time | 51.6s | **44.1s** |
| Tail hold | 1.0s | 1.0s |
| **Total** | ≈55.0s | **45.06s** |

**The authored estimate was wrong by 10 seconds, and the engine caught it automatically.** This is the point of v2: the paper arithmetic assumed 150 wpm; Sarvam actually delivered 175 wpm on this script. In v1 that error would have surfaced as captions drifting further out of sync with every beat, discovered only by watching the render. Here the gate reports it as a number before anything is rendered.

45s is a good Shorts length, so no cut was needed — `targetDuration` was corrected to 45 rather than the script being padded. Had it run *long*, the fix would be cutting words, never raising `voice.pace`.

**A note on pace.** `voice.pace` is 1.0, deliberately. An earlier pass at 1.25 measured ~200 wpm, which reads as an advert. v1 used 1.25 legitimately — but only because its VO was a disposable stopwatch for on-camera delivery. Here the VO *is* the deliverable, so it gets the natural rate.

**Protected, do not cut:**
- **"Your words."** at 17.0s — a 2-word held beat. It's the answer to the question the hook posed, and it needs the silence around it.
- **The retention beat at 29.6–34.0s.** No cutaway. This is where the viewer reframes their own preparation.
- **The 0.25% attribution.** It must stay "their own numbers" — see fact-check.

---

## YouTube Title
AI interviews don't score your face — here's what they do

## Description
HireVue removed facial analysis from its screening product in 2021 after its own research found nonverbal data added roughly 0.25% of predictive power. What's scored is verbal: whether you answered the question, whether the answer had structure, and in many setups your pace and filler words. Your face isn't trainable in a week — the shape of an answer is. Record one answer and play it back once.

`AI interview` `campus placement` `interview preparation`

## Caption
The AI interview isn't reading your face. HireVue pulled facial scoring from its product in 2021 — their own research found expressions added about a quarter of one percent to the prediction, which isn't worth the bias risk.

What it reads instead: your words. Did you answer the actual question. Did the answer have a shape. And in a lot of setups — your pace, your pauses, and every "um".

Which is genuinely good news. You cannot train your face in a week. You can absolutely train the shape of an answer.

Pick one question you know is coming. Record yourself answering it on your phone. Play it back once — you'll hear the filler before you hear anything else.

SAI gives real-time feedback on spoken answers and scores interview practice, if you want a second opinion on how you sound.

Save this for the night before.

#AIInterview #CampusPlacement #InterviewPrep #Placements #Freshers #SAI

---

## Fact-check

| Claim in script | Source | Confidence |
|---|---|---|
| "The AI interview isn't watching your face." | Fortune 2021 + SHRM — facial-expression analysis removed from HireVue's assessments | High **for HireVue**. See scoping note below. |
| "It stopped doing that in 2021." | Fortune, 19 Jan 2021 announcement (internally disabled March 2020) | High |
| "HireVue pulled facial scoring from its product." | Fortune + SHRM, named explicitly | High |
| "Their own numbers: your face added a quarter of one percent." | HireVue self-reported internal research, as reported by Fortune | High **as an attributed company claim.** The script says "their own numbers" out loud so it is never mistaken for an independent finding. |
| "Did you answer the question. Did your answer have a shape." | NLP transcript scoring on relevance, structure and clarity — reported across the coverage and consistent with the arXiv work on HR transcript analysis | Medium-High — plain-language description of documented behaviour, no metric claimed |
| "your pace, your hesitation, and every um" | Widely reported that many configurations score speaking pace, filler words and hesitation | Medium — hedged in the script with **"in a lot of setups"**, not stated as universal |
| "You can train an answer's shape." | Editorial claim, framed as advice, not a product or research claim | High as opinion |
| SAI scores spoken answers / real-time feedback | Product truth per `01_BRANDS/SAI/BRAND.md` sayable list | High |

**Scoping note — the one real weakness, handled deliberately.** The sourced facts are about **HireVue specifically**. The script's hook generalises to "the AI interview". That is a genuine over-reach if left bare, so the script names HireVue out loud at 6.2s, third line in, before any general claim is built on it. The on-screen text `HIREVUE, 2021` reinforces it. If you want it airtight, change the hook to "Your AI interview probably isn't watching your face" — it costs one word and a little bite.

**Deliberately not used:**
- **Bias and accent risk in paralinguistic scoring** — real, documented, and the single most important caveat in this space. Cut for two reasons: it needs 10–12s to state responsibly and the slot doesn't have it, and stating it badly ("the AI is biased against your accent") would both scare the viewer and violate `BRAND.md`'s rule against shaming or frightening the viewer about their English. It deserves its own video, not a clause in this one.
- The CDT critique that HireVue's explainability statement doesn't really explain the system. It's the honest sceptical counterweight, and it's why the script never claims the AI *understands* the answer — only that it scores words rather than faces.
- Vendor-blog statistics ("87% of companies use AI to screen", "5,000 applications → 5 shortlists"). These surfaced repeatedly in search and are **marketing content, not journalism**. Excluded under the `BRAND.md` accuracy standard.

**Nothing in this script is marked [NEEDS SOURCE].**

---

## Virality check (Step 6 of the SAI script engine)

| # | Check | Result |
|---|---|---|
| 1 | Stops a scroll without sound? | Yes — `NOT YOUR FACE` over a webcam-POV frame, legible in one frame |
| 2 | Would someone save it? | Yes — the record-one-answer instruction is the save trigger |
| 3 | Would someone send it to a friend? | Yes — it removes a specific, widely-held anxiety about placements |
| 4 | Feels recognised? | Yes — "the thing you've been rehearsing in the mirror" names the actual behaviour |
| 5 | One clear next action? | Yes — pick one question, record it, play it back once |

**Hook-pattern collision:** no other SAI script in this batch or the 2026-07-30 batch opens with a contradiction of a belief, and no opening word is shared.

## Topic collision check

| Prior | Substance | Collides? |
|---|---|---|
| v4 (2026-07-30) — employers rank people skills above AI tooling | *What employers value* | No — different question |
| v5 (2026-07-30) — IT fresher hiring squeeze | *How many jobs exist* | No — volume, not evaluation |
| **This** | *What the evaluator actually measures* | Distinct |
