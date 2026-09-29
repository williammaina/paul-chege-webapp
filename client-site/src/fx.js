import { initHero } from "./hero.js";

/**
 * Magnetic buttons.
 *
 * The primary calls to action lean toward the cursor as it approaches and
 * spring back when it leaves. One delegated pointermove for the whole
 * page, one rAF, and the transform is written to a custom property so it
 * composes with anything CSS is already doing to the element.
 */
function magnets() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover)").matches) return;

  const SEL = ".btn-gold, .btn-dark, .btn-mpesa, .cart";
  const PULL = 0.32;      // how far it follows, as a fraction of the offset
  const RANGE = 1.7;      // radii beyond the button that still attract

  let el = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

  const loop = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    if (el) el.style.setProperty("--mag", `${cx.toFixed(2)}px, ${cy.toFixed(2)}px`);
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      if (!tx && !ty && el) { el.style.removeProperty("--mag"); el = null; }
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  addEventListener("pointermove", (e) => {
    const hit = e.target.closest?.(SEL);
    const near = hit || el;
    if (!near) return;
    const r = near.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const inside = Math.abs(dx) < (r.width / 2) * RANGE && Math.abs(dy) < (r.height / 2) * RANGE;
    if (!inside) { tx = ty = 0; kick(); return; }
    if (el && el !== near) el.style.removeProperty("--mag");
    el = near;
    tx = dx * PULL; ty = dy * PULL;
    kick();
  }, { passive: true });

  addEventListener("pointerdown", () => { tx = ty = 0; kick(); }, { passive: true });
  addEventListener("blur", () => { tx = ty = 0; kick(); });
}


/**
 * Scroll-velocity skew.
 *
 * The episode grid leans into the direction of travel and settles when you
 * stop. Velocity is measured from the scroll position rather than read off
 * Lenis, so it behaves identically whether smooth scroll is running or not.
 *
 * The skew goes on the GRID, not the cards. The cards already carry their
 * own transforms — the reveal translate, the tilt — and a second transform
 * on the same element silently replaces the first rather than composing
 * with it. Skewing the parent lets both survive.
 */
function velocitySkew() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = [...document.querySelectorAll(".ep-grid, .speak-grid")];
  if (!targets.length) return;

  let live = false;
  const io = new IntersectionObserver((es) => {
    live = es.some((e) => e.isIntersecting);
    if (live && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: "60px" });
  targets.forEach((t) => io.observe(t));

  let last = window.scrollY, v = 0, raf = 0, idle = 0;

  function loop() {
    const now = window.scrollY;
    const raw = now - last;
    last = now;
    // Critically damped enough that a flick leans and returns without
    // oscillating, which is what makes it read as weight and not wobble.
    v += (raw - v) * 0.16;
    const s = Math.max(-1, Math.min(1, v / 58));
    for (const t of targets) t.style.setProperty("--sv", s.toFixed(4));

    // Stop the loop once it has genuinely settled, so an idle page is not
    // burning a frame callback forever.
    if (Math.abs(v) < 0.05 && Math.abs(raw) < 0.5) { idle++; } else { idle = 0; }
    if (!live || idle > 30) {
      for (const t of targets) t.style.setProperty("--sv", "0");
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  addEventListener("scroll", () => { idle = 0; if (live && !raf) raf = requestAnimationFrame(loop); }, { passive: true });
}


/**
 * Episode previews on hover.
 *
 * YouTube's animated `an_webp` previews and its storyboard sprites both
 * require signed URL parameters and answer 404/403 without them, so those
 * are out. But `i.ytimg.com/vi/<id>/hq1..hq3.jpg` are YouTube's own frames
 * from roughly a quarter, half and three quarters of the way through, and
 * they are unsigned. Cycling those four stills IS a preview of the video.
 *
 * The reason this route matters rather than just being convenient: the
 * page's stated position is that nothing is loaded from YouTube until a
 * visitor presses play, and there is a test asserting no iframe ships in
 * the markup. A hover iframe would contact youtube.com, set cookies and
 * pull about a megabyte per card. Three 18KB stills from the image host
 * the thumbnails already come from changes none of that.
 */
function episodePreviews() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;

  const INTENT = 240;   // ms of hover before a single byte is requested
  const HOLD   = 780;   // ms per frame
  const cache  = new Map();

  function framesFor(id) {
    if (cache.has(id)) return cache.get(id);
    const urls = [1, 2, 3].map((n) => `https://i.ytimg.com/vi/${id}/hq${n}.jpg`);
    const job = Promise.all(urls.map((u) => new Promise((res) => {
      const im = new Image();
      im.onload = () => res(u);
      im.onerror = () => res(null);        // a missing frame is skipped, not fatal
      im.src = u;
    }))).then((r) => r.filter(Boolean));
    cache.set(id, job);
    return job;
  }

  document.querySelectorAll(".ep, .ep-hero").forEach((card) => {
    const id = card.dataset.vid;
    const frame = card.querySelector(".ep-frame");
    if (!id || !frame) return;

    let layer = null, timer = 0, intent = 0, i = 0, alive = false;

    const stop = () => {
      alive = false;
      clearTimeout(intent); clearInterval(timer);
      if (layer) layer.classList.remove("on");
    };

    card.addEventListener("pointerenter", () => {
      clearTimeout(intent);
      intent = setTimeout(async () => {
        const urls = await framesFor(id);
        if (!urls.length) return;
        // The pointer may well have left during the fetch.
        if (!card.matches(":hover")) return;
        if (!layer) {
          layer = document.createElement("span");
          layer.className = "ep-preview";
          frame.appendChild(layer);
        }
        alive = true; i = 0;
        layer.style.backgroundImage = `url("${urls[0]}")`;
        layer.classList.add("on");
        clearInterval(timer);
        timer = setInterval(() => {
          if (!alive) return clearInterval(timer);
          i = (i + 1) % urls.length;
          layer.style.backgroundImage = `url("${urls[i]}")`;
        }, HOLD);
      }, INTENT);
    });

    card.addEventListener("pointerleave", stop);
    card.addEventListener("pointercancel", stop);
  });
}

/**
 * Depth on the service cards.
 *
 * These already tilted, but as a flat plane: the whole card rotated and
 * nothing inside it moved, which reads as a sheet of paper rather than an
 * object. Real `transform-style: preserve-3d` is not available here —
 * .lit sets overflow:hidden for the spotlight, and overflow flattens a 3D
 * context — so the depth is faked by parallaxing the contents against the
 * rotation, which is indistinguishable at these angles.
 */
function cardDepth() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover)").matches) return;

  let el = null, raf = 0, px = 0.5, py = 0.5;

  const paint = () => {
    raf = 0;
    if (!el) return;
    // -1..1 from the centre, which is what the CSS below multiplies up.
    el.style.setProperty("--px", ((px - 0.5) * 2).toFixed(3));
    el.style.setProperty("--py", ((py - 0.5) * 2).toFixed(3));
  };

  addEventListener("pointermove", (e) => {
    const hit = e.target.closest?.(".service-card.tilt");
    if (hit !== el) {
      if (el) { el.style.removeProperty("--px"); el.style.removeProperty("--py"); }
      el = hit;
    }
    if (!el) return;
    const r = el.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width;
    py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });

  addEventListener("pointerdown", () => {
    if (el) { el.style.removeProperty("--px"); el.style.removeProperty("--py"); el = null; }
  }, { passive: true });
}

try { initHero(); } catch (e) { /* the CSS gradient is still there */ }
try { magnets(); } catch (e) {}
try { velocitySkew(); } catch (e) {}
try { episodePreviews(); } catch (e) {}
try { cardDepth(); } catch (e) {}
