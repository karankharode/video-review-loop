#!/usr/bin/env python3
"""Procedural placeholder plates for the Kallaway top panel.

Draws diagram plates from a spec file instead of sourcing stock images, so a
variation can be previewed the day it's written — before any footage exists and
without a single binary asset in the repo. Every plate is regenerable, which
means editing the spec is the whole workflow: no re-downloading, no dead links.

Usage:
    python3 make_placeholders.py <variation-folder>

Reads   <folder>/plates.json
Writes  <folder>/assets/stills/<name>.png

Each plate declares a `kind` that maps to a draw_* function below. Adding a new
plate type means adding one function and one KINDS entry — the spec stays data.

These are PLACEHOLDERS with a real job: they carry the actual diagram content,
so the cut reads correctly at review time. Swap them for shot or designed
footage later and the timing does not move.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError as exc:
    raise SystemExit("Pillow required. pip install pillow") from exc

# Rendered larger than the 1080x1056 top panel so Ken Burns pans have real
# pixels to move into rather than upscaling a crop.
PW, PH = 1350, 1320

# Fraction of the plate that survives the compositor's overscan + punch-in.
# All drawn content is composited inside this centred box.
SAFE = 0.70

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
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


def hexcol(value: str) -> tuple[int, int, int]:
    value = value.replace("0x", "").replace("#", "")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def centre_text(d: ImageDraw.ImageDraw, xy, text, f, fill):
    """Draw text centred on xy. PIL anchors are per-font unreliable, so measure."""
    box = d.textbbox((0, 0), text, font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text((xy[0] - w / 2 - box[0], xy[1] - h / 2 - box[1]), text, font=f, fill=fill)


def base(bg_a: str, bg_b: str) -> Image.Image:
    """Vertical gradient plate with a faint technical grid over it."""
    img = Image.new("RGB", (PW, PH), hexcol(bg_a))
    d = ImageDraw.Draw(img)
    ca, cb = hexcol(bg_a), hexcol(bg_b)
    for y in range(PH):
        t = y / PH
        d.line(
            [(0, y), (PW, y)],
            fill=tuple(int(ca[i] + (cb[i] - ca[i]) * t) for i in range(3)),
        )
    grid = Image.new("RGBA", (PW, PH), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, PW, 90):
        gd.line([(x, 0), (x, PH)], fill=(255, 255, 255, 10), width=1)
    for y in range(0, PH, 90):
        gd.line([(0, y), (PW, y)], fill=(255, 255, 255, 10), width=1)
    return Image.alpha_composite(img.convert("RGBA"), grid).convert("RGB")


def label(img: Image.Image, text: str, accent: str, sub: str | None = None):
    """Bottom-left caps label — the plate's own title, not the video caption."""
    d = ImageDraw.Draw(img)
    f = font(46)
    d.text((70, PH - 150), text.upper(), font=f, fill=hexcol(accent))
    if sub:
        d.text((70, PH - 92), sub.upper(), font=font(32), fill=(150, 160, 175))


# --- plate kinds -----------------------------------------------------------


def draw_years(img, spec, accent):
    """Stacked 'still 2 years away' rows, one per year, most recent brightest."""
    d = ImageDraw.Draw(img)
    years = spec.get("years", [2016, 2018, 2020, 2022, 2024, 2026])
    top, gap = 250, 120
    for i, yr in enumerate(years):
        y = top + i * gap
        fade = int(70 + 185 * (i / max(1, len(years) - 1)))
        d.text((150, y), str(yr), font=font(64), fill=(fade, fade, fade))
        d.text((400, y + 12), "still 2 years away", font=font(44),
               fill=(fade - 30, fade - 30, fade - 20))
        d.line([(150, y + 92), (PW - 150, y + 92)], fill=(60, 70, 85), width=2)
    label(img, "the perpetual horizon", accent)


def draw_chemistry(img, spec, accent):
    """Beaker row struck through — the assumption the video knocks down."""
    d = ImageDraw.Draw(img)
    cx, cy = PW // 2, PH // 2 - 60
    for i, off in enumerate((-320, 0, 320)):
        x = cx + off
        d.polygon(
            [(x - 70, cy - 150), (x - 40, cy - 40), (x - 40, cy + 130),
             (x + 40, cy + 130), (x + 40, cy - 40), (x + 70, cy - 150)],
            outline=(150, 165, 185), width=5,
        )
        d.rectangle([x - 38, cy + 30, x + 38, cy + 128], fill=(40, 70, 95))
    d.line([(cx - 430, cy + 210), (cx + 430, cy - 230)],
           fill=hexcol("0xFF4D4D"), width=14)
    label(img, "assumed: a chemistry problem", accent, "ruled out")


def draw_cutaway(img, spec, accent):
    """Cell cross-section: lithium anode, ceramic electrolyte, cathode."""
    d = ImageDraw.Draw(img)
    x0, x1 = 150, PW - 150
    bands = [
        ("LITHIUM METAL", 240, 200, (95, 120, 155)),
        ("CERAMIC ELECTROLYTE", 470, 300, (205, 215, 230)),
        ("CATHODE", 800, 200, (70, 95, 125)),
    ]
    for name, y, h, col in bands:
        d.rectangle([x0, y, x1, y + h], fill=col)
        d.text((x0 + 24, y + 18), name, font=font(34),
               fill=(15, 20, 30) if col[0] > 150 else (225, 235, 245))
    # The crossing arrow — lithium's route through the wall.
    ax = PW // 2
    d.line([(ax, 300), (ax, 700)], fill=hexcol(accent), width=10)
    d.polygon([(ax - 34, 690), (ax + 34, 690), (ax, 760)], fill=hexcol(accent))
    label(img, "lithium must cross the wall", accent)


def draw_hardness(img, spec, accent):
    """Hard block vs soft blob, with a hardness bar for each."""
    d = ImageDraw.Draw(img)
    cy = PH // 2 - 80
    d.rectangle([160, cy - 160, 580, cy + 160], fill=(205, 215, 230))
    d.text((205, cy - 30), "CERAMIC", font=font(52), fill=(15, 20, 30))
    d.ellipse([PW - 590, cy - 150, PW - 170, cy + 170], fill=(95, 120, 155))
    d.text((PW - 545, cy - 30), "LITHIUM", font=font(52), fill=(230, 238, 248))
    for x0, frac, col in ((160, 0.92, (205, 215, 230)), (PW - 590, 0.18, (95, 120, 155))):
        d.rectangle([x0, cy + 240, x0 + 420, cy + 282], outline=(90, 100, 120), width=3)
        d.rectangle([x0, cy + 240, x0 + int(420 * frac), cy + 282], fill=col)
    d.text((160, cy + 300), "HARDNESS", font=font(32), fill=(150, 160, 175))
    label(img, "hard should beat soft", accent)


def draw_freeze(img, spec, accent):
    """Everything stops. The plate for the two-word turn."""
    d = ImageDraw.Draw(img)
    centre_text(d, (PW // 2, PH // 2 - 40), "IT DOESN'T", font(150), (255, 255, 255))
    d.line([(PW // 2 - 300, PH // 2 + 90), (PW // 2 + 300, PH // 2 + 90)],
           fill=hexcol(accent), width=8)


def draw_cryo(img, spec, accent):
    """Cryo-EM look: desaturated, frost speckle, a scanned cross-section."""
    d = ImageDraw.Draw(img)
    d.rectangle([180, 260, PW - 180, PH - 380], fill=(58, 66, 78), outline=(150, 165, 185), width=4)
    for i in range(2600):  # frost / detector noise
        x = (i * 61) % (PW - 400) + 200
        y = (i * 137) % (PH - 680) + 280
        v = 90 + (i * 37) % 140
        d.point((x, y), fill=(v, v + 6, v + 12))
    d.line([(180, 300 + 120), (PW - 180, 300 + 120)], fill=hexcol(accent), width=3)
    d.text((210, PH - 360), "CRYO-EM · UNDER VACUUM", font=font(38), fill=hexcol(accent))
    label(img, "frozen mid-failure", accent, "max planck · nature")


def _ceramic_field(d):
    d.rectangle([150, 220, PW - 150, PH - 300], fill=(205, 215, 230))


def draw_crack(img, spec, accent):
    """Lithium seeping into a pre-existing hairline crack and filling it."""
    d = ImageDraw.Draw(img)
    _ceramic_field(d)
    pts = [(PW // 2, 220)]
    x, y = PW // 2, 220
    for i in range(14):  # jagged pre-existing crack
        x += (-1) ** i * (18 + (i * 13) % 34)
        y += 46
        pts.append((x, y))
    d.line(pts, fill=(70, 80, 95), width=9)
    d.line(pts[:9], fill=(95, 120, 155), width=17)  # lithium filling the top part
    d.text((190, 260), "PRE-EXISTING CRACK", font=font(34), fill=(60, 70, 85))
    d.text((190, PH - 400), "LITHIUM IN · CANNOT GET OUT", font=font(40), fill=(40, 60, 90))
    label(img, "it gets trapped", accent)


def draw_split(img, spec, accent):
    """Trapped lithium → hydrostatic pressure → brittle fracture outward."""
    d = ImageDraw.Draw(img)
    _ceramic_field(d)
    cx, cy = PW // 2, PH // 2 - 30
    for ang in range(0, 360, 30):  # fracture radiating from inside
        r = math.radians(ang)
        d.line([(cx, cy), (cx + math.cos(r) * 430, cy + math.sin(r) * 380)],
               fill=(70, 80, 95), width=7)
    d.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=(95, 120, 155))
    for rr in (110, 160, 210):  # pressure rings
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=hexcol("0xFF4D4D"), width=5)
    label(img, "splits from the inside", accent, "hydrostatic pressure")


def draw_waterjet(img, spec, accent):
    """The source's own analogy: a soft continuous jet cutting hard stone."""
    d = ImageDraw.Draw(img)
    d.rectangle([150, 620, PW - 150, PH - 220], fill=(96, 88, 78))  # rock
    d.text((190, 660), "ROCK", font=font(44), fill=(210, 200, 188))
    jet_x = PW // 2
    d.line([(jet_x, 200), (jet_x, 640)], fill=hexcol(accent), width=22)
    d.polygon([(jet_x - 90, 640), (jet_x + 90, 640), (jet_x + 40, PH - 240),
               (jet_x - 40, PH - 240)], fill=(58, 70, 88))  # kerf
    for i in range(14):  # spray
        a = math.radians(200 + i * 10)
        d.line([(jet_x, 660), (jet_x + math.cos(a) * 190, 660 + math.sin(a) * 150)],
               fill=hexcol(accent), width=4)
    label(img, "like a waterjet through rock", accent, "soft cuts hard")


def draw_short(img, spec, accent):
    """The spark that jumps the fracture — the actual failure the user sees."""
    d = ImageDraw.Draw(img)
    _ceramic_field(d)
    pts, x, y = [], 250, 280
    while y < PH - 340:
        pts.append((x, y))
        x += (-1) ** len(pts) * 120 + 60
        y += 90
    # Hand-drawn halo rather than a full-image blur: the plate is a transparent
    # content layer now, and blurring it would smear the alpha into the edges.
    for width, alpha in ((34, 40), (24, 70), (16, 120)):
        d.line(pts, fill=hexcol("0xFFE44D") + (alpha,), width=width)
    d.line(pts, fill=hexcol("0xFFE44D") + (255,), width=11)
    label(img, "short circuit", accent)


def draw_word(img, spec, accent):
    """Struck-through word replaced by another. Used for chemistry→engineering."""
    d = ImageDraw.Draw(img)
    old, new = spec.get("old", "CHEMISTRY"), spec.get("new", "ENGINEERING")
    centre_text(d, (PW // 2, PH // 2 - 150), old, font(110), (110, 120, 138))
    box = d.textbbox((0, 0), old, font=font(110))
    half = (box[2] - box[0]) / 2 + 30
    d.line([(PW // 2 - half, PH // 2 - 150), (PW // 2 + half, PH // 2 - 150)],
           fill=hexcol("0xFF4D4D"), width=12)
    centre_text(d, (PW // 2, PH // 2 + 90), new, font(130), hexcol(accent))


def draw_fixes(img, spec, accent):
    """Three numbered fix cards — one per item in the spoken list."""
    d = ImageDraw.Draw(img)
    items = spec.get("items", ["TOUGHER CERAMIC", "PROTECTIVE COATINGS", "STEERED MICRO-VOIDS"])
    top, h, gap = 300, 190, 40
    for i, it in enumerate(items):
        y = top + i * (h + gap)
        d.rounded_rectangle([150, y, PW - 150, y + h], radius=26,
                            fill=(24, 34, 50), outline=hexcol(accent), width=4)
        d.text((200, y + 52), str(i + 1), font=font(78), fill=hexcol(accent))
        d.text((320, y + 66), it, font=font(50), fill=(235, 242, 250))
    label(img, "the fixes are mechanical", accent)


def draw_statement(img, spec, accent):
    """Single held word or phrase. Bookends and save-bait."""
    d = ImageDraw.Draw(img)
    main = spec.get("main", "PRESSURE")
    sub = spec.get("sub")
    centre_text(d, (PW // 2, PH // 2 - 30), main, font(spec.get("size", 150)), hexcol(accent))
    if sub:
        centre_text(d, (PW // 2, PH // 2 + 120), sub, font(48), (185, 195, 210))


KINDS = {
    "years": draw_years,
    "chemistry": draw_chemistry,
    "cutaway": draw_cutaway,
    "hardness": draw_hardness,
    "freeze": draw_freeze,
    "cryo": draw_cryo,
    "crack": draw_crack,
    "split": draw_split,
    "waterjet": draw_waterjet,
    "short": draw_short,
    "word": draw_word,
    "fixes": draw_fixes,
    "statement": draw_statement,
}


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    spec_path = folder / "plates.json"
    if not spec_path.exists():
        raise SystemExit(f"No plates.json in {folder}")

    spec = json.loads(spec_path.read_text())
    accent = spec.get("accent", "0x4CC9F0")
    bg_a = spec.get("bg_a", "0x05080F")
    bg_b = spec.get("bg_b", "0x101C2E")

    out_dir = folder / "assets" / "stills"
    out_dir.mkdir(parents=True, exist_ok=True)

    for plate in spec["plates"]:
        kind = plate["kind"]
        if kind not in KINDS:
            raise SystemExit(f"Unknown plate kind {kind!r}. Known: {sorted(KINDS)}")

        # Draw at full size on a transparent layer, then composite it scaled
        # into the middle SAFE fraction of the background. The compositor
        # overscans 1.28x and punches in to ~1.16x, so roughly the outer 30% of
        # every plate never reaches the frame — that's what was slicing the "2"
        # off "2016". Doing it here means each draw_* function can lay out
        # against the full canvas and stay readable without per-plate nudging.
        content = Image.new("RGBA", (PW, PH), (0, 0, 0, 0))
        KINDS[kind](content, plate, accent)

        sw, sh = int(PW * SAFE), int(PH * SAFE)
        scaled = content.resize((sw, sh), Image.Resampling.LANCZOS)
        img = base(bg_a, bg_b).convert("RGBA")
        img.alpha_composite(scaled, ((PW - sw) // 2, (PH - sh) // 2))

        dest = out_dir / f"{plate['name']}.png"
        img.convert("RGB").save(dest)
        print(f"  {dest.name}")

    print(f"{len(spec['plates'])} plates -> {out_dir}")


if __name__ == "__main__":
    main()
