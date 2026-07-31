#!/usr/bin/env bash
# Point the Remotion project at a variation folder.
#
#   ./link-assets.sh ../../02_BATCHES/2026-07-31/v1_dendrite_waterjet
#
# Copies that variation's plates, face plates and voice track into public/, and
# its beats file into src/timeline.json — which is what the generic
# compositions read. Run this before `npm start` or any render.
#
# Remotion can only serve files from public/, and composition durations have to
# be known at bundle time, so this is a copy rather than a symlink.
#
# Defaults to the v5 variation when called with no argument, which is how it
# behaved before it took a parameter.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
VAR="${1:-$HERE/../../02_BATCHES/2026-07-30/v5_fresher_squeeze}"
VAR="$(cd "$VAR" && pwd)"
PUB="$HERE/public"

BEATS="$VAR/beats_kallaway.json"
[[ -f "$BEATS" ]] || { echo "!! No beats_kallaway.json in $VAR"; exit 1; }

mkdir -p "$PUB/stills" "$PUB/face"
rm -rf "${PUB:?}/stills"/* "${PUB:?}/face"/* "$PUB/voice.wav"

[[ -d "$VAR/assets/stills" ]] && cp -R "$VAR/assets/stills/." "$PUB/stills/"
[[ -d "$VAR/assets/face" ]] && cp "$VAR/assets/face/"*.mp4 "$PUB/face/" 2>/dev/null || true

if [[ -f "$VAR/voice.wav" ]]; then
  cp "$VAR/voice.wav" "$PUB/voice.wav"
else
  echo "-- no voice.wav; compositions will render silent"
fi

cp "$BEATS" "$HERE/src/timeline.json"

# Record which variation is loaded, so a stale public/ is obvious later.
printf '%s\n' "$VAR" > "$HERE/.active-variation"

echo "== linked $(basename "$VAR")"
echo "   stills: $(ls -1 "$PUB/stills" 2>/dev/null | wc -l | tr -d ' ')"
echo "   face:   $(ls -1 "$PUB/face" 2>/dev/null | wc -l | tr -d ' ')"
echo "   beats:  src/timeline.json"
