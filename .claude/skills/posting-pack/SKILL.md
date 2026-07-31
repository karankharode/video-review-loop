---
name: posting-pack
description: Write or refresh the complete posting pack for one or more finished videos — platform-specific copy for every social and community, hashtags, thumbnail pick, posting notes, and the claims not to make. Use when Karan says "posting pack", "write the copy", "captions for these", "get these ready to post", or names videos to publish.
---

# Posting pack

Produce a complete, copy-paste-ready `POSTING.md` for selected videos. This runs
**on demand**, not as part of the build — copy is written once a cut is final,
and rewriting it on every render would waste the effort.

---

## Step 1 — Pick the videos

If the user named them, use those. Otherwise show the recent runs and ask which:

```bash
sed -n '1,40p' 05_OUTPUTS/INDEX.md
```

Accept a variation slug (`sai_stage_fright`), a date, or "the last two". A
variation folder is `02_BATCHES/<date>/<slug>/`.

**Do not write a pack for a video that has not been delivered.** If there is no
`MANIFEST.md` in the folder, the cut is not final — say so and stop.

## Step 2 — Read the video, don't guess at it

For each selected variation, read in this order:

| File | What you need from it |
|---|---|
| `MANIFEST.md` | duration, measured loudness, SFX cues, **music licence and whether a credit is required** |
| `SCRIPT.md` | the fact-check table with source URLs, the axis placement, the caption draft |
| `script.json` | every beat's `say` and `caption` — the actual spoken argument |
| `assets/music/ATTRIBUTION.md` | the exact credit line, if the licence demands one |
| `01_BRANDS/<track>/BRAND.md` | voice, and the sayable/never-sayable product claims |

Then look at the stills (`still_*.png`) before picking a thumbnail. Pick from
what is actually on screen, not from what the script says should be.

## Step 3 — Write the pack

Write to `02_BATCHES/<date>/<slug>/POSTING.md`, overwriting any previous one.

Every section below is required. Copy must be final — no placeholders, no
"[insert hook here]". If a number would strengthen a line and you do not have a
sourced one, leave the line out rather than inventing it.

### Required sections

**1. Header** — file name, duration, measured LUFS, track, pillar.

**2. Instagram Reels / Facebook**
Caption in the brand voice. Open with the single most arresting line — the first
two lines are all that shows before "more". Then the substance, then a soft CTA
(save / try it / send to someone), never a hard sell. Hashtags go in a **first
comment**, not the caption, and are listed separately here.

**3. YouTube Shorts**
Title ≤60 characters, front-loaded with the searchable term. Description with two
lines of value, then **source URLs**, then three keywords placed naturally.

**4. LinkedIn**
Genuinely re-pitched, not the Instagram caption with hashtags removed. Lead with
the professional consequence. No emoji. Longer sentences are fine here.

**5. X / Twitter**
A single post under 280 characters that stands alone, plus an optional 3-tweet
thread version for the same material.

**6. WhatsApp / Telegram broadcast**
Two or three lines someone would actually forward. No hashtags. This is how most
Indian student audiences actually share things — do not skip it.

**7. Communities** — for each that fits the topic, with its own framing:
- **Reddit** — name the specific subreddits, and write a title in that
  subreddit's register. Reddit punishes marketing copy; lead with the finding,
  not the video. Note where self-promotion is against the rules.
- **Discord / Slack communities** — one-line share plus the hook.
- **Quora / forums** — only when the video answers a question people actually
  ask; give the question to answer.

Skip any community that genuinely doesn't fit and say why in one line. A forced
placement is worse than none.

**8. Thumbnail / cover frame**
Name a specific `still_*.png` and justify it in one line — legibility at
thumbnail size beats prettiness. Give one alternative. Cover text ≤4 words.

**9. Posting notes** — the operational advice. Cover at least:
- Best posting window for the audience, with a reason
- What to pin as a first comment
- The likely objection or reply, and the honest answer to have ready
- Anything about the first three seconds that affects the upload (cover frame
  selection, whether it survives autoplay-muted)
- Cross-posting order if one platform should lead

**10. Do not claim**
The specific over-claims this topic invites, in the user's own words. Include
brand claim limits from `BRAND.md` and any stat deliberately left out of the
script, with the reason.

**11. Attribution**
Whether a music credit is **required** or merely requested — read this from
`MANIFEST.md`, do not assume. If required, give the exact line and say it goes in
the description on every platform. Note stock and SFX separately.

---

## Voice rules

Follow `01_BRANDS/<track>/BRAND.md`. For SAI that means second person, Indian
context by default (viva, placements, GD, HR round), confidence-first framing,
concrete numbers over adjectives, and never shaming the reader's English.

Banned across all copy: "unlock", "game-changer", "revolutionise", "level up",
"dive in", "in today's world". No emoji in LinkedIn copy; at most one elsewhere.

## Accuracy

Every factual claim in the copy must already exist in `SCRIPT.md` with a source.
Copy is not a place to introduce a new claim — if it is not in the fact-check
table, it does not go in the caption. Source URLs belong in the YouTube
description and the pinned comment.

## Finish

Tell the user which files you wrote, the thumbnail you picked and why, and flag
anything that needs their judgement — a community you were unsure about, a claim
you softened, or a required credit line they must not drop.
