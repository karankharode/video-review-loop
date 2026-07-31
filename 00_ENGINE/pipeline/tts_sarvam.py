#!/usr/bin/env python3
"""
Sarvam Bulbul v3 text-to-speech.

Usage:
    export SARVAM_API_KEY=...          # or put it in .env next to this file
    python3 tts_sarvam.py script.txt out.wav [--speaker anushka] [--lang en-IN]

Bulbul caps at 2500 characters per request, which is ~4 minutes of speech —
comfortably more than any short. Longer text is chunked on sentence boundaries
and concatenated, so nothing is ever cut mid-word.
"""

import argparse
import base64
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import requests

API = "https://api.sarvam.ai/text-to-speech"
MAX_CHARS = 2400  # a little under the 2500 limit, for safety


def load_key():
    key = os.environ.get("SARVAM_API_KEY")
    if key:
        return key
    env = Path(__file__).parent / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip()
            if line.startswith("SARVAM_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(
        "No Sarvam key. Set SARVAM_API_KEY, or add it to "
        f"{env}\n(That file is gitignored — do not commit the key.)"
    )


def chunk(text, limit=MAX_CHARS):
    """Split on sentence ends, never mid-word."""
    if len(text) <= limit:
        return [text]
    out, cur = [], ""
    for sentence in text.replace("\n", " ").split(". "):
        piece = sentence if sentence.endswith(".") else sentence + "."
        if len(cur) + len(piece) + 1 > limit:
            out.append(cur.strip())
            cur = piece
        else:
            cur += " " + piece
    if cur.strip():
        out.append(cur.strip())
    return out


def synth(text, key, speaker, lang, pace):
    r = requests.post(
        API,
        headers={"api-subscription-key": key, "Content-Type": "application/json"},
        json={
            "text": text,
            "target_language_code": lang,
            "speaker": speaker,
            "model": "bulbul:v3",
            "pace": pace,
            "speech_sample_rate": 24000,
        },
        timeout=120,
    )
    if r.status_code != 200:
        raise SystemExit(f"Sarvam returned {r.status_code}: {r.text[:500]}")
    audios = r.json().get("audios") or []
    if not audios:
        raise SystemExit(f"Sarvam returned no audio: {r.text[:500]}")
    return base64.b64decode(audios[0])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("script")
    p.add_argument("out")
    p.add_argument("--speaker", default="anushka")
    p.add_argument("--lang", default="en-IN")
    p.add_argument("--pace", type=float, default=1.0)
    a = p.parse_args()

    text = Path(a.script).read_text().strip()
    if not text:
        raise SystemExit("Script file is empty.")

    key = load_key()
    pieces = chunk(text)
    print(f"{len(text)} chars, {len(pieces)} request(s), speaker={a.speaker}")

    tmp = []
    for i, piece in enumerate(pieces, 1):
        print(f"  [{i}/{len(pieces)}] {len(piece)} chars")
        f = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        f.write(synth(piece, key, a.speaker, a.lang, a.pace))
        f.close()
        tmp.append(f.name)

    if len(tmp) == 1:
        Path(a.out).write_bytes(Path(tmp[0]).read_bytes())
    else:
        lst = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
        lst.write("\n".join(f"file '{t}'" for t in tmp))
        lst.close()
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst.name,
             "-c", "copy", a.out],
            check=True, capture_output=True,
        )

    with wave.open(a.out) as w:
        dur = w.getnframes() / w.getframerate()
    print(f"Wrote {a.out} — {dur:.1f}s")
    print("Match this against the scripted length before rendering. If the VO "
          "is longer than the beats, the script is too long — cut words, "
          "don't speed up the voice.")


if __name__ == "__main__":
    main()
