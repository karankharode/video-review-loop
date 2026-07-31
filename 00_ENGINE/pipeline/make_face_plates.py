#!/usr/bin/env python3
"""Animated placeholder plates for the Kallaway bottom (face) panel.

Stands in for talking-head footage that hasn't been shot yet, so the cut can be
watched and reviewed before a camera comes out. Each plate is deliberately
*not* a static card: a drifting gradient and a sweeping scan line keep it alive,
because a frozen rectangle in the face slot makes an otherwise fine edit read
as broken.

Each plate is also a shot instruction — it carries the setup letter, the beat
name, the in/out timecode and the actual line to say. Screenshot the preview and
you have a shot list.

Usage:
    python3 make_face_plates.py <variation-folder>

Reads   <folder>/beats_kallaway.json   (faces[] -> name + duration)
        <folder>/face_plates.json      (optional: setup + line per beat)
Writes  <folder>/assets/face/<name>.mp4

Text is drawn with Pillow and composited as a still overlay rather than with
FFmpeg's drawtext, because the Homebrew ffmpeg build here has no freetype.
`kallaway.py` makes the same choice, so the two stay consistent.

Swap in real footage at the same filenames and nothing else in the pipeline
changes — beats, captions and graphics all stay put.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit("Pillow required. pip install pillow") from exc

# Bottom panel is 1920 - round(1920*0.55) - 5 = 859px, but libx264 + yuv420p
# needs even dimensions, so render 860 and let the compositor resize.
W, H, FPS = 1080, 860, 30
ACCENT = (76, 201, 240)

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def wrap(text: str, width: int = 34) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return lines


# The compositor overscans this card 1.28x and then punches in to 1.12x, so
# only the middle ~70% ever reaches the frame. Everything drawn here has to
# live inside that box or it gets its edges sliced off.
SAFE = 0.70


def card(name: str, dur: float, meta: dict, dest: Path):
    """The static text layer: viewfinder corners + shot instruction."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    bw, bh = int(W * SAFE), int(H * SAFE)
    x0, y0 = (W - bw) // 2, (H - bh) // 2
    x1, y1 = x0 + bw, y0 + bh

    # Viewfinder corners, pinned to the safe box — reads as "footage goes here".
    arm, th = 72, 6

    def bar(ax, ay, bx, by):
        d.rectangle([min(ax, bx), min(ay, by), max(ax, bx), max(ay, by)],
                    fill=ACCENT + (218,))

    for cx, cy, dx, dy in ((x0, y0, 1, 1), (x1, y0, -1, 1),
                           (x0, y1, 1, -1), (x1, y1, -1, -1)):
        bar(cx, cy, cx + dx * arm, cy + dy * th)   # horizontal arm
        bar(cx, cy, cx + dx * th, cy + dy * arm)   # vertical arm

    t0 = float(meta.get("start", 0.0))
    pad = 34
    d.text((x0 + pad, y0 + 34), f"SETUP {meta.get('setup', '?')}",
           font=font(38), fill=ACCENT)
    d.text((x0 + pad, y0 + 86), meta.get("beat", name).upper(),
           font=font(58), fill=(255, 255, 255))
    d.text((x0 + pad, y0 + 158), f"{t0:.1f} – {t0 + dur:.1f} s   ({dur:.1f}s)",
           font=font(32), fill=(138, 151, 168))

    for i, ln in enumerate(wrap(meta.get("line", ""), width=30)):
        prefix = "“" if i == 0 else ""
        d.text((x0 + pad, y0 + 246 + i * 52), prefix + ln,
               font=font(38), fill=(232, 238, 246))

    d.text((x0 + pad, y1 - 56), "PLACEHOLDER — REPLACE WITH FOOTAGE",
           font=font(26), fill=(104, 118, 136))
    img.save(dest)


def build(name: str, dur: float, meta: dict, out: Path, tmp: Path):
    png = tmp / f"{name}_card.png"
    card(name, dur, meta, png)

    bg = (
        f"gradients=s={W}x{H}:c0=0x11161F:c1=0x1D2838:x0=0:y0=0:x1={W}:y1={H}"
        # No grain. The compositor magnifies this plate ~1.4x, which turns even
        # alls=2 into television static. Motion comes from the drifting
        # gradient, the scan line and the progress bar instead.
        f":d={dur:.2f}:speed=0.06:r={FPS}[bg];"
        f"[bg][1:v]overlay=0:0[ov];"
        # Sweeping scan line: the main motion cue.
        f"[ov]drawbox=x=0:y='{H}*mod(t/{max(dur, 0.1):.2f}\\,1)':w={W}:h=3"
        f":color=0x4CC9F0@0.35:t=fill[sl];"
        # Progress bar along the bottom — timing readable at a glance.
        f"[sl]drawbox=x=0:y={H - 10}:w='iw*t/{max(dur, 0.1):.2f}':h=10"
        f":color=0x4CC9F0@0.9:t=fill[v]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i",
        f"color=c=0x11161F:s={W}x{H}:d={dur:.2f}:r={FPS}",
        "-i", str(png),
        "-filter_complex", bg, "-map", "[v]",
        "-t", f"{dur:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        str(out),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stderr[-2500:])
        raise SystemExit(f"ffmpeg failed on {name}")


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    beats = json.loads((folder / "beats_kallaway.json").read_text())

    meta_path = folder / "face_plates.json"
    metas = json.loads(meta_path.read_text()) if meta_path.exists() else {}

    out_dir = folder / "assets" / "face"
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for fb in beats["faces"]:
            name = Path(fb["asset"]).stem
            dur = float(fb["end"]) - float(fb["start"])
            meta = dict(metas.get(name, {}))
            meta.setdefault("start", float(fb["start"]))
            build(name, dur, meta, out_dir / f"{name}.mp4", tmp)
            print(f"  {name}.mp4  {dur:.1f}s")

    print(f"{len(beats['faces'])} face plates -> {out_dir}")


if __name__ == "__main__":
    main()
