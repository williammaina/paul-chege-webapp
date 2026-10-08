"use client";

import { useEffect, useRef } from "react";

/**
 * A hairline across the top of the page that fills as you read.
 *
 * Writes `scaleX` straight onto the bar's style from inside a rAF rather
 * than going through React state: this fires on every scroll frame, and a
 * `setState` per frame would re-render the whole tree sixty times a second
 * to move one element.
 *
 * It sits behind the header (`z-40` against the header's `z-50`), so the
 * blurred bar reads over it rather than the other way round.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };

    paint();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]">
      <div ref={ref}
           className="h-full origin-left scale-x-0
                      [background:linear-gradient(90deg,var(--color-accent-gold),var(--color-accent-coral)_55%,var(--color-accent-violet))]" />
    </div>
  );
}
