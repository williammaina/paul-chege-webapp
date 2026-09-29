"use client";

import { useEffect, useRef, useState } from "react";
import { framework } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";

/**
 * Five steps on one gold line that draws itself as the section arrives,
 * each step landing as the line reaches it. Below 1000px the grid wraps,
 * there is no line to follow, and the stagger switches off.
 */
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
    <section className="grain aurora relative isolate overflow-hidden py-[76px]
                        [background:radial-gradient(120%_90%_at_50%_-20%,rgba(230,184,76,.15),transparent_55%),linear-gradient(180deg,#03090f_0%,#081a2c_46%,#0c2340_100%)]">
      <div className="wrap relative z-10">
        <SectionHead dark eyebrow="The Paul Chege Financial Clarity Framework"
          title={<>A Simple Path to Better Financial Decisions.</>}
          lede={<>The order Paul works in on every call. You rarely need all five — most
                 people arrive somewhere in the middle and leave knowing which step is
                 actually theirs.</>} />

        <div ref={ref} className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <span aria-hidden
                className="absolute left-[8%] right-[8%] top-[30px] hidden h-0.5 origin-left lg:block
                           [background:linear-gradient(90deg,transparent,rgba(230,184,76,.55)_12%,rgba(230,184,76,.55)_88%,transparent)]"
                style={{ transform: `scaleX(${inView ? 1 : 0})`, transition: "transform 1.6s var(--ease-out-expo)" }} />
          {framework.map((f, i) => (
            <div key={f.n} className="relative z-10 px-2 py-3.5 text-center"
                 style={{
                   opacity: inView ? 1 : 0,
                   translate: inView ? "none" : "0 16px",
                   transition: `opacity .7s ease ${140 + i * 260}ms, translate .7s var(--ease-out-expo) ${140 + i * 260}ms`,
                 }}>
              <div className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full
                              border border-gold-bright font-extrabold text-gold-bright tnum
                              transition duration-500 hover:scale-110 hover:bg-gold-bright hover:text-navy">
                {f.n}
              </div>
              <b className="block font-[family-name:var(--font-display)] text-[1.2rem] text-white">{f.title}</b>
              <span className="mt-1.5 block text-[.88rem] text-[#b8c4ce]">{f.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
