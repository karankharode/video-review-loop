#!/usr/bin/env python3
"""Beat-locked scratch voiceover.

For on-camera variations the master clock is the presenter, not a TTS engine —
but the cut still has to be watchable before the shoot. This builds a guide
track by synthesising each spoken line separately and laying it at its exact
beat start, so the placeholder preview is frame-accurate to `beats_kallaway.json`
instead of drifting a second further out with every line.

It also turns the length gate into a *per-line* check. A single "VO is 7s long"
number tells you there's a problem somewhere; this tells you which line runs
over its slot and by how much, which is the thing you can act on.

Usage:
    python3 make_scratch_vo.py <variation-folder> [--speaker priya] [--pace 1.25]

Reads   <folder>/vo_map.json          (lines + start times)
        <folder>/beats_kallaway.json  (total duration)
Writes  <folder>/voice.wav            (scratch guide track)

## On --pace

Measured 2026-07-31: Sarvam bulbul:v3 at pace 1.0 speaks at ~120 wpm. Scripts in
this repo are written and timed at 150 wpm, which is normal unhurried on-camera
delivery. So pace 1.25 makes the *guide track* match the rate the script was
written for.

This is calibration, not the thing the engine rule forbids. `VARIATION_AXES.md`
says never raise pace to hide an overrunning script — that protects the final
delivered voice. For a faceless/TTS variation the rule stands untouched: the VO
*is* the deliverable, and an overrun there means cut words. Here the deliverable
is Karan's recorded audio and this file is a stopwatch that gets thrown away.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent


def dur(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def trim_silence(src: Path, dest: Path) -> bool:
    """Strip leading and trailing silence.

    Measured 2026-07-31: Sarvam returns materially different durations for
    identical text at identical pace — one line came back at 2.40s, 3.33s,
    4.41s and 5.00s across four calls. Byte counts track the durations, so the
    audio really is different lengths, and most of the spread is variable
    padding at the ends. Trimming it makes takes comparable, which is what lets
    the per-line slot check below mean anything.
    """
    res = subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-af",
         "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
         "areverse,"
         "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
         "areverse",
         str(dest)],
        capture_output=True, text=True,
    )
    return res.returncode == 0 and dest.exists() and dest.stat().st_size > 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--speaker", default="priya")
    ap.add_argument("--lang", default="en-IN")
    ap.add_argument("--pace", default="1.25")
    ap.add_argument("--takes", type=int, default=3,
                    help="Attempts per line; the tightest fitting take wins.")
    args = ap.parse_args()

    folder = Path(args.folder).resolve()
    vo_map = json.loads((folder / "vo_map.json").read_text())
    beats = json.loads((folder / "beats_kallaway.json").read_text())
    total = float(beats.get("duration", 60.0))
    lines = vo_map["lines"]

    python = sys.executable
    overruns = []

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        segs = []

        for i, ln in enumerate(lines):
            txt = tmp / f"l{i:02d}.txt"
            txt.write_text(ln["text"])
            # A line's slot runs to the next line's start (or the total).
            nxt = float(lines[i + 1]["start"]) if i + 1 < len(lines) else total
            slot = nxt - float(ln["start"])

            # Sarvam's output length varies run to run for the same input, so
            # take a few and keep the tightest one that fits. This is picking
            # the best take, not speeding anyone up — the pace never changes.
            best: tuple[float, Path] | None = None
            for attempt in range(args.takes):
                raw = tmp / f"l{i:02d}_{attempt}_raw.wav"
                res = subprocess.run(
                    [python, str(HERE / "tts_sarvam.py"), str(txt), str(raw),
                     "--speaker", args.speaker, "--lang", args.lang,
                     "--pace", str(args.pace)],
                    capture_output=True, text=True,
                )
                if res.returncode != 0:
                    print(res.stdout[-1200:])
                    print(res.stderr[-1200:])
                    raise SystemExit(f"TTS failed on line {i+1}: {ln['text'][:50]}")

                cut = tmp / f"l{i:02d}_{attempt}.wav"
                use = cut if trim_silence(raw, cut) else raw
                d = dur(use)
                if best is None or d < best[0]:
                    best = (d, use)
                if d <= slot + 0.05:
                    break  # fits — no need to spend another request

            d, wav = best
            flag = ""
            if d > slot + 0.05:
                overruns.append((i + 1, ln["text"], d, slot))
                flag = f"   << OVER by {d - slot:.2f}s"
            print(f"  {i+1:2d}. {ln['start']:5.1f}s  spoken {d:4.1f}s / slot {slot:4.1f}s{flag}")
            segs.append((wav, float(ln["start"])))

        # Lay every segment onto one silent bed at its exact start.
        inputs, filters, labels = [], [], []
        inputs += ["-f", "lavfi", "-i", f"anullsrc=r=22050:cl=mono:d={total}"]
        for j, (wav, start) in enumerate(segs):
            inputs += ["-i", str(wav)]
            filters.append(f"[{j+1}:a]adelay={int(start*1000)}|{int(start*1000)}[d{j}]")
            labels.append(f"[d{j}]")
        filters.append(
            f"[0:a]{''.join(labels)}amix=inputs={len(segs)+1}:normalize=0:"
            f"duration=first[out]"
        )

        out_wav = folder / "voice.wav"
        cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters),
               "-map", "[out]", "-t", f"{total}", "-ar", "22050", "-ac", "1",
               str(out_wav)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stderr[-2500:])
            raise SystemExit("ffmpeg assembly failed")

    print(f"\nWrote {out_wav} — {dur(out_wav):.1f}s (target {total}s)")
    if overruns:
        print(f"\n!! {len(overruns)} line(s) overrun their slot:")
        for n, t, d, s in overruns:
            print(f"   line {n}: {d - s:+.2f}s — \"{t[:60]}\"")
        print("   Cut words in that line, or widen its beat. Do not raise pace.")
    else:
        print("All lines fit their slots.")


if __name__ == "__main__":
    main()
