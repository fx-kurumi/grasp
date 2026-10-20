export PATH=~/.local/node24/bin:$PATH
O=~/rec-review/out
cd ~/rec-review/usage
BASE=http://127.0.0.1:5301 THEME=light node shoot-runs-plan.js $O/pr4/light runs-before 2>&1 | tail -3
for th in light dark; do for m in before after; do B=http://127.0.0.1:5301; [ $m = after ] && B=http://127.0.0.1:5305
 BASE=$B THEME=$th node vid.js $O/pr4/$th/list-pages-$m.webm 2>&1 | tail -3; done; done
echo EXTRA_DONE
