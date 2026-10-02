"use client";

import { useEffect, useRef, useState } from "react";
import { framework } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";

/**
 * Five steps on one gold line that draws itself as the section arrives,
 * each step landing as the line reaches it. Below 1000px the grid wraps,
 * there is no line to follow, and the stagger switches off.
 */
/* Understand, Borrow, Build, Protect, Grow — stepped across the accent set
   so the rail and the rings agree about where in the journey you are. */
const STEP_ACCENT = [
  "var(--color-accent-gold)",
  "color-mix(in oklab, var(--color-accent-gold), var(--color-accent-coral))",
  "var(--color-accent-coral)",
  "color-mix(in oklab, var(--color-accent-coral), var(--color-accent-violet))",
  "var(--color-accent-violet)",
];

export function Framework() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section grain aurora relative isolate overflow-hidden
                        [background:radial-gradient(120%_90%_at_50%_-20%,rgba(230,184,76,.15),transparent_55%),linear-gradient(180deg,#03090f_0%,#0e2439_46%,#0c2340_100%)]">
      <div className="wrap relative z-10">
        <SectionHead dark eyebrow="The Paul Chege Financial Clarity Framework"
          title={<>A Simple Path to Better Financial Decisions.</>}
          lede={<>The order Paul works in on every call. You rarely need all five — most
                 people arrive somewhere in the middle and leave knowing which step is
                 actually theirs.</>} />

        <div ref={ref} className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* The rail now travels the accent set rather than one gold, so the
              five steps read as a progression instead of five of the same. */}
          <span aria-hidden
                className="absolute left-[8%] right-[8%] top-[30px] hidden h-0.5 origin-left lg:block
                           [background:linear-gradient(90deg,transparent,var(--color-accent-gold)_12%,var(--color-accent-coral)_50%,var(--color-accent-violet)_88%,transparent)]"
                style={{ transform: `scaleX(${inView ? 1 : 0})`, transition: "transform 1.6s var(--ease-out-expo)" }} />
          {framework.map((f, i) => (
            <div key={f.n} className="group relative z-10 px-2 py-3.5 text-center"
                 style={{
                   ["--accent" as string]: STEP_ACCENT[i],
                   opacity: inView ? 1 : 0,
                   translate: inView ? "none" : "0 16px",
                   transition: `opacity .7s ease ${140 + i * 260}ms, translate .7s var(--ease-out-expo) ${140 + i * 260}ms`,
                 }}>
              <div className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full
                              border font-extrabold tnum transition-all duration-500
                              [transition-timing-function:var(--ease-out-back)]
                              group-hover:scale-110 motion-reduce:transition-none
                              motion-reduce:group-hover:scale-100"
                   style={{
                     borderColor: "var(--accent)",
                     color: "var(--accent)",
                     boxShadow: inView ? "0 0 0 0 transparent" : undefined,
                   }}>
                {f.n}
              </div>
              <b className="block font-[family-name:var(--font-display)] text-[1.2rem] text-text-primary">{f.title}</b>
              <span className="mt-1.5 block text-[.88rem] leading-[1.6] text-text-tertiary">{f.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
