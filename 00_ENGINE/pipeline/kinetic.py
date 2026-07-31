#!/usr/bin/env python3
"""Render a 1080x1920 kinetic-typography video from beats JSON.

Pillow draws precise word highlights, rounded phrase boxes, and safe-area-aware
cards. FFmpeg encodes the generated frames and muxes an optional voiceover.

Usage:
    python3 kinetic.py beats.json out.mp4 [voiceover.wav]
"""

import json
import math
import subprocess
import sys
import textwrap
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageEnhance, ImageFont
except ImportError as exc:
    raise SystemExit("Pillow is required. Install it with: pip3 install pillow") from exc

W, H, FPS = 1080, 1920, 30
SAFE_TOP = 90
SAFE_BOTTOM = 250
SAFE_SIDE = 72
CONTENT_BOTTOM = H - SAFE_BOTTOM
FADE_SECONDS = 0.20
PUNCH_SECONDS = 0.24

FONT_BOLD = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FONT_SEMI = "/usr/share/fonts/truetype/google-fonts/Poppins-SemiBold.ttf"

# Fallbacks so this runs on a Mac too, where google-fonts isn't at that path.
FONT_FALLBACKS = [
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/SFNS.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def pick_font(preferred):
    if Path(preferred).exists():
        return preferred
    for f in FONT_FALLBACKS:
        if Path(f).exists():
            return f
    raise SystemExit("No usable font found. Set FONT_BOLD in kinetic.py.")


def colour(value):
    """Convert 0xRRGGBB or #RRGGBB to an RGB tuple."""
    value = value.replace("0x", "").replace("#", "")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def fit_font(path, requested, text, wrap_at):
    """Keep unusually wide cards inside horizontal safe area."""
    max_width = W - 2 * SAFE_SIDE
    size = requested
    while size >= 52:
        font = ImageFont.truetype(path, size)
        lines = textwrap.wrap(text, width=wrap_at) or [text]
        probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        if max(probe.textbbox((0, 0), line, font=font)[2] for line in lines) <= max_width:
            return font, lines
        size -= 4
    return ImageFont.truetype(path, size), textwrap.wrap(text, width=wrap_at) or [text]


def line_words(lines):
    """Return words with stable global indices for each wrapped line."""
    result = []
    index = 0
    for line in lines:
        row = []
        for word in line.split():
            row.append((word, index))
            index += 1
        result.append(row)
    return result


def active_word(text, elapsed, duration):
    """Estimate speech position using word length and punctuation pauses."""
    words = text.split()
    if not words:
        return -1
    weights = []
    for word in words:
        weight = max(0.75, len(word.strip(".,!?")) ** 0.38)
        if word.endswith((".", "!", "?")):
            weight += 0.55
        elif word.endswith(","):
            weight += 0.25
        weights.append(weight)
    position = max(0.0, min(0.9999, elapsed / max(duration, 0.001))) * sum(weights)
    running = 0.0
    for index, weight in enumerate(weights):
        running += weight
        if position < running:
            return index
    return len(words) - 1


def alpha_for(elapsed, duration):
    fade = min(FADE_SECONDS, duration / 5)
    if elapsed < fade:
        return elapsed / fade
    if elapsed > duration - fade:
        return max(0.0, (duration - elapsed) / fade)
    return 1.0


def make_background(bg_a, bg_b):
    gradient = Image.linear_gradient("L").resize((W, H))
    a = Image.new("RGB", (W, H), bg_a)
    b = Image.new("RGB", (W, H), bg_b)
    return Image.composite(b, a, gradient)


def render_card(beat, now, font_bold, font_semi, accent):
    t0, t1 = float(beat["start"]), float(beat["end"])
    duration = t1 - t0
    elapsed = now - t0
    text = beat["text"].upper()
    font, lines = fit_font(
        font_bold, int(beat.get("size", 92)), text, int(beat.get("wrap", 16))
    )
    rows = line_words(lines)
    line_h = int(font.size * 1.24)
    kicker_h = 82 if beat.get("kicker") else 0
    block_h = len(rows) * line_h + kicker_h
    canvas_h = block_h + 100
    card = Image.new("RGBA", (W, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    top = 30

    # One accent-colour rounded container marks selected key phrases.
    boxed = bool(beat.get("box"))
    if boxed:
        widths = []
        for row in rows:
            phrase = " ".join(word for word, _ in row)
            widths.append(draw.textbbox((0, 0), phrase, font=font)[2])
        box_w = min(W - 2 * SAFE_SIDE, max(widths) + 84)
        box_h = len(rows) * line_h + 42
        left = (W - box_w) / 2
        draw.rounded_rectangle(
            (left, top - 20, left + box_w, top - 20 + box_h),
            radius=34,
            fill=accent + (224,),
        )

    current = active_word(text, elapsed, duration)
    word_gap = max(16, int(font.size * 0.20))
    for row_index, row in enumerate(rows):
        widths = [draw.textbbox((0, 0), word, font=font)[2] for word, _ in row]
        row_w = sum(widths) + word_gap * max(0, len(row) - 1)
        x = (W - row_w) / 2
        y = top + row_index * line_h
        for (word, word_index), width in zip(row, widths):
            if boxed:
                fill = (255, 255, 255) if word_index == current else (8, 17, 31)
            else:
                fill = accent if word_index == current else (
                    (255, 255, 255) if word_index < current else (157, 171, 191)
                )
            draw.text((x, y), word, font=font, fill=fill, stroke_width=0)
            x += width + word_gap

    if beat.get("kicker"):
        kicker_font = ImageFont.truetype(font_semi, 38)
        kicker = beat["kicker"].upper()
        bbox = draw.textbbox((0, 0), kicker, font=kicker_font)
        draw.text(
            ((W - (bbox[2] - bbox[0])) / 2, top + len(rows) * line_h + 26),
            kicker,
            font=kicker_font,
            fill=accent,
        )

    # Each card enters with one restrained 96% -> 100% punch-in.
    progress = min(1.0, max(0.0, elapsed / PUNCH_SECONDS))
    eased = 1 - (1 - progress) ** 3
    scale = 0.96 + 0.04 * eased
    if scale < 0.999:
        resized = card.resize((int(W * scale), int(canvas_h * scale)), Image.Resampling.LANCZOS)
        punched = Image.new("RGBA", card.size, (0, 0, 0, 0))
        punched.alpha_composite(
            resized, ((W - resized.width) // 2, (canvas_h - resized.height) // 2)
        )
        card = punched

    opacity = alpha_for(elapsed, duration)
    if opacity < 1:
        card.putalpha(ImageEnhance.Brightness(card.getchannel("A")).enhance(opacity))
    return card


def frame_for(beat, now, base, font_bold, font_semi, accent, total):
    frame = base.copy().convert("RGBA")

    # Slow ambient shapes keep frame alive without stealing text attention.
    ambient = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ambient_draw = ImageDraw.Draw(ambient)
    drift = math.sin(now * 0.20)
    ambient_draw.ellipse(
        (-260 + drift * 60, 170, 560 + drift * 60, 990),
        fill=accent + (12,),
    )
    ambient_draw.ellipse(
        (650 - drift * 45, 900, 1370 - drift * 45, 1620),
        fill=(255, 255, 255, 8),
    )
    frame.alpha_composite(ambient)

    card = render_card(beat, now, font_bold, font_semi, accent)
    safe_height = CONTENT_BOTTOM - SAFE_TOP
    y = SAFE_TOP + int((safe_height - card.height) * 0.46)
    y = max(SAFE_TOP, min(y, CONTENT_BOTTOM - card.height))
    frame.alpha_composite(card, (0, y))

    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle(
        (0, 0, max(14, W * now / total), 14),
        radius=7,
        fill=accent + (235,),
    )
    return frame.convert("RGB")


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)

    beats_path, out_path = sys.argv[1], sys.argv[2]
    vo = sys.argv[3] if len(sys.argv) > 3 else None

    spec = json.loads(Path(beats_path).read_text())
    beats = spec["beats"]
    accent = colour(spec.get("accent", "0xFFD166"))
    bg_a = colour(spec.get("bg_a", "0x0B0F1A"))
    bg_b = colour(spec.get("bg_b", "0x1A1030"))
    total = max(float(b["end"]) for b in beats)

    font_bold = pick_font(FONT_BOLD)
    font_semi = pick_font(FONT_SEMI)
    base = make_background(bg_a, bg_b)

    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
        "-r", str(FPS), "-i", "-",
    ]
    if vo:
        cmd += ["-i", vo]

    cmd += ["-map", "0:v"]
    if vo:
        # Pad silence to the visual duration so a 56s VO still exports a true
        # 60s short and preserves the final held card.
        cmd += ["-map", "1:a", "-af", "apad", "-c:a", "aac", "-b:a", "192k"]

    cmd += [
        "-t", f"{total}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-movflags", "+faststart",
        out_path,
    ]

    print(f"Rendering {total}s -> {out_path}")
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_count = int(round(total * FPS))
    beat_index = 0
    try:
        for frame_number in range(frame_count):
            now = frame_number / FPS
            while beat_index + 1 < len(beats) and now >= float(beats[beat_index]["end"]):
                beat_index += 1
            frame = frame_for(
                beats[beat_index], now, base, font_bold, font_semi, accent, total
            )
            process.stdin.write(frame.tobytes())
    except BrokenPipeError:
        pass
    finally:
        if process.stdin:
            process.stdin.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace")
    returncode = process.wait()
    if returncode != 0:
        print(stderr[-3000:])
        raise SystemExit("FFmpeg failed.")
    print("Done.")


if __name__ == "__main__":
    main()
