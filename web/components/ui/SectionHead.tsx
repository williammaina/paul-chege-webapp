"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { useEffect, useRef, useState } from "react";

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`relative inline-block text-[.7rem] font-extrabold uppercase tracking-[.18em]
                   ${dark ? "text-gold-400" : "text-gold-ink"}`}>
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow, title, lede, dark = false,
}: { eyebrow: string; title: ReactNode; lede?: ReactNode; dark?: boolean }) {
  // The rule under the eyebrow draws itself the first time the head is
  // seen. One observer per heading, disconnected on arrival.
  const rule = useRef<HTMLSpanElement | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = rule.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setDrawn(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setDrawn(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Reveal className="mb-11 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-14">
      <div>
        <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
        <span ref={rule} aria-hidden
              className="mt-2.5 block h-0.5 w-[72px] origin-left rounded-full
                         [background:linear-gradient(90deg,var(--color-accent-gold),var(--color-accent-coral))]"
              style={{
                transform: `scaleX(${drawn ? 1 : 0})`,
                transition: "transform 1s var(--ease-out-expo) 120ms",
              }} />
        <h2 className={`mt-4 text-[clamp(1.85rem,.85rem+2.4vw,2.6rem)] font-semibold leading-[1.02]
                        ${dark ? "text-white" : ""}`}>
          {title}
        </h2>
      </div>
      {lede && (
        <p className={`max-w-[560px] ${dark ? "text-text-tertiary" : "text-[#5f6c7d]"}`}>{lede}</p>
      )}
    </Reveal>
  );
}
