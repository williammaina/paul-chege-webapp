/**
 * Contrast audit.
 *
 * Paste into the console, or run through a headless browser, on the page
 * you want to check. Returns a report and prints a table.
 *
 * Three things the naive version got wrong, all of which produced answers
 * I acted on:
 *
 *   1. Translucent layers. An `rgba(…, .12)` overlay is not the backdrop;
 *      it has to be composited over whatever is behind it. Without this a
 *      dark glyph on a dark translucent chip read as 1:1.
 *
 *   2. Gradients. Returning "unknown" for any ancestor with a
 *      background-image skipped real text. A gradient is not one colour,
 *      so its stops are parsed and the text is tested against the LIGHTEST
 *      and DARKEST of them — if it passes both, it passes everywhere on
 *      that gradient. Only genuine raster images are skipped.
 *
 *   3. No element path in the output. Two different elements both read
 *      "01", and I fixed the wrong one because the report did not say
 *      which was which. Every row now carries its full selector path.
 */
(() => {
  const AA = { normal: 4.5, large: 3 };

  const parse = (c) => {
    const m = String(c).match(/[\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
  };
  const over = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a), a: 1,
  });
  const lum = (o) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(o.r) + 0.7152 * f(o.g) + 0.0722 * f(o.b);
  };
  const ratio = (x, y) => {
    const a = lum(x), b = lum(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  /**
   * Splits a background-image into its top-level layers. CSS paints the
   * FIRST layer nearest the viewer, so the list is reversed to give
   * painting order (deepest first). Commas inside rgb()/gradient() must
   * not split, hence the depth counter rather than a plain .split(",").
   */
  const layersOf = (bgImage) => {
    if (!bgImage || bgImage === "none") return [];
    const out = [];
    let depth = 0, buf = "";
    for (const ch of bgImage) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (ch === "," && depth === 0) { out.push(buf.trim()); buf = ""; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out.reverse();
  };

  /** The colour stops of one gradient layer, or null if it is a raster image. */
  const stopsOf = (layer) => {
    if (!/gradient\(/.test(layer) || /url\(/.test(layer)) return null;
    const out = [];
    for (const m of layer.matchAll(/rgba?\([^)]*\)/g)) {
      const c = parse(m[0]);
      if (c) out.push(c);
    }
    return out;
  };

  const path = (el) => {
    const p = [];
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      p.push(n.tagName.toLowerCase() +
        (n.id ? "#" + n.id : "") +
        (n.className && typeof n.className === "string"
          ? "." + n.className.trim().split(/\s+/).slice(0, 3).join(".") : ""));
    }
    return p.reverse().join(" > ");
  };

  /**
   * Every candidate backdrop behind an element.
   *
   * Layers are collected from the element outward, then composited from the
   * DEEPEST one forward — the earlier version folded them the other way
   * round, which put a section's gradient on top of the white card sitting
   * over it and reported cream backdrops for text that is actually on white.
   *
   * A gradient is not one colour, so its darkest and lightest stops are both
   * carried through and the text is scored against the worse of the two.
   */
  let sawImagery = false;
  const backdrops = (el) => {
    const stack = [];            // closest to the element first
    let seed = null;             // the deepest thing we found
    sawImagery = false;

    /* Reads one style's background layers into the stack. */
    const take = (cs) => {
      for (const layer of layersOf(cs.backgroundImage)) {
        const stops = stopsOf(layer);
        if (stops === null) { sawImagery = true; return "raster"; }
        if (stops.length) stack.push({ gradient: stops });
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) stack.push({ flat: c });
      return c && c.a >= 1 ? c : null;
    };

    /*
     * Pseudo-elements are deliberately NOT read.
     *
     * Two attempts to account for them both failed, in opposite
     * directions. Treating every positioned pseudo with a background as a
     * backdrop took the count from 12 to 93, because a hover spotlight, a
     * gradient border and an aurora bloom are positioned pseudos with
     * backgrounds too. Trying to tell a scrim apart by its inset then
     * marked 92 items unverifiable, because getComputedStyle resolves
     * `top`/`left` on a positioned element to used pixels, so an ordinary
     * 2px underline looks exactly like a full-box scrim.
     *
     * So this reports what it can actually prove: the real background
     * layers. Where an ancestor is a photograph the result is marked
     * `overImagery`, meaning the true contrast is probably better than the
     * number shown and a human should look. Conservative, and honest about
     * which it is.
     */
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const got = take(getComputedStyle(n));
      if (got === "raster") return null;
      if (got) { seed = got; break; }
    }
    if (!seed) seed = { r: 255, g: 255, b: 255, a: 1 };

    // Two runs: one always taking each gradient's darkest stop, one its
    // lightest. Fold from the deepest layer forward.
    const fold = (pick) => {
      let acc = seed;
      for (let i = stack.length - 1; i >= 0; i--) {
        const l = stack[i];
        if (l.flat) { acc = over(l.flat, acc); continue; }
        const sorted = [...l.gradient].sort((a, b) => lum(over(a, acc)) - lum(over(b, acc)));
        acc = over(pick === "dark" ? sorted[0] : sorted[sorted.length - 1], acc);
      }
      return acc;
    };

    const dark = fold("dark"), light = fold("light");
    return lum(dark) === lum(light) ? [dark] : [dark, light];
  };

  const rows = [];
  let skipped = 0;
  for (const el of document.querySelectorAll("*")) {
    if (el.children.length || !el.textContent.trim()) continue;
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
    const bgs = backdrops(el);
    if (!bgs) { skipped++; continue; }
    const overImagery = [...(function* (n) { while (n && n !== document.documentElement) { yield n; n = n.parentElement; } })(el)]
      .some((n) => /url\(/.test(getComputedStyle(n).backgroundImage));

    const cs = getComputedStyle(el);
    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? AA.large : AA.normal;

    // Worst case across every candidate backdrop.
    let worst = Infinity, against = null;
    for (const bg of bgs) {
      const r = ratio(over(fgRaw, bg), bg);
      if (r < worst) { worst = r; against = bg; }
    }
    if (worst < need) {
      rows.push({
        text: el.textContent.trim().slice(0, 40),
        colour: cs.color,
        against: `rgb(${Math.round(against.r)}, ${Math.round(against.g)}, ${Math.round(against.b)})`,
        ratio: +worst.toFixed(2), need, size: +size.toFixed(1),
        overImagery, path: path(el),
      });
    }
  }

  rows.sort((a, b) => a.ratio - b.ratio);
  const overImg = rows.filter((r) => r.overImagery).length;
  console.log(`contrast: ${rows.length} failing (${overImg} of them over imagery, ` +
    `where a scrim may already fix it — check by eye) · ${skipped} skipped`);
  if (rows.length) console.table(rows.map(({ path, ...r }) => r));
  rows.forEach((r) => console.log(`  ${r.ratio}  ${r.text}\n      ${r.path}`));
  return { failures: rows.length, overImagery: overImg, skipped, rows };
})();
