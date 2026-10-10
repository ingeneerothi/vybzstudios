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
ffmpeg -v error -y -i "$REACTION" -vf "scale=480:-2,crop=480:520,$BLUR" $BG "$OUT/reaction-bg.mp4"

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

# 7. Full-screen versions (1080x1920) of the three meme clips.
#    Cover crop with a uniform scale: a 9:16 window follows the subject on
#    eased keyframes and keeps the TikTok / Telegram watermarks out of frame.
#    The window is cut from the clip scaled to twice the final size (the pan
#    moves in half-pixel steps, so it stays smooth), then brought to 1080x1920.
#    Same frame count and timing as cement.mp4 / reaction.mp4 / girl.mp4
#    (30 fps, each source frame once, nothing dropped or repeated by the
#    encoder; the cement's lead-in is explained in 7a).
FS="-c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -movflags +faststart -fps_mode passthrough"

# pan "t0 x0 t1 x1 ..." prints an ffmpeg expression of t (seconds): x0, then a
# sine ease-in-out to each next value between the previous time and its time.
# Keyframes below: time on the clip's own timeline, window centre x in source
# pixels.
pan() {
  set -- $1
  local e="$2" t0="$1" x0="$2"
  shift 2
  while [ $# -ge 2 ]; do
    e="$e+($2-$x0)*(0.5-0.5*cos(PI*clip((t-$t0)/($1-$t0),0,1)))"
    t0="$1" x0="$2"
    shift 2
  done
  echo "$e"
}

# 7a. Cement, in the 560x436 picture band (x as in the band).
#     Scale 5: 216x384 window on band rows 1-384 (below the dark top line,
#     above the faint "@retra" mark at the bottom; the "TG:@retra" mark on
#     the right stays out). It holds the big plane, follows it as it drifts
#     left, pans right with it to the tower (impact ~1.9 s), settles on the
#     bounce. The video starts 0.16 s after the audio, so its first frame is
#     held 5 frames, exactly as in cement.mp4 (156 frames, 5.2 s, same sync).
#     The end card (last 14 frames) is wider than any 9:16 cover window: it is
#     shown whole (2.5x) on its own white, which also drops the mark under it.
CX=$(pan "0.167 280 0.30 287 1.10 157 1.20 157 2.20 236 2.25 236 3.05 188")
ffmpeg -v error -y -i "$CEMENT" -filter_complex "\
[0:v]crop=560:436:0:422,tpad=start=5:start_mode=clone,setpts=N/30/TB,split[a][b];\
[a]scale=5600:4360:flags=lanczos,format=yuv444p,crop=2160:3840:x='10*($CX)-1080':y=10,scale=1080:1920:flags=lanczos[plane];\
[b]crop=432:330:68:20,scale=1080:825:flags=lanczos,pad=1080:1920:0:488:color=0xFDFDFD[card];\
[plane][card]overlay=enable='gte(t,4.72)',unsharp=5:5:0.5,format=yuv420p[v]" \
  -map "[v]" -map 0:a $FS -c:a aac -b:a 192k "$OUT/cement-full.mp4"

# 7b. Reaction (-8 dB as above). Scale 4: 270x480 window from row 11 down
#     (frames 1-8 shake a black bar into the top rows), right of the TikTok
#     mark (x < 122); it drifts with the face.
RX=$(pan "0 261 1.333 266")
ffmpeg -v error -y -i "$REACTION" -vf "scale=3840:4352:flags=lanczos,format=yuv444p,crop=2160:3840:x='8*($RX)-1080':y=88,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,format=yuv420p" \
  -af "volume=-8dB" $FS -c:a aac -b:a 192k "$OUT/reaction-full.mp4"

# 7c. Girl (-3 dB as above). Scale 7.75: 139x248 window (full height), right
#     of the TikTok mark (x < 65), following her face. The source has no
#     colour tags and Remotion decodes untagged video as BT.601: its matrix is
#     converted to BT.709 so the tagged file keeps exactly the same colours.
GX=$(pan "0 148 1.9 158 3.6 153")
ffmpeg -v error -y -i "$GIRL" -vf "colormatrix=bt601:bt709,scale=3968:3844:flags=lanczos,format=yuv444p,crop=2160:3840:x='15.5*($GX)-1080':y=2,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,format=yuv420p" \
  -af "volume=-3dB" $FS -c:a aac -b:a 192k "$OUT/girl-full.mp4"

echo "Media written to $OUT"
