# They Can't See It — stage fright

**Track:** SAI · **Pillar:** Confidence Building · **Audience:** Indian students and young professionals
**Format:** Reel / Short, faceless, v2 engine · **Target:** ~45s · **Slug:** `sai_stage_fright`

> The room was never the problem. Two published findings, one action, no pep talk.

---

## Axis placement (see `00_ENGINE/VARIATION_AXES.md`)

| Axis | This video | `sai_ai_interviewer` | Distinct? |
|---|---|---|---|
| **A — Register** | **Recognise** — "that's literally me" | Warn / Reveal | ✅ |
| **B — Structure** | Single-thread explainer → technique payoff | Reveal (wrong assumption broken at 60%) | ✅ |
| **C — Visual mode** | Full b-roll + kinetic type, faceless | Same | — |
| **D — Hook** | Names the pain, then contradicts it | Contradicts a common belief | ✅ |
| **E — Length** | ~45s | ~45s | — |

Differs on A, B and D — clears the "distinct on Axis A plus two others" rule.
Opening word is "Nobody"; `sai_ai_interviewer` opens on "The". No shared footage:
that video is cold blue offices and webcams, this one is stages, auditoriums and
sunrise.

---

## Fact check — every claim, with a source

| # | Claim as spoken | Status | Source |
|---|---|---|---|
| 1 | "Psychologists call this the illusion of transparency." | ✅ Established term | Savitsky & Gilovich, *The illusion of transparency and the alleviation of speech anxiety*, Journal of Experimental Social Psychology 39(6), 2003 — https://www.sciencedirect.com/science/article/abs/pii/S0022103103000568 |
| 2 | "Two psychologists tested it on live speeches." | ✅ Accurate | Same paper. Participants delivered impromptu speeches; speakers consistently overestimated how visible their nervousness was to observers. |
| 3 | "Speakers who were simply told this gave better speeches." | ✅ Accurate | Same paper. Informing speakers that their nervousness was less apparent than they believed both reduced their perception of looking anxious and improved speech quality. |
| 4 | "Rated by the audience. Not by themselves." | ✅ Accurate | Same paper — the improvement was found "not only in their own eyes, but in the eyes of observers." This is the load-bearing detail: self-report alone would prove nothing. |
| 5 | "Harvard research found a shorter trip." | ✅ Accurate | Alison Wood Brooks (Harvard Business School), *Get Excited: Reappraising Pre-Performance Anxiety as Excitement*, Journal of Experimental Psychology: General 143(3): 1144–1158, 2014. DOI 10.1037/a0035325 — https://pubmed.ncbi.nlm.nih.gov/24364682/ |
| 6 | "Say I am excited, out loud." | ✅ Accurate | Same paper — the intervention was exactly this: minimal self-talk, saying "I am excited" aloud, versus attempting to calm down. |
| 7 | "Same racing heart. Different story about why." | ✅ Accurate paraphrase | Same paper. Arousal is unchanged; reappraisal shifts a threat mindset to an opportunity mindset. |
| 8 | "They sang better, spoke better, scored higher." | ✅ Accurate | Same paper — the three performance domains tested were karaoke singing, public speaking and a maths task. |

**Deliberately not claimed.** No prevalence stat ("75% of people fear public
speaking" is endlessly repeated and poorly sourced — it is not in this script).
No claim that the technique cures anxiety. No SAI user numbers.

**Product claim check.** The end card says *"SAI hears what they hear — practise
out loud, get feedback on how you sound."* That is voice practice plus real-time
feedback on spoken answers, both on the sayable list in `01_BRANDS/SAI/BRAND.md`.
No grammar claim, no fluency-in-N-days promise.

---

## Timing gate

125 spoken words across 16 beats. At the 166 wpm this voice measured on
`sai_ai_interviewer`, that is **45.2s** against a 45s target. Sarvam is
non-deterministic, so the real number is whatever `assets/beats.json` says after
alignment — the shot table below is a readout, not an authored plan.

If it lands long: cut from `travel` and `same`, never from `say` or `close`.

---

## Shot table

*Times are read back from `assets/beats.json` after forced alignment. They are
not authored and will change if the voiceover is regenerated.*

| Beat | Say | Caption | Grade | Graphic |
|---|---|---|---|---|
| `hook` | Nobody out there can see your heart pounding. | THEY CAN'T SEE IT | cool | — |
| `inside` | You feel it from the inside. They only see the outside. | INSIDE vs OUTSIDE | cool | versus |
| `name` | Psychologists call this the illusion of transparency. | ILLUSION OF TRANSPARENCY | accent | — |
| `tested` | Two psychologists tested it on live speeches. | THEY TESTED IT | cool | — |
| `result` | Speakers who were simply told this gave better speeches. | TOLD = BETTER | cool | — |
| `rated` | Rated by the audience. Not by themselves. | BY THE AUDIENCE | accent | waveform |
| **`only`** | You are the only person in that room grading you. | THE ONLY ONE GRADING YOU | cool | — |
| `wrong` | Now here's the part everyone gets wrong. | THE PART PEOPLE GET WRONG | cool | — |
| **`calm`** | Trying to calm down. | "JUST CALM DOWN" | dark | — |
| `travel` | Calm is a long way from panic. Your body has to travel it. | PANIC → CALM IS FAR | cool | — |
| **`harvard`** | Harvard research found a shorter trip. | A SHORTER TRIP | warm | — |
| `say` | Say I am excited, out loud. | "I AM EXCITED" | warm | waveform |
| `same` | Same racing heart. Different story about why. | SAME HEART. NEW STORY. | warm | — |
| `better` | They sang better, spoke better, scored higher. | IT WORKED THREE WAYS | warm | meters |
| `practise` | Practise your first twenty seconds out loud, and listen back. | FIRST 20 SECONDS | warm | steps |
| `close` | The room was never the problem. | NEVER THE ROOM | warm | endcard |

**`only`** is the retention beat — the reframe. **`calm`** is the one dark beat
in a warm video. **`harvard`** is the turn; everything after it is warm.

---

## Sound

Bed: **"Lifted Up"** by Hartzmann (Pixabay Content License), window from 30s —
picked by measurement as the flattest stretch of the track with the least
speech-band energy. `-24 LUFS` in the master, ducked to the aligned speech
envelope.

SFX are scheduled by the engine from the timeline, capped at six cues. See
`00_ENGINE/SOUND_DESIGN.md` for why six and not one per cut.

---

## Virality check

1. **Stops a scroll without sound?** Yes — "THEY CAN'T SEE IT" over someone waiting backstage.
2. **Worth saving?** Yes — there is a technique with three words to remember.
3. **Worth sending to a friend?** Yes — this is the friend who dreads presentations.
4. **Feels recognised?** The hook names the exact private sensation.
5. **One clear next action?** Say "I am excited" out loud; practise the first twenty seconds.

---

## Caption

Your nerves are not as visible as they feel. Speakers in one study who were
simply told that gave measurably better speeches — judged by the audience, not
by themselves. And the fix isn't calming down. It's a shorter trip: say "I am
excited" out loud before you go up. Same racing heart, different story about why.

Practise your first twenty seconds out loud, then listen back once. That's the
whole drill.

#PublicSpeaking #StageFright #CommunicationSkills #InterviewPrep #StudentLife #SpeakingConfidence
