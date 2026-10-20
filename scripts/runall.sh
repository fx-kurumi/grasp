#!/usr/bin/env bash
export PATH=~/.local/node24/bin:$PATH
cd ~/rec-review; O=~/rec-review/out; MAIN=http://127.0.0.1:5301
declare -A HEAD=([pr1]=5302 [pr2]=5303 [pr3]=5304 [pr4]=5305 [pr5]=5306)
run() { echo "## $*"; timeout 400 "$@" 2>&1 | tail -4; }
for th in light dark; do
  for m in before after; do
    for pr in pr1 pr5; do [ $m = before ] && [ $pr = pr5 ] && continue
      B=$MAIN; [ $m = after ] && B=http://127.0.0.1:${HEAD[$pr]}
      BASE=$B OUT=$O/$pr/$m/$th/chat THEME=$th run node chat.mjs; done
    B=$MAIN; [ $m = after ] && B=http://127.0.0.1:5302
    BASE=$B OUT=$O/pr1/item5/$th THEME=$th run node item5.mjs $m video
    B=$MAIN; [ $m = after ] && B=http://127.0.0.1:5303
    if [ $th = dark ]; then BASE=$B OUT=$O/pr2/$th run node gatecold.mjs $m video dark; else BASE=$B OUT=$O/pr2/$th run node gatecold.mjs $m video; fi
    B=$MAIN; [ $m = after ] && B=http://127.0.0.1:5304
    mkdir -p $O/pr3; for d in read mixed; do BASE=$B run node notif.mjs $m $th $d $O/pr3; done
    B=$MAIN; [ $m = after ] && B=http://127.0.0.1:5305
    (cd usage && BASE=$B THEME=$th run node shoot-usage-plan.js $O/pr4/$th usage-$m && BASE=$B THEME=$th run node shoot-runs-plan.js $O/pr4/$th runs-$m)
  done
done
echo RUNALL_DONE
