#!/usr/bin/env python3
"""Post-prerender tidy-up: 404, templating paths, robots, sitemap, host configs.

Run after `npm run build` and after the browser prerender pass has written
dist/<route>/index.html and dist/pages/<route>.html.
"""
import glob, json, os, re
from datetime import date

DIST = os.path.join(os.path.dirname(__file__), "..", "dist")
ORIGIN = "https://paulchege.co.ke"
# `checkout` and `order` are deliberately absent: one is a step inside a
# purchase, the other is personal to a single order. Both still work on a
# static host through the SPA fallback written at the bottom of this file.
ROUTES = [("", "1.0"), ("about", "0.8"), ("services", "0.9"), ("book", "0.9"),
          ("tv-hub", "0.8"), ("calculator", "0.9"), ("booking", "0.7"),
          ("contact", "0.7"), ("faq", "0.8"), ("privacy", "0.3"), ("terms", "0.3")]

# GitHub Pages serves 404.html for unknown paths
src = os.path.join(DIST, "404", "index.html")
if os.path.exists(src):
    os.replace(src, os.path.join(DIST, "404.html"))
    os.rmdir(os.path.join(DIST, "404"))

for f in glob.glob(os.path.join(DIST, "pages", "*.html")):
    if f.endswith("404.html"):
        os.remove(f); continue
    s = open(f).read()
    s = s.replace('href="/assets/', 'href="../assets/').replace('src="/assets/', 'src="../assets/')
    s = s.replace('src="/img/', 'src="../img/').replace('href="/img/', 'href="../img/')
    s = s.replace('src="/config.js"', 'src="../config.js"')
    s = re.sub(r'url\((["\']?)/img/', r'url(\1../img/', s)
    open(f, "w").write(s)

for f in glob.glob(os.path.join(DIST, "**", "*.html"), recursive=True):
    if "/pages/" in f.replace("\\", "/"):
        continue
    s = open(f).read()
    o = s
    s = s.replace('src="./config.js"', 'src="/config.js"')
    s = s.replace('"logo": "/img/logo.png"', '"logo": "/img/logo.webp"')
    s = s.replace('"image": "/img/paul-chege.jpg"', '"image": "/img/paul-chege.webp"')
    if s != o:
        open(f, "w").write(s)

# originals are superseded by the WebP set; they stay in public/ and in source/
for pat in ["paul-cutout.png", "logo.png", "logo-mark.png", "book-cover.jpg",
            "paul-ndindi-nyoro.jpg", "paul-chege.jpg", "book-launch.jpeg",
            "share-card.jpg", "paul-chege-full.png", "brands/*.png"]:
    for f in glob.glob(os.path.join(DIST, "img", pat)):
        os.remove(f)
for f in glob.glob(os.path.join(DIST, "prototype.html")):
    os.remove(f)

open(os.path.join(DIST, "robots.txt"), "w").write(
    f"User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n")

today = date.today().isoformat()
urls = "\n".join(
    f"  <url>\n    <loc>{ORIGIN}/{r}</loc>\n    <lastmod>{today}</lastmod>"
    f"\n    <priority>{p}</priority>\n  </url>" for r, p in ROUTES)
open(os.path.join(DIST, "sitemap.xml"), "w").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n")

open(os.path.join(DIST, "_redirects"), "w").write("/*    /index.html   200\n")
json.dump({"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]},
          open(os.path.join(DIST, "vercel.json"), "w"), indent=2)

print("static tidy-up done ·", len(ROUTES), "routes in the sitemap")
