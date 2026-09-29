# Building the site

`viewable/` is the source of truth. Two build steps, then the shareable
single file is generated — never hand-edited.

```bash
npm install          # Tailwind CLI, once
npm run build        # compiles Tailwind, then inlines images
```

## Tailwind

Compiled at **build time** by `build-tailwind.py`, and the output inlined
into the page between `/*__TAILWIND_BEGIN__*/` markers. Only the utilities
the markup actually uses are emitted — currently about 11 KB.

This is deliberately **not** the Play CDN. That ships a ~400KB compiler
that rebuilds the stylesheet in the browser on every load, which means a
flash of unstyled content and a slower page; Tailwind's own docs say not to
use it in production. Re-run `npm run build:css` after adding classes.

## The standalone copy

`build-standalone.py` reads `viewable/index.html`, inlines every local
image as a data URI, and writes `Paul_Chege_Financial_Advisory_Website/`.
That folder is generated output. Editing it by hand is how the two copies
drift, and they already did once.

## The 3D book (added in the graphics pass)

`src/scene.js` and `src/smooth.js` are bundled by esbuild into
`viewable/js/`. Rebuild them with:

    npx esbuild src/smooth.js --bundle --minify --format=iife --target=es2020 --outfile=viewable/js/smooth.js
    npx esbuild src/scene.js  --bundle --minify --format=iife --target=es2020 --outfile=viewable/js/scene.js

Both are **classic IIFE bundles, not ES modules**, deliberately: a module
`<script type="module" src="…">` is blocked by CORS when index.html is
opened straight off the filesystem, which is exactly how the shareable
copy gets used. Classic scripts load fine there.

`build-standalone.py` copies `viewable/js/` next to the generated page and
leaves `<script src>` alone rather than inlining it, so the 550KB scene
stays a separate file that most visitors never download.

### What loads, and when
- `smooth.js` (20KB, Lenis) — every device except `prefers-reduced-motion`.
- `scene.js` (550KB, three.js) — only on a fine pointer, with WebGL2,
  >3GB reported memory, >2 cores, and only once the reader is within one
  screen of the book section. Phones and tablets keep the CSS book.

### Two things that will bite whoever edits the scene
- **UnrealBloomPass cannot be used here.** Its composite writes alpha 1
  across the whole screen quad, which turns the transparent canvas into a
  solid rectangle over the navy band. The bloom is done inside the grade
  pass instead, weighted by the scene's own alpha.
- **Every post-processing effect must be multiplied by alpha** for the
  same reason — grain and vignette painted onto empty pixels draw a box
  around the scene.

### `js/fx.js` (6KB) — hero shader, magnets, velocity skew, first paint

Three effects that all fail safe:

- **Hero shader** — raw WebGL2, one fullscreen triangle. If the shader will
  not compile, `.hero-gl-on` is never added and the CSS gradient underneath
  is untouched. It runs on phones too; only the 550KB book scene is
  desktop-only.
- **Velocity skew** — the lean goes on `.ep-grid` / `.speak-grid`, never on
  the cards. The cards already carry their own `transform` (reveal
  translate, pointer tilt) and a second `transform` on the same element
  replaces the first rather than composing with it. The rAF stops itself
  after 30 idle frames.
- **First paint** — the entry states are scoped to `.booting`, a class that
  only exists because the inline script in `<head>` ran. **No script means
  nothing is hidden**, which is the property that matters: a page that
  stays blank because an animation never started is far worse than a page
  with no animation. There is also a hard 1600ms timeout that starts the
  sequence regardless of whether fonts ever resolve.

Rebuild it with:

    npx esbuild src/fx.js --bundle --minify --format=iife --target=es2020 --outfile=viewable/js/fx.js

### Episode previews on hover

Hovering an episode cycles YouTube's own frames from roughly a quarter,
half and three quarters through the video:
`https://i.ytimg.com/vi/<id>/hq1.jpg` .. `hq3.jpg`.

Two routes were tried first and do not work: `an_webp/<id>/mqdefault_6s.webp`
(YouTube's animated preview) answers **404** and
`sb/<id>/storyboard3_L*/M0.jpg` (the storyboard sprite) answers **403** —
both need signed `sqp`/`rs` parameters that only YouTube's own client
generates. Do not spend time on them again.

An iframe would have worked, and was rejected deliberately: it contacts
youtube.com, sets cookies and costs roughly a megabyte per card, which
would break the page's stated position that **nothing loads from YouTube
until a visitor presses play**. Three unsigned 12KB stills from the image
host the posters already come from change none of that.

The layer is created by JS on first hover after 240ms of hover intent, so
a visitor who never hovers an episode requests nothing. Skipped entirely
on coarse pointers, on `prefers-reduced-motion`, and when
`navigator.connection.saveData` is set.

### Depth on the service cards

`--px` / `--py` are -1..1 from the card centre. The card rotates via
`.tilt`; these parallax the CONTENTS against that rotation, graduated by
apparent depth — icon 9px, heading 6px, link 5px, body copy 2.5px, and the
ghost numeral **-7px** because it sits behind the card face. That
opposition is most of what reads as depth.

`transform-style: preserve-3d` would be the textbook answer and is not
available: `.lit` sets `overflow:hidden` for the pointer spotlight, and an
element with clipped overflow flattens its 3D context. Removing that
overflow would break the spotlight and the photo-card scrim rounding.
