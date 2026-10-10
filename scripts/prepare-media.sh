#!/usr/bin/env bash
# Prepares the source clips for the Vybz Studios ad (public/media).
# Usage: scripts/prepare-media.sh <dir containing the original uploads>
set -euo pipefail
SRC="$1"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"
mkdir -p "$OUT"

CEMENT="$SRC/7bc6cfcb-v09044g40000coji4g7og65rtisrjqdg.mov"   # 5.2 s, plane/cement ad
REACTION="$SRC/3562143a-v09044g40000c71ipr3c77ucs68a05ng.mov" # 1.3 s, man reacting
GIRL="$SRC/95a88a70-v09044g40000c3sd2grc77u0a09ka6m0.mov"     # 3.6 s, "on a souffert"
REDCAP="$SRC/4a8e554f-v09044g40000d5anmh7og65ru9l5a7u0.mp4"   # 34 s, only the audio is used
CUTCARE="$SRC/96fe71fa-Cut_Care_Styling_video_pub_v2.mp4"     # 51 s, Cut & Care ad

V="-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart"
BG="-c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an"
BLUR="gblur=sigma=14,eq=brightness=-0.22:saturation=1.15"

# 1. Cement: crop the picture band out of the black TikTok letterbox. Its
#    original audio is nearly silent (-65 LUFS) and is kept untouched.
ffmpeg -v error -y -i "$CEMENT" -vf "crop=560:436:0:422,scale=1840:1432:flags=lanczos" $V -c:a aac -b:a 192k "$OUT/cement.mp4"
ffmpeg -v error -y -i "$CEMENT" -vf "crop=560:436:0:422,scale=-2:520,crop=480:520,$BLUR" $BG "$OUT/cement-bg.mp4"

# 2. Reaction: loud source (-6 LUFS, clipping) brought down to ~-14 LUFS.
ffmpeg -v error -y -i "$REACTION" -vf "scale=1760:1996:flags=lanczos" -af "volume=-8dB" $V -c:a aac -b:a 192k "$OUT/reaction.mp4"
ffmpeg -v error -y -sseof -0.1 -i "$REACTION" -vf "scale=1760:1996:flags=lanczos" -update 1 -frames:v 1 "$OUT/reaction-last.png"
ffmpeg -v error -y -i "$REACTION" -vf "scale=480:-2,crop=480:520,$BLUR" $BG "$OUT/reaction-bg.mp4"
ffmpeg -v error -y -sseof -0.1 -i "$REACTION" -vf "scale=480:-2,crop=480:520,$BLUR" -update 1 -frames:v 1 "$OUT/reaction-bg-last.png"

# 3. Girl: -11 LUFS -> ~-14 LUFS.
ffmpeg -v error -y -i "$GIRL" -vf "scale=1760:1706:flags=lanczos" -af "volume=-3dB" $V -c:a aac -b:a 192k "$OUT/girl.mp4"
ffmpeg -v error -y -i "$GIRL" -vf "scale=-2:520,crop=480:520,$BLUR" $BG "$OUT/girl-bg.mp4"

# 4. Red cap: audio only, from its start (16 s is more than the ~15.4 s used).
ffmpeg -v error -y -i "$REDCAP" -t 16 -vn -af "volume=-4.6dB" -c:a aac -b:a 192k "$OUT/redcap-audio.m4a"

# 5. Cut & Care: the "Avant / Apres" passage, 16 s -> 21 s, muted.
ffmpeg -v error -y -ss 16 -i "$CUTCARE" -t 5 -an $V "$OUT/cutcare-avant-apres.mp4"


# 6. Bubble Tea poster: blurred dark backdrop for the phone screen.
IMAGES="$(cd "$(dirname "$0")/.." && pwd)/public/images"
ffmpeg -v error -y -i "$IMAGES/bubble-tea.webp" -vf "scale=-2:640,crop=360:640,gblur=sigma=18,eq=brightness=-0.18" -q:v 3 "$OUT/bubble-tea-bg.jpg"
echo "Media written to $OUT"
