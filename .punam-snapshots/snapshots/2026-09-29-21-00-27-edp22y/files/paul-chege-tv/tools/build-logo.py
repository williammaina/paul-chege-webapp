#!/usr/bin/env python3
r"""Derive the site's logo assets from a single source file.

    python3 tools/build-logo.py ~/Downloads/his\ logo.jpg

Trims the white margin, upscales, sharpens, and knocks the background out by
flood-filling inward from the edges — so white inside the artwork survives.
Writes public/img/logo.png, logo-mark.png and favicon.png.
"""
import sys, os
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/user/Downloads/his logo.jpg"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "img")
SCALE = 6
MARK_BOX = (0, 0, 68, 46)   # the P + microphone, in trimmed-source coordinates

src = Image.open(SRC).convert("RGB")
box = ImageChops.difference(src, Image.new("RGB", src.size, (255, 255, 255))).getbbox()
trim = src.crop(box)
big = trim.resize((trim.width * SCALE, trim.height * SCALE), Image.LANCZOS)
big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=135, threshold=3))

w, h = big.size
work, MARKER = big.copy(), (255, 0, 255)
seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
seeds += [(x, 0) for x in range(0, w, 10)] + [(x, h - 1) for x in range(0, w, 10)]
seeds += [(0, y) for y in range(0, h, 10)] + [(w - 1, y) for y in range(0, h, 10)]
for s in seeds:
    if work.getpixel(s) != MARKER:
        ImageDraw.floodfill(work, s, MARKER, thresh=34)

mask = Image.new("L", (w, h), 255)
wp, mp = work.load(), mask.load()
for y in range(h):
    for x in range(w):
        if wp[x, y] == MARKER:
            mp[x, y] = 0
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

full = big.convert("RGBA")
full.putalpha(mask)
full.save(os.path.join(OUT, "logo.png"), optimize=True)

mark = full.crop(tuple(v * SCALE for v in MARK_BOX))
mark = mark.crop(mark.getbbox())
mark.save(os.path.join(OUT, "logo-mark.png"), optimize=True)

side = max(mark.size) + 30
fav = Image.new("RGBA", (side, side), (0, 0, 0, 0))
fav.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)
fav.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "favicon.png"), optimize=True)

print("logo.png", full.size, "| logo-mark.png", mark.size, "| favicon.png 512x512")
