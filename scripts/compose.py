import sys
from PIL import Image, ImageDraw, ImageFont
FONT = None
for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','/usr/share/fonts/truetype/wqy/wqy-microhei.ttc','/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc']:
    try: FONT = ImageFont.truetype(f, 22); break
    except Exception: pass
FONT = FONT or ImageFont.load_default()
def compare(a, b, out, la, lb, maxw=None):
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    h = max(A.height, B.height); pad = 16; top = 44
    W = A.width + B.width + pad * 3
    s = Image.new('RGB', (W, h + top + pad), (238, 238, 240))
    d = ImageDraw.Draw(s)
    s.paste(A, (pad, top)); s.paste(B, (pad * 2 + A.width, top))
    d.text((pad, 10), la, fill=(60, 60, 70), font=FONT); d.text((pad * 2 + A.width, 10), lb, fill=(60, 60, 70), font=FONT)
    if maxw and s.width > maxw: s = s.resize((maxw, int(s.height * maxw / s.width)), Image.LANCZOS)
    s.save(out, optimize=True)
if __name__ == '__main__':
    a, b, out, la, lb = sys.argv[1:6]; mw = int(sys.argv[6]) if len(sys.argv) > 6 else None
    compare(a, b, out, la, lb, mw)
