# Shoot brief — v1 Waterjet Through Rock

One session. Three camera setups. 50 seconds of finished video.

Read `PERFORMANCE_SCRIPT.md` for the lines and direction — this file is logistics only.

---

## Before you press record

- [ ] Shoot **4K** if the camera has it. The edit crops into the lower 45% of a vertical frame, so you're throwing away most of the sensor.
- [ ] **Vertical, or wide enough to crop to vertical.** Final frame is 1080×1920.
- [ ] Frame with your **eyeline low** — you'll be positioned in the bottom 45% of the finished frame. Leave a lot of headroom you're going to discard.
- [ ] Plain background. The graphics are busy; the face half should not be.
- [ ] Even light, no window behind you.
- [ ] **Record 30s of room tone** before you leave. The edit needs it under the pauses.

---

## The three setups

| Setup | Framing | Feel | Used for |
|---|---|---|---|
| **A** | Mid-chest, slight handheld drift | Energy, in-on-the-joke | Hook (0–6.6s), the turn (37.2–44.8s) |
| **B** | Head-and-shoulders, locked off, centred | Flat, explanatory | The reveal and the mechanism (6.6–37.2s) |
| **C** | Tighter than B, small lean-in | Quiet, landed | Close (44.8–50s) |

**Shoot every line in all three setups.** It costs ten extra minutes on the day and it's the difference between an edit with options and an edit with one choice.

---

## Time budget

| | |
|---|---|
| Setup + light | 20 min |
| Setup A — full script, 3 takes | 15 min |
| Setup B — full script, 3 takes | 15 min |
| Setup C — full script, 3 takes | 15 min |
| "It doesn't." in isolation, 5 takes | 5 min |
| Room tone | 1 min |
| **Total** | **~70 min** |

---

## The one shot to get right

**"It doesn't."** — 0.8 seconds of speech at 18.9s, with a beat of silence either side.

Shoot it five times on its own, after you've done the full passes. Locked frame, Setup B, no head movement, neutral. The temptation will be to fill the silence with a nod or a raised eyebrow. Don't. The stillness is the point.

If you get nothing else clean that day, get this.

---

## Placeholder cards as your shot list

`assets/face/*.mp4` are the placeholder plates currently standing in for you. Each one shows the setup letter, the beat name, the exact in/out timecode, and the line. Play `preview_placeholder.mp4` once before shooting — it's the whole video with your face missing, and it shows you exactly what you're filling in.

Delete them once your footage is in.

---

## Filenames when you're done

Drop your selects into `assets/face/` using these exact names and the pipeline picks them up with no other changes:

```
hook.mp4        0.0  – 6.6 s    Setup A
reveal.mp4      6.6  – 18.9 s   Setup B
locked.mp4      18.9 – 20.3 s   Setup B, locked
mechanism.mp4   20.3 – 37.2 s   Setup B
turn.mp4        37.2 – 44.8 s   Setup A
close.mp4       44.8 – 50.0 s   Setup C
```

They don't have to be trimmed to exact length — Resolve handles that. The names just keep the Remotion preview working if you want to re-render it with real footage.

---

## Audio

Your recorded audio replaces `voice.wav` entirely. That file is a Sarvam scratch track built to time the placeholder cut — it is a stopwatch, not a performance reference. Don't match its pacing; it's slightly faster than you should be.
