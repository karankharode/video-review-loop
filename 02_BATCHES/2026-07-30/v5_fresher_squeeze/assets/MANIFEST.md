# Assets — v5 Fresher Squeeze (Kallaway)

Licence rule: **free only** (Pexels / Pixabay) or **AI-generated** stills. No paid libraries. No company logos on screen.

## Layout

```
assets/
  stills/     # top-panel plates (1080-wide documentary stills)
  face/       # hook.mp4, market.mp4, close.mp4 — swap your real takes here
  broll/      # optional full video clips for future denser cuts
  sfx/        # optional whoosh / text-pop (unused in v2 stock preview)
```

## Face plates (drop-in)

| File | Slot | Duration needed |
|---|---|---|
| `face/hook.mp4` | 0–6.0s | ≥6s usable |
| `face/market.mp4` | 23.3–32.7s | ≥10s usable |
| `face/close.mp4` | 56.2–60.0s | ≥5s usable |

Current files are **AI photoreal stand-ins** (static + Ken Burns). Replace with your recordings; keep the same filenames. Re-run:

```bash
MODE=kallaway ./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze
```

## Stills map

| File | Beat | Source / search |
|---|---|---|
| `stills/counter_plate.png` | hiring counter bg | office glass / tech park exterior (desaturated) |
| `stills/applications.png` | dead application list | laptop job portal + painted status rows |
| `stills/offer_letter.png` | seven months | **generic** offer template — no logo |
| `stills/calendar.png` | joining date move | phone calendar still |
| `stills/empty_desk.png` | silence / lean bench | empty office desk |
| `stills/office_glass.png` | smaller bench | glass office exterior |
| `stills/locked_hold.png` | market-condition hold | empty chairs — locked, no cut chaos |
| `stills/empty_chairs.png` | something changed | interview waiting chairs |
| `stills/closed_door.png` / `one_door.png` | fewer roles / one conversation | corridor / closed door |
| `stills/three_questions.png` | pick 3 | notebook with three lines |
| `stills/voice_memo.png` | say / record / listen | phone recorder UI mock |
| `stills/save_bait.png` | close top plate | same notebook save frame |

## Pexels / Pixabay search queries (refresh later)

- `empty office chairs corridor`
- `hands typing laptop night`
- `closed office door hallway`
- `phone calendar close up`
- `notebook writing desk top down`
- `glass office building reflections India` (or generic city glass)
- `young professional talking to camera` — only if replacing AI face stand-ins with stock (prefer your face)

## Hard bans

- Company logos / letterheads / Naukri-LinkedIn chrome that identifies a brand
- Recognisable strangers' faces in b-roll (prefer hands / backs / empty rooms)
- Wipro visual — spoken only
