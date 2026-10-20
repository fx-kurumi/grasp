set -e
R=/workspace/review-assets/raw/out; S=/workspace/review-assets/site; C="python3 /workspace/review-assets/compose.py"
M="main 8e8a4823（改前）"
mp4() { ffmpeg -loglevel error -y -i "$1" -c:v libx264 -pix_fmt yuv420p -crf 30 -preset veryfast -movflags +faststart -an "$2"; }
sbs() { ffmpeg -loglevel error -y -i "$1" -i "$2" -filter_complex "[0:v]scale=960:-2,pad=964:ih:0:0:color=0xdddddd[a];[1:v]scale=960:-2[b];[a][b]hstack=inputs=2:shortest=0,format=yuv420p" -c:v libx264 -crf 30 -preset veryfast -movflags +faststart -an "$3"; }
# PR1 chat items 1-4 + 13
mkdir -p $S/pr1-chat-shell
for th in light dark; do
  for n in 01-connecting 02-pulling 03-creating 04-react-thinking 05-streaming 06-done 07-draft 08-scrollbar-zoom; do
    $C $R/pr1/before/$th/chat/$n.png $R/pr1/after/$th/chat/$n.png $S/pr1-chat-shell/$n-$th.png "$M" "本 PR e2b53685（改后）" 1800; done
  sbs $R/pr1/before/$th/chat/flow.webm $R/pr1/after/$th/chat/flow.webm $S/pr1-chat-shell/chat-flow-side-by-side-$th.mp4
  mp4 $R/pr1/after/$th/chat/flow.webm $S/pr1-chat-shell/chat-flow-after-$th.mp4
  for n in 00-initial 01-typing-new-item 02-after-edit 03-idle-new-and-removed; do
    $C $R/pr1/item5/$th/shots/$n-before.png $R/pr1/item5/$th/shots/$n-after.png $S/pr1-chat-shell/item5-$n-$th.png "$M" "本 PR e2b53685（改后）" 1800; done
  sbs $R/pr1/item5/$th/video/gates-auto-refresh-before.webm $R/pr1/item5/$th/video/gates-auto-refresh-after.webm $S/pr1-chat-shell/item5-side-by-side-$th.mp4
done
# PR2
mkdir -p $S/pr2-gate-cold
for th in light dark; do t=""; [ $th = dark ] && t="-dark"
  for n in 00-initial 01-comment-filled 02-confirm-with-comment-hover 03-confirming 04-after-confirm-next-gate 05-confirm-no-comment-hover 07-after-confirm; do
    $C $R/pr2/$th/shots/$n-before$t.png $R/pr2/$th/shots/$n-after$t.png $S/pr2-gate-cold/$n-$th.png "$M" "本 PR 2f90b919（改后）" 1800; done
  sbs $R/pr2/$th/video/gate-cold-before$t.webm $R/pr2/$th/video/gate-cold-after$t.webm $S/pr2-gate-cold/gate-cold-side-by-side-$th.mp4
done
# PR3
mkdir -p $S/pr3-notification-menu
for th in light dark; do for d in mixed read; do
  $C $R/pr3/before-$th-$d.png $R/pr3/after-$th-$d.png $S/pr3-notification-menu/$d-$th.png "$M" "本 PR eedbab67（改后）"; done
  $C $R/pr3/before-$th-mixed-full.png $R/pr3/after-$th-mixed-full.png $S/pr3-notification-menu/full-mixed-$th.png "$M" "本 PR eedbab67（改后）" 1800
  sbs $R/pr3/notif-before-$th.webm $R/pr3/notif-after-$th.webm $S/pr3-notification-menu/notif-side-by-side-$th.mp4
done
# PR4
mkdir -p $S/pr4-list-pages
for th in light dark; do
  for pg in usage runs; do for w in 1280 1440; do
    $C $R/pr4/$th/$pg-before-$w-top.png $R/pr4/$th/$pg-after-$w-top.png $S/pr4-list-pages/$pg-$w-top-$th.png "$M" "本 PR 615600cb（改后）" 2000
    $C $R/pr4/$th/$pg-before-$w-full.png $R/pr4/$th/$pg-after-$w-full.png $S/pr4-list-pages/$pg-$w-full-$th.png "$M" "本 PR 615600cb（改后）" 2000
  done; done
  for n in hover menu filtered; do [ -f $R/pr4/$th/runs-before-1280-$n.png ] && [ -f $R/pr4/$th/runs-after-1280-$n.png ] && $C $R/pr4/$th/runs-before-1280-$n.png $R/pr4/$th/runs-after-1280-$n.png $S/pr4-list-pages/runs-1280-$n-$th.png "$M" "本 PR 615600cb（改后）" 2000 || true; done
  for f in runs-after-1280-menu usage-after-1280-filter-open; do [ -f $R/pr4/$th/$f.png ] && cp $R/pr4/$th/$f.png $S/pr4-list-pages/$f-$th.png || true; done
  sbs $R/pr4/$th/list-pages-before.webm $R/pr4/$th/list-pages-after.webm $S/pr4-list-pages/list-pages-side-by-side-$th.mp4
done
# PR5 (before = main, same capture as PR1 before)
mkdir -p $S/pr5-boot-checklist
for th in light dark; do
  for n in 01-connecting 02-pulling 03-creating 04-react-thinking 05-streaming 06-done; do
    $C $R/pr1/before/$th/chat/$n.png $R/pr5/after/$th/chat/$n.png $S/pr5-boot-checklist/$n-$th.png "$M" "本 PR b06ac218（改后，叠在 PR1 上）" 1800; done
  sbs $R/pr1/before/$th/chat/flow.webm $R/pr5/after/$th/chat/flow.webm $S/pr5-boot-checklist/boot-side-by-side-$th.mp4
  mp4 $R/pr5/after/$th/chat/flow.webm $S/pr5-boot-checklist/boot-after-$th.mp4
done
echo BUILD_OK
