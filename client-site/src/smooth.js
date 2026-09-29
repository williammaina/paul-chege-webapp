/**
 * Smooth scroll, on its own so it can load on every device.
 *
 * Lenis normalises wheel and trackpad momentum. It still drives the real
 * document scroll position, so the scrollspy, the progress rail and the
 * About read-position all keep working with no changes.
 */
import Lenis from "lenis";

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  document.documentElement.style.scrollBehavior = "auto";

  // The page's own anchors and its scrollIntoView() calls have to go
  // through Lenis, or native scrolling fights the interpolation.
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: -86 });
  });

  const native = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    // Anything inside a scrollable panel (the booking modal) still uses the
    // browser's own behaviour — Lenis only owns the page.
    if (this.closest && this.closest("[data-lenis-prevent]")) {
      return native.apply(this, args);
    }
    return lenis.scrollTo(this, { offset: -86 });
  };

  const tick = (t) => { lenis.raf(t); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
