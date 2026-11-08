#!/bin/bash
# qa/stills.sh "t1 t2 ..." [scale]  -> qa/still_<t>.png and qa/sheet.png
cd "$(dirname "$0")/.."
TS="$1"; SC="${2:-0.4}"
npx remotion bundle src/index.ts --out-dir=build >/dev/null 2>&1 || { echo bundle failed; npx remotion bundle src/index.ts --out-dir=build; exit 1; }
for t in $TS; do
  f=$(python3 -c "print(round($t*60))")
  npx remotion still build RingFinger qa/still_$t.png --frame=$f --scale=$SC --log=error &
done; wait
python3 - "$TS" <<'PY'
import sys; from PIL import Image, ImageDraw
ts=sys.argv[1].split(); ims=[Image.open(f"qa/still_{t}.png") for t in ts]
w,h=ims[0].size; cols=min(5,len(ims)); rows=(len(ims)+cols-1)//cols
sh=Image.new("RGB",(cols*w,rows*(h+30)),"white"); d=ImageDraw.Draw(sh)
for i,(t,im) in enumerate(zip(ts,ims)):
    x,y=(i%cols)*w,(i//cols)*(h+30); sh.paste(im,(x,y+30)); d.text((x+8,y+8),f"t={t}",fill="black")
sh.save("qa/sheet.png")
PY
