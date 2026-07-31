#!/usr/bin/env bash
# Render one variation end to end.
#
#   ./render.sh ../../02_BATCHES/2026-07-30/v6_cbfc_spiderman
#   MODE=kallaway ./render.sh ../../02_BATCHES/2026-07-30/v5_fresher_squeeze
#
# Expects in that folder:
#   beats.json / beats_kallaway.json — timing + on-screen text
#   AVATAR_SCRIPT.md                — spoken words (kinetic / TTS path)
#   voice.wav                       — reused when MODE=kallaway
#
# Produces:
#   voice.wav              — Sarvam Bulbul v3 (kinetic mode)
#   final.mp4              — kinetic typography
#   final_kallaway.mp4     — Kallaway split-frame (MODE=kallaway)
#
# Runs anywhere with ffmpeg + python3. No GPU. The lip-sync stage is separate
# and only applies to avatar-mode videos — see README.md.

set -euo pipefail

DIR="${1:?usage: render.sh <variation-folder>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$(cd "$DIR" && pwd)"

SPEAKER="${SPEAKER:-priya}"
LANG="${LANG_CODE:-en-IN}"
PACE="${PACE:-1.0}"
MODE="${MODE:-kinetic}"
PYTHON="$HERE/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  PYTHON="$(command -v python3)"
fi

command -v ffmpeg >/dev/null || { echo "ffmpeg not found. brew install ffmpeg"; exit 1; }

echo "== $DIR (mode=$MODE)"

if [[ "$MODE" == "kallaway" ]]; then
  if [[ ! -f "$DIR/beats_kallaway.json" ]]; then
    echo "!! No beats_kallaway.json"; exit 1
  fi
  if [[ ! -f "$DIR/voice.wav" ]]; then
    echo "!! Kallaway mode needs existing voice.wav (no re-TTS)."; exit 1
  fi

  VO_LEN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/voice.wav")
  BEATS_LEN=$("$PYTHON" -c "import json;print(json.load(open('$DIR/beats_kallaway.json')).get('duration',60))")
  echo "-- voice ${VO_LEN}s vs duration ${BEATS_LEN}s (reuse VO, skip TTS)"
  "$PYTHON" - "$VO_LEN" "$BEATS_LEN" <<'PY'
import sys
vo, beats = float(sys.argv[1]), float(sys.argv[2])
if vo > beats + 0.75:
    sys.exit(f"!! Voice is {vo-beats:.1f}s longer than duration. "
             "Cut words — do not speed up the voice.")
PY

  echo "-- video (kallaway)"
  "$PYTHON" "$HERE/kallaway.py" "$DIR" "$DIR/final_kallaway.mp4"
  echo "== done: $DIR/final_kallaway.mp4"
  ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$DIR/final_kallaway.mp4"
  exit 0
fi

# --- kinetic (default) path ---

if [[ ! -f "$DIR/AVATAR_SCRIPT.md" ]]; then
  echo "!! No AVATAR_SCRIPT.md — cannot synthesise voice."; exit 1
fi

if grep -qE '^\s*[#|]|\[|\]|\*\*' "$DIR/AVATAR_SCRIPT.md"; then
  echo "!! AVATAR_SCRIPT.md contains markdown, brackets or a table."
  echo "   Every character in that file is spoken aloud. Clean it first."
  exit 1
fi

echo "-- voice (Sarvam bulbul:v3, $SPEAKER)"
"$PYTHON" "$HERE/tts_sarvam.py" "$DIR/AVATAR_SCRIPT.md" "$DIR/voice.wav" \
  --speaker "$SPEAKER" --lang "$LANG" --pace "$PACE"

VO_LEN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/voice.wav")
BEATS_LEN=$("$PYTHON" -c "import json,sys;print(max(b['end'] for b in json.load(open('$DIR/beats.json'))['beats']))")
echo "-- voice ${VO_LEN}s vs beats ${BEATS_LEN}s"

"$PYTHON" - "$VO_LEN" "$BEATS_LEN" <<'PY'
import sys
vo, beats = float(sys.argv[1]), float(sys.argv[2])
if vo > beats + 0.75:
    sys.exit(f"!! Voice is {vo-beats:.1f}s longer than the beats. "
             "Cut words in AVATAR_SCRIPT.md — do not speed up the voice.")
PY

echo "-- video"
"$PYTHON" "$HERE/kinetic.py" "$DIR/beats.json" "$DIR/final.mp4" "$DIR/voice.wav"

echo "== done: $DIR/final.mp4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$DIR/final.mp4"
