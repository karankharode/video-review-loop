#!/usr/bin/env python3
"""Kallaway-style split-frame compositor.

Top panel = stock / motion graphics. Bottom panel = talking-head plates
(or dim hold). Captions burn into the lower safe zone. Existing voice.wav
is the master clock.

Usage:
    python3 kallaway.py <variation-folder> [out.mp4]

Expects in the variation folder:
    beats_kallaway.json
    voice.wav
    assets/stills/...
    assets/face/hook.mp4, market.mp4, close.mp4
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter
except ImportError as exc:
    raise SystemExit("Pillow required. pip install pillow") from exc

W, H, FPS = 1080, 1920, 30
FONT_BOLD = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FONT_FALLBACKS = [
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/SFNS.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def pick_font(preferred: str) -> str:
    if Path(preferred).exists():
        return preferred
    for f in FONT_FALLBACKS:
        if Path(f).exists():
            return f
    raise SystemExit("No usable font found.")


def colour(value: str) -> tuple[int, int, int]:
    value = value.replace("0x", "").replace("#", "")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def indian_num(n: int) -> str:
    """Format with Indian grouping: 6,00,000."""
    s = str(int(n))
    if len(s) <= 3:
        return s
    last3 = s[-3:]
    rest = s[:-3]
    parts = []
    while rest:
        parts.append(rest[-2:])
        rest = rest[:-2]
    return ",".join(reversed(parts)) + "," + last3


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def ease_in_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 3 * x * x - 2 * x * x * x


def load_image(path: Path, size: tuple[int, int], overscan: float = 1.28) -> Image.Image:
    """Load cover-cropped with overscan so zoom/pan have room to move."""
    img = Image.open(path).convert("RGB")
    img = ImageEnhance.Color(img).enhance(0.85)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    tw, th = int(size[0] * overscan), int(size[1] * overscan)
    scale = max(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale) + 1, int(img.height * scale) + 1
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def animate_resize(
    base: Image.Image,
    out_size: tuple[int, int],
    progress: float,
    *,
    punch: bool = False,
    pan: str = "center",
    zoom_from: float = 1.0,
    zoom_to: float = 1.14,
) -> Image.Image:
    """Kallaway motion: punch-in on entry + continuous zoom/pan crop."""
    tw, th = out_size
    p = ease_in_out(max(0.0, min(1.0, progress)))
    enter = ease_out_cubic(min(1.0, progress / 0.28)) if punch else 1.0

    # Zoom window as fraction of source (smaller window = bigger zoom).
    zoom = zoom_from + (zoom_to - zoom_from) * p
    if punch:
        zoom *= 0.92 + 0.08 * enter  # start tighter, open to full zoom path

    win_w = max(2, int(tw / zoom))
    win_h = max(2, int(th / zoom))
    # Source must cover the window; if not, scale base up first.
    if base.width < win_w or base.height < win_h:
        cover = max(win_w / base.width, win_h / base.height) * 1.02
        base = base.resize(
            (int(base.width * cover) + 1, int(base.height * cover) + 1),
            Image.Resampling.LANCZOS,
        )

    max_x = max(0, base.width - win_w)
    max_y = max(0, base.height - win_h)
    pans = {
        "center": (0.5, 0.5),
        "left": (0.28 + 0.35 * p, 0.5),
        "right": (0.72 - 0.35 * p, 0.5),
        "up": (0.5, 0.30 + 0.35 * p),
        "down": (0.5, 0.70 - 0.35 * p),
        "diag": (0.30 + 0.40 * p, 0.35 + 0.30 * p),
    }
    cx, cy = pans.get(pan, pans["center"])
    left = int(max_x * cx)
    top = int(max_y * cy)
    cropped = base.crop((left, top, left + win_w, top + win_h))
    return cropped.resize((tw, th), Image.Resampling.LANCZOS)


def kenburns(
    base: Image.Image,
    progress: float,
    punch: bool = False,
    pan: str = "center",
    out_size: tuple[int, int] | None = None,
) -> Image.Image:
    size = out_size or (int(base.width / 1.28), int(base.height / 1.28))
    return animate_resize(
        base, size, progress, punch=punch, pan=pan, zoom_from=1.0, zoom_to=1.16
    )


def draw_counter(
    plate: Image.Image,
    progress: float,
    c_from: int,
    c_to: int,
    accent: tuple[int, int, int],
    font_path: str,
    overlay: str | None = None,
) -> Image.Image:
    frame = plate.copy()
    value = int(c_from + (c_to - c_from) * min(1.0, progress))
    label = indian_num(value)
    draw = ImageDraw.Draw(frame)
    # Dark scrim for legibility.
    scrim = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    sd.rectangle((0, 0, frame.width, frame.height), fill=(8, 12, 20, 120))
    frame = Image.alpha_composite(frame.convert("RGBA"), scrim).convert("RGB")
    draw = ImageDraw.Draw(frame)
    font = ImageFont.truetype(font_path, 110)
    bbox = draw.textbbox((0, 0), label, font=font)
    x = (frame.width - (bbox[2] - bbox[0])) / 2
    y = frame.height * 0.38
    draw.text((x, y), label, font=font, fill=(255, 255, 255))
    if overlay and progress > 0.85:
        sub = ImageFont.truetype(font_path, 42)
        ob = draw.textbbox((0, 0), overlay.upper(), font=sub)
        draw.text(
            ((frame.width - (ob[2] - ob[0])) / 2, y + 130),
            overlay.upper(),
            font=sub,
            fill=accent,
        )
    return frame


def draw_stat(
    plate: Image.Image,
    accent: tuple[int, int, int],
    font_path: str,
    overlay: str,
    sub: str | None = None,
) -> Image.Image:
    frame = plate.copy()
    scrim = Image.new("RGBA", frame.size, (8, 12, 20, 140))
    frame = Image.alpha_composite(frame.convert("RGBA"), scrim).convert("RGB")
    draw = ImageDraw.Draw(frame)
    # Fit to width instead of trusting a fixed size. The plate is overscanned
    # 1.28x and then zoomed before it reaches the frame, so anything sized to
    # the raw plate width gets its first and last letters cropped — which is
    # exactly what happened to "2 YEARS AWAY".
    usable = frame.width * 0.72
    size = 160
    while size > 48:
        font = ImageFont.truetype(font_path, size)
        bbox = draw.textbbox((0, 0), overlay, font=font)
        if bbox[2] - bbox[0] <= usable:
            break
        size -= 6
    font = ImageFont.truetype(font_path, size)
    bbox = draw.textbbox((0, 0), overlay, font=font)
    x = (frame.width - (bbox[2] - bbox[0])) / 2
    y = frame.height * 0.32
    draw.text((x, y), overlay, font=font, fill=accent)
    if sub:
        sf = ImageFont.truetype(font_path, 40)
        sb = draw.textbbox((0, 0), sub.upper(), font=sf)
        draw.text(
            ((frame.width - (sb[2] - sb[0])) / 2, y + size * 1.15),
            sub.upper(),
            font=sf,
            fill=(220, 220, 220),
        )
    return frame


class VideoReader:
    """Decode a video to RGB frames on demand via ffmpeg (rewinds by restart)."""

    def __init__(self, path: Path, size: tuple[int, int]):
        self.path = path
        self.size = size
        self._proc = None
        self._frame_i = 0
        self._duration = float(
            subprocess.check_output(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "csv=p=0",
                    str(path),
                ],
                text=True,
            ).strip()
            or "1"
        )
        self._start(0.0)

    def _start(self, ss: float):
        if self._proc:
            self._proc.kill()
            self._proc.wait()
        tw, th = self.size
        self._proc = subprocess.Popen(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-ss",
                f"{ss:.3f}",
                "-i",
                str(self.path),
                "-vf",
                f"scale={tw}:{th}:force_original_aspect_ratio=increase,crop={tw}:{th},fps={FPS}",
                "-f",
                "rawvideo",
                "-pix_fmt",
                "rgb24",
                "-",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
        self._frame_i = int(ss * FPS)

    def frame_at(self, t: float) -> Image.Image:
        # Loop short face clips.
        local = t % max(0.1, self._duration)
        target = int(local * FPS)
        # Restart if we need to go backwards or jumped ahead a lot.
        if target < self._frame_i or target > self._frame_i + 8:
            self._start(local)
        assert self._proc and self._proc.stdout
        nbytes = self.size[0] * self.size[1] * 3
        while self._frame_i <= target:
            data = self._proc.stdout.read(nbytes)
            if len(data) < nbytes:
                # Loop
                self._start(0.0)
                data = self._proc.stdout.read(nbytes)
                if len(data) < nbytes:
                    return Image.new("RGB", self.size, (20, 24, 32))
            self._frame_i += 1
        return Image.frombytes("RGB", self.size, data)

    def close(self):
        if self._proc:
            self._proc.kill()
            self._proc.wait()
            self._proc = None


def active(items: list[dict], t: float) -> dict | None:
    for item in items:
        if float(item["start"]) <= t < float(item["end"]) - 1e-6:
            return item
        # Last beat inclusive at exact end.
        if abs(t - float(item["end"])) < 1e-6 and item is items[-1]:
            return item
    # Clamp to last if past end slightly.
    if items and t >= float(items[-1]["start"]):
        return items[-1]
    return None


def draw_caption(
    frame: Image.Image,
    cap: dict,
    accent: tuple[int, int, int],
    font_path: str,
    layout: dict,
    bottom_top: int,
) -> None:
    text = cap["text"].upper()
    highlight = {h.upper() for h in cap.get("highlight", [])}
    safe_bottom = int(layout.get("safe_bottom", 250))
    safe_side = int(layout.get("safe_side", 48))
    draw = ImageDraw.Draw(frame)
    size = 52
    font = ImageFont.truetype(font_path, size)
    words = text.split()
    # Fit width.
    while size >= 34:
        font = ImageFont.truetype(font_path, size)
        gap = max(10, size // 5)
        widths = [draw.textbbox((0, 0), w, font=font)[2] for w in words]
        total = sum(widths) + gap * max(0, len(words) - 1)
        if total <= W - 2 * safe_side - 40:
            break
        size -= 2

    gap = max(10, size // 5)
    widths = [draw.textbbox((0, 0), w, font=font)[2] for w in words]
    total = sum(widths) + gap * max(0, len(words) - 1)
    pad_x, pad_y = 28, 18
    pill_w = total + pad_x * 2
    pill_h = size + pad_y * 2
    # Sit in bottom panel, above Instagram UI.
    max_y = H - safe_bottom - pill_h
    min_y = bottom_top + 40
    y = min(max_y, max(min_y, H - safe_bottom - pill_h - 36))
    x0 = (W - pill_w) / 2
    # Dark pill.
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle(
        (x0, y, x0 + pill_w, y + pill_h),
        radius=18,
        fill=(0, 0, 0, 170),
    )
    frame.alpha_composite(overlay)
    draw = ImageDraw.Draw(frame)
    x = x0 + pad_x
    ty = y + pad_y - 2
    for word, ww in zip(words, widths):
        fill = accent if word in highlight else (255, 255, 255)
        draw.text((x, ty), word, font=font, fill=fill)
        x += ww + gap


def render_top(
    visual: dict,
    t: float,
    top_size: tuple[int, int],
    assets: Path,
    cache: dict,
    accent: tuple[int, int, int],
    font_path: str,
) -> Image.Image:
    rel = visual["asset"]
    path = assets / rel
    key = str(path)
    if key not in cache:
        if not path.exists():
            cache[key] = Image.new(
                "RGB",
                (int(top_size[0] * 1.28), int(top_size[1] * 1.28)),
                (12, 18, 28),
            )
        else:
            cache[key] = load_image(path, top_size, overscan=1.28)
    base = cache[key]
    t0, t1 = float(visual["start"]), float(visual["end"])
    dur = max(0.001, t1 - t0)
    progress = (t - t0) / dur
    mode = visual.get("mode", "kenburns")
    pan = visual.get("pan", "center")
    punch = bool(visual.get("punch"))

    if mode == "counter":
        plate = animate_resize(
            base, top_size, progress, punch=punch or True, pan=pan, zoom_to=1.12
        )
        return draw_counter(
            plate,
            progress,
            int(visual.get("counter_from", 600000)),
            int(visual.get("counter_to", 120000)),
            accent,
            font_path,
            visual.get("overlay"),
        )
    if mode == "stat":
        plate = animate_resize(base, top_size, progress, punch=True, pan=pan, zoom_to=1.18)
        return draw_stat(
            plate, accent, font_path, visual.get("overlay", "−80%"), visual.get("sub")
        )
    if mode == "hold":
        # Slow breathing zoom — locked cutaway, still alive.
        breath = 0.08 + 0.04 * (0.5 + 0.5 * math.sin(t * 0.55))
        return animate_resize(
            base, top_size, breath, punch=False, pan=pan, zoom_from=1.02, zoom_to=1.10
        )
    return animate_resize(
        base, top_size, progress, punch=punch or True, pan=pan, zoom_to=1.18
    )


def animate_face(
    frame: Image.Image,
    bottom_size: tuple[int, int],
    local_t: float,
    slot_dur: float,
) -> Image.Image:
    """Punch-in on face entry + slow push for the rest of the slot."""
    progress = local_t / max(0.001, slot_dur)
    # Build overscan from the decoded frame so we can zoom.
    over = frame.resize(
        (int(bottom_size[0] * 1.28), int(bottom_size[1] * 1.28)),
        Image.Resampling.LANCZOS,
    )
    return animate_resize(
        over,
        bottom_size,
        progress,
        punch=True,
        pan="center",
        zoom_from=1.0,
        zoom_to=1.12,
    )


def dim_bottom(top_sample: Image.Image, bottom_size: tuple[int, int]) -> Image.Image:
    """Blurred, darkened continuation of top when no face."""
    img = top_sample.resize(bottom_size, Image.Resampling.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(18))
    img = ImageEnhance.Brightness(img).enhance(0.35)
    return img


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else folder / "final_kallaway.mp4"
    beats_path = folder / "beats_kallaway.json"
    voice = folder / "voice.wav"
    assets = folder / "assets"

    if not beats_path.exists():
        raise SystemExit(f"Missing {beats_path}")
    if not voice.exists():
        raise SystemExit(f"Missing {voice} — Kallaway mode reuses existing VO.")

    spec = json.loads(beats_path.read_text())
    accent = colour(spec.get("accent", "0xFFD400"))
    layout = spec.get("layout", {})
    top_ratio = float(layout.get("top_ratio", 0.55))
    rule_h = int(layout.get("rule_h", 5))
    top_h = int(H * top_ratio)
    bottom_h = H - top_h - rule_h
    top_size = (W, top_h)
    bottom_size = (W, bottom_h)
    bottom_top = top_h + rule_h
    total = float(spec.get("duration", 60.0))
    visuals = spec["visuals"]
    faces = spec["faces"]
    captions = spec["captions"]
    font_path = pick_font(FONT_BOLD)
    bg_a = colour(spec.get("bg_a", "0x0A0E16"))

    # Preload stills.
    still_cache: dict = {}
    # Face readers keyed by asset path.
    face_readers: dict[str, VideoReader] = {}
    for f in faces:
        p = assets / f["asset"]
        if p.exists():
            face_readers[f["asset"]] = VideoReader(p, bottom_size)
        else:
            print(f"!! missing face plate {p} — using dim stand-in")

    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{W}x{H}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(voice),
        "-map",
        "0:v",
        "-map",
        "1:a",
        "-af",
        "apad",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        f"{total}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-r",
        str(FPS),
        "-movflags",
        "+faststart",
        str(out),
    ]
    print(f"Rendering Kallaway {total}s -> {out}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_count = int(round(total * FPS))
    try:
        for i in range(frame_count):
            t = i / FPS
            visual = active(visuals, t) or visuals[0]
            top = render_top(
                visual, t, top_size, assets, still_cache, accent, font_path
            )

            face = active(faces, t)
            if face and face["asset"] in face_readers:
                local_t = t - float(face["start"])
                slot_dur = float(face["end"]) - float(face["start"])
                raw = face_readers[face["asset"]].frame_at(local_t)
                bottom = animate_face(raw, bottom_size, local_t, slot_dur)
            else:
                bottom = dim_bottom(top, bottom_size)
                # Keep dim plate gently resizing too.
                over = bottom.resize(
                    (int(bottom_size[0] * 1.2), int(bottom_size[1] * 1.2)),
                    Image.Resampling.LANCZOS,
                )
                vis = active(visuals, t) or visuals[0]
                vp = (t - float(vis["start"])) / max(
                    0.001, float(vis["end"]) - float(vis["start"])
                )
                bottom = animate_resize(
                    over, bottom_size, vp, punch=False, pan="center", zoom_to=1.08
                )

            frame = Image.new("RGB", (W, H), bg_a)
            frame.paste(top, (0, 0))
            # Accent rule.
            rule = Image.new("RGB", (W, rule_h), accent)
            frame.paste(rule, (0, top_h))
            frame.paste(bottom, (0, bottom_top))

            # Progress bar.
            draw = ImageDraw.Draw(frame)
            draw.rectangle((0, 0, max(4, int(W * t / total)), 10), fill=accent)

            # Captions.
            rgba = frame.convert("RGBA")
            cap = active(captions, t)
            if cap:
                draw_caption(rgba, cap, accent, font_path, layout, bottom_top)
            frame = rgba.convert("RGB")

            assert proc.stdin
            proc.stdin.write(frame.tobytes())
            if i % 90 == 0:
                print(f"  {t:.1f}s / {total:.1f}s")
    except BrokenPipeError:
        pass
    finally:
        if proc.stdin:
            proc.stdin.close()
        for r in face_readers.values():
            r.close()
    err = proc.stderr.read().decode("utf-8", errors="replace")
    code = proc.wait()
    if code != 0:
        print(err[-3000:])
        raise SystemExit("FFmpeg failed.")
    print("Done.")


if __name__ == "__main__":
    main()
