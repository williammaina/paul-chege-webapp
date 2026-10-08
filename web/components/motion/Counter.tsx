"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A metric that counts up the first time it is seen.
 *
 * The value stays a string in `site.ts` — "358.7K", "546K+", "151" — because
 * that is how it was read off the platform and the suffix carries meaning.
 * This parses the leading number, animates to it, and puts the rest back,
 * so no figure on the page has to be re-typed as a number to be animated.
 *
 * A value this cannot parse renders verbatim and never animates, which is
 * the right failure: a reach figure that silently became 0 would be a
 * false claim, not a missing effect.
 */
export function Counter({ value, className = "", ms = 1500 }: {
  value: string; className?: string; ms?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  const m = /^([\d.,]+)(.*)$/.exec(value.trim());
  const target = m ? Number(m[1].replace(/,/g, "")) : NaN;
  const suffix = m ? m[2] : "";
  const decimals = m && m[1].includes(".") ? m[1].split(".")[1].length : 0;

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        // Same expo curve as every other entrance on the page.
        const eased = 1 - Math.pow(1 - p, 4);
        setShown((target * eased).toFixed(decimals));
        if (p < 1) raf = requestAnimationFrame(tick); else setShown(null);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });

    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, decimals, ms]);

  return (
    <span ref={ref} className={className}>
      {shown === null ? value : shown + suffix}
    </span>
  );
}
