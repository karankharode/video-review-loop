# Engine Config

Single source of truth for the daily run. Verified working 2026-07-30.

---

## Tracks

Two independent tracks. Never mix their knowledge bases, voices, or topic pools.

| Track | Folder | What it is |
|---|---|---|
| `SAI` | `01_BRANDS/SAI/` | SAI-branded content — English confidence, NCERT, placements, workplace comms, build-in-public. News topics get bent toward this audience. |
| `NEWS` | `01_BRANDS/NEWS/` | General knowledge/news channel. No product tie-in. Broad "you learn something or you dream about something" content. |

Daily default split: **3 NEWS + 2 SAI**. Adjustable per run.

---

## Verified Apify actors

### Google News — `data_xplorer/google-news-scraper-fast`
Verified: 31s run, 5 items, 99.6% historical success.

```json
{
  "keywords": ["artificial intelligence"],
  "maxArticles": 25,
  "timeframe": "1d",
  "region_language": "IN:en",
  "extractDescriptions": true,
  "decodeUrls": true
}
```

Returns: `title, url, source, publishedAt, publishedTimestamp, image, description`

Use `region_language: "IN:en"` for SAI track, `"US:en"` for NEWS track (wider/global framing).

### Reddit — `harshmaur/reddit-scraper`
Verified: 30s run, 97% historical success. **This is the virality signal source.**

```json
{
  "subredditUrls": ["https://www.reddit.com/r/technology/"],
  "searchSort": "top",
  "searchTime": "day",
  "maxPostsCount": 25,
  "crawlCommentsPerPost": false,
  "fastMode": true
}
```

> **Gotcha, found the hard way on 2026-07-30:** `maxPostsCount` is a **global** cap, not per-subreddit. Passing 4 subreddit URLs with `maxPostsCount: 40` returned 40 posts from the *first* subreddit only, and silently nothing from the other three. It does not error — it just quietly starves whichever track depends on the later URLs.
>
> **Always run one call per subreddit**, or set the cap to `n_subreddits × desired_per_sub` and verify the `communityName` spread in the results before scoring. Check the spread every run; do not assume it.

Key fields for scoring: `score`, `scorePerHour`, `commentsPerHour`, `commentToScoreRatio`, `engagementTotal`, `isHighEngagement`, `upvoteRatio`, `ageHours`, `title`, `postUrl`, `communityName`

`scorePerHour` is the one that matters — raw score just rewards old posts.

### Subreddit rotation

**NEWS track:** r/technology, r/science, r/Futurology, r/space, r/todayilearned, r/Damnthatsinteresting, r/interestingasfuck, r/Economics, r/artificial

**SAI track:** r/india, r/developersIndia, r/IndianWorkplace, r/JEENEETards, r/careerguidance, r/cscareerquestions, r/Btechtards

Pull 3–4 subreddits per track per run, rotating so the pool doesn't stagnate.

---

## Run parameters

- 5 variations per day, scheduled 07:00 local
- Batch lands in `02_BATCHES/YYYY-MM-DD/`
- Every variation must sit on a different **variation axis** (see `VARIATION_AXES.md`)
- No topic may repeat within 30 days — check `03_TOPICS/USED_TOPICS.md` before writing
- No hook pattern may repeat within a single batch

---

## Render stage

Scripts are generated first, review is on scripts, and **only greenlit variations get rendered**. Rendering all 5 blind burns credits and review time on scripts that were dead at the hook.

Each variation ships with a complete render package so rendering is mechanical:
- `SCRIPT.md` — hook, shot table, VO, on-screen text, caption
- `AVATAR_SCRIPT.md` — the clean spoken script for the avatar tool: continuous VO text with pause and emphasis marks, no table formatting, nothing the TTS engine would read aloud by mistake
- `BROLL.md` — per-shot generation prompts with explicit durations (via the `video-prompt-builder` skill) for the cutaway footage layered over the avatar
- `RENDER.md` — avatar + voice selection, pacing notes, music brief, caption style, edit notes, thumbnail concept

**Render stack:** Sarvam (voice) + open-source lip-sync + free stock b-roll + FFmpeg. No paid SaaS.

**Presentation mode:** mixed. Default faceless/avatar; at most 1 of 5 per batch may require Karan on camera. See `01_BRANDS/NEWS/BRAND.md`.

### The stack

| Layer | Tool | Cost | Notes |
|---|---|---|---|
| **Voice** | Sarvam **Bulbul v3** | ₹30/10K chars, ₹1,000 free credits | 30+ voices, built for Indian languages and accents. 2,500 char limit per request — a 60s script is ~900 chars, so one call per video. |
| **Lip-sync** | **LatentSync** (Apache 2.0) or **MuseTalk** (MIT) | Free | LatentSync = better visual fidelity, holds at 720p+. MuseTalk = faster, real-time capable. Both permit commercial use. |
| **B-roll** | Pexels + Pixabay APIs | Free | First choice. Instant, legal, no GPU. |
| **B-roll (generated)** | Wan 2.2 T2V-1.3B or LTX-Video | Free | Only when stock genuinely can't deliver the shot. Slow on free GPU. |
| **Stills / thumbnails** | FLUX.1-schnell (Apache 2.0) | Free | |
| **Captions** | Whisper (`whisper.cpp` runs on Apple Silicon) or Sarvam **Saaras v3** | Free / ₹30 per hour | Saaras for Indic and code-mixed audio, Whisper for English. |
| **Assembly** | FFmpeg | Free | Scripted, not manual. |
| **Music** | Incompetech (v2 engine), Pixabay Music, Free Music Archive, YouTube Audio Library | Free | Check per-track attribution terms. Incompetech is **CC BY — the credit line is required**, see below. |

#### Incompetech, and why it was added to this list

`00_ENGINE/v2/bin/fetch-music.mjs` searches Incompetech (Kevin MacLeod), which
was not on the original approved list. It was added because it is the only one
of these sources that publishes its **whole catalogue as JSON** —
`pieces.json`, 1442 tracks with title, feel, instruments, bpm, length and ISRC.
That turns "calm ambient, no vocals, low-mid energy" into a query the engine can
run and re-run, instead of a track somebody once picked by ear and can never
justify again. Pixabay's public API covers images and video but not audio; FMA's
API was retired; the YouTube Audio Library needs an interactive login.

The licence is **CC BY 4.0**: free for commercial use, **credit required**. That
is a stricter obligation than Pexels, which only requests attribution. The
credit line is written to `assets/music/ATTRIBUTION.md` at fetch time and has to
be copied into the video description on every platform the video is posted to.
Tracks whose `instruments` field mentions any kind of voice are filtered out
before scoring — a lyric competes with the VO for the same listening channel.

If you would rather stay strictly on the original three sources, drop the
`music` block from `script.json` and drop a bed in as
`<variation>/assets/music/bed.wav` by hand; everything downstream of the fetch
works the same way.

### ⛔ Do not use Wav2Lip

Its README prohibits commercial use — the models were trained on the LRS2 dataset. A brand channel posting monetisable content is commercial use. LatentSync and MuseTalk exist precisely to fill this gap and are licence-clean. This is not a grey area; do not let it creep back in because a tutorial recommends it.

### Compute

Lip-sync models are CUDA-heavy and will not run well on a Mac. Free options:
- **Kaggle Notebooks** — 30 GPU-hours/week, T4/P100, 9-hour sessions. Most reliable free tier.
- **Google Colab free** — 15–30 hours/week, T4, 12-hour sessions, less predictable availability.

30 hours/week is comfortably enough for 5 short videos a day. This is a notebook workflow, not one-click.

### What still needs setting

**Reference clip for the avatar:** `[NOT SET]`
LatentSync/MuseTalk re-sync the mouth on an *existing* video — they don't invent a presenter. So this needs one clean 30–60s clip of Karan: neutral expression, small natural head movement, even lighting, plain background, looking at camera, saying anything. Shot once, reused as the base for every faceless-track video afterwards.

This is better than a synthetic avatar for a personal brand — it's a real face, consistently, and it costs one afternoon.

**Locked Bulbul voice:** `[NOT SET — pick one speaker ID and keep it]`
Consistency matters more than picking the objectively best voice. A channel that changes presenter between videos never builds recognition.

### Cost reality

At 5 videos/day averaging ~600 characters of script:
- ~3,000 chars/day → ~₹9/day → **~₹270/month** in Sarvam TTS
- The ₹1,000 free credit covers roughly **3–4 months** before any spend

Everything else in the stack is £0. The real cost is setup time, not money.

---

## Cost note

Roughly $0.15–$0.40 per daily run in Apify credits at current pay-per-event rates (≈100 news items + ≈100 reddit items). Rendering cost is separate and depends on the tool above.
