#!/usr/bin/env python3
"""
Compiles Tailwind over the markup and inlines the result.

Build time, not run time: the output is only the utilities the page
actually uses, so there is no compiler shipped to the browser and no flash
of unstyled content. Re-run after adding Tailwind classes to the markup.
"""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).parent
CLI = ROOT / "node_modules" / ".bin" / "tailwindcss"
PAGE = ROOT / "viewable" / "index.html"
OUT = ROOT / ".tw.css"
BEGIN, END = "/*__TAILWIND_BEGIN__*/", "/*__TAILWIND_END__*/"

if not CLI.exists():
    sys.exit(f"tailwind cli not found at {CLI}")

r = subprocess.run([str(CLI), "-i", str(ROOT / "tailwind.css"), "-o", str(OUT), "--minify"],
                   cwd=ROOT, capture_output=True, text=True)
if r.returncode:
    sys.exit(r.stderr.strip() or "tailwind build failed")

css = OUT.read_text(encoding="utf-8").strip()
html = PAGE.read_text(encoding="utf-8")
block = f"{BEGIN}\n{css}\n{END}"

if BEGIN in html:
    html = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), lambda _: block, html, flags=re.S)
else:
    # Last in the stylesheet, so utilities can override the hand-written CSS.
    html = html.replace("\n</style>", "\n" + block + "\n</style>", 1)

PAGE.write_text(html, encoding="utf-8")
print(f"tailwind: {len(css)/1024:.1f} KB inlined into {PAGE.name}")
