#!/usr/bin/env python3
"""
Builds the self-contained copy from `viewable/`.

`viewable/index.html` is the source of truth and references images as
files, which is what a browser and a human both want to work with. The
shareable copy has to be one file, so its images are inlined as data URIs.

Keeping the second copy generated rather than hand-edited is the point:
editing both by hand is how they drift, and they already did once.
"""
import base64, mimetypes, pathlib, re, shutil, sys

SRC = pathlib.Path("viewable")
DST = pathlib.Path("Paul_Chege_Financial_Advisory_Website")

html = (SRC / "index.html").read_text(encoding="utf-8")
inlined = skipped = 0

def datauri(path: pathlib.Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()

def swap(m):
    global inlined, skipped
    attr, url = m.group(1), m.group(2)
    if url.startswith(("data:", "http:", "https:", "//")):
        return m.group(0)
    f = SRC / url
    if not f.is_file():
        skipped += 1
        print(f"  ! missing {url}", file=sys.stderr)
        return m.group(0)
    inlined += 1
    return f'{attr}="{datauri(f)}"'

# src="…" and url('…') inside inline styles. Script sources are left alone
# on purpose: the 3D bundle is 558KB and is meant to stay a separate file
# that most visitors never download. It is copied beside this page instead.
html = re.sub(r'<script\b[^>]*>', lambda m: m.group(0).replace('src="', 'data-src="'), html)
html = re.sub(r'\b(src)="([^"]+)"', swap, html)
html = html.replace('data-src="', 'src="')
html = re.sub(r"""url\((['"]?)(?!data:|https?:)([^'")]+)\1\)""",
              lambda m: (lambda p: f"url('{datauri(p)}')" if p.is_file() else m.group(0))(SRC / m.group(2)),
              html)

DST.mkdir(exist_ok=True)
(DST / "index.html").write_text(html, encoding="utf-8")
if (SRC / "README.txt").is_file():
    shutil.copy(SRC / "README.txt", DST / "README.txt")

# The brand logos stay as files too, so the folder works either way.
if (SRC / "img").is_dir():
    shutil.rmtree(DST / "img", ignore_errors=True)
    shutil.copytree(SRC / "img", DST / "img")

# The scripts ship as real files. They are classic (non-module) bundles, so
# unlike ES modules they load correctly straight off the filesystem when
# somebody just double-clicks index.html.
if (SRC / "js").is_dir():
    shutil.rmtree(DST / "js", ignore_errors=True)
    shutil.copytree(SRC / "js", DST / "js")
    for f in sorted((DST / "js").iterdir()):
        print(f"  + {f.relative_to(DST)}  {len(f.read_bytes())/1024:,.0f} KB")

kb = len((DST / 'index.html').read_bytes()) / 1024
print(f"inlined {inlined} images ({skipped} missing) → {DST/'index.html'} {kb:,.0f} KB")
