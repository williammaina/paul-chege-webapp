"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { reach, site } from "@/lib/content/site";
import { Reveal } from "@/components/motion/Reveal";

const expertise = [
  ["Debt & Borrowing Strategy", "Make informed borrowing decisions."],
  ["Financial Planning", "Build and organise your financial goals."],
  ["Business Financial Strategy", "Improve decision-making around capital and cash flow."],
  ["Financial Education", "Practical knowledge for real-life decisions."],
  ["Speaking & Workshops", "Financial literacy for teams and organisations."],
];

export function About({ onBook }: { onBook: () => void }) {
  const section = useRef<HTMLElement>(null);
  const [read, setRead] = useState(0);

  // How far through About you have read, 0..1. Drives the rail under the
  // portrait and the warmth of its ring.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setRead(1); return; }
    let queued = false;
    const paint = () => {
      queued = false;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - innerHeight * 0.5);
      setRead(Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / span)));
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    addEventListener("scroll", onScroll, { passive: true });
    paint();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={section} id="about" className="bg-cream py-[76px]">
      <div className="wrap grid gap-6 lg:grid-cols-[1.05fr_.75fr_.85fr]">
        <Reveal className="rounded-[18px] border border-[#e5e8eb] bg-white p-7 lg:p-[30px]">
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-ink">About Paul Chege</p>
          <h2 className="mt-1.5 text-[2.5rem] font-semibold leading-[1.05]">
            The broker who reads the small print out loud.
          </h2>
          <div className="mt-4 space-y-3 text-[#4b5c6e]">
            <p>Paul Chege is a financial advisor, banking professional and financial
               literacy advocate with extensive experience in Kenya&apos;s banking industry.
               He holds a Bachelor&apos;s degree in Business Administration and is pursuing a
               Master of Arts in Finance at KCA University.</p>
            <p>Drawing on his experience in one of Kenya&apos;s leading commercial banks, Paul
               has helped individuals and businesses make informed financial decisions.
               Alongside the media work he places cover as a licensed broker in partnership
               with <a href={site.bizsure} target="_blank" rel="noreferrer"
                       className="font-semibold text-gold-ink underline underline-offset-2">Bizsure</a>,
               coaches borrowers through offer letters and restructures, and pursues declined
               claims to settlement.</p>
            <p>In September 2026 he launched <b>The Anatomy of Smart Borrowing</b> at Safari
               Park Hotel, Nairobi — foreword by H.E. Rigathi Gachagua, Deputy President of Kenya.</p>
          </div>

          {/* Every figure here was read off the platform itself and is dated. */}
          <div className="mt-7 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {reach.map((r) => {
              const inner = (
                <>
                  <b className="block font-[family-name:var(--font-display)] text-[1.32rem] leading-none text-[#12304d] tnum">{r.value}</b>
                  <span className="mt-1.5 block text-[.76rem] font-bold text-[#4a5865]">{r.label}</span>
                  <small className="mt-0.5 block text-[.68rem] text-[#5d6b7a]">{r.sub}</small>
                </>
              );
              const cls = "block rounded-[13px] border border-[#e3e8ee] bg-white px-3 py-3.5 transition";
              return r.href
                ? <a key={r.label} href={r.href} target="_blank" rel="noreferrer"
                     className={`${cls} hover:-translate-y-0.5 hover:border-gold hover:shadow-md`}>{inner}</a>
                : <div key={r.label} className={cls}>{inner}</div>;
            })}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#book" className="rounded-[10px] bg-gold-bright px-5 py-3 font-bold text-navy">Explore his book →</a>
            <button onClick={onBook}
                    className="rounded-[10px] border border-[#cbd3dc] bg-white px-5 py-3 font-bold text-navy">
              Work with Paul
            </button>
          </div>
        </Reveal>

        {/* The portrait is a 2047x2048 square. Any frame that is not square
            makes object-fit:cover eat him alive — at 320x866 it showed a
            1:2.7 sliver. Square frame, zero crop, sticky so it follows. */}
        <div className="self-start lg:sticky lg:top-24" style={{ ["--ap" as string]: read }}>
          <figure className="relative aspect-square overflow-hidden rounded-[18px] bg-[#e9ecef]"
                  style={{ translate: `0 calc(var(--ap) * -12px)` }}>
            <Image src="/img/paul-chege-portrait.jpg" alt="Paul Chege, financial advisor and insurance broker"
                   fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover object-top" />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[18px]
                                         shadow-[inset_0_0_0_5px_rgba(255,255,255,.55)]"
                  style={{ border: `1px solid rgba(224,167,47,${0.24 + 0.5 * read})` }} />
          </figure>
          <div className="mt-3.5 hidden h-[3px] overflow-hidden rounded-sm bg-[rgba(12,34,56,.1)] lg:block">
            <i className="block h-full origin-left rounded-sm bg-[linear-gradient(90deg,#a8842a,#e6b84c_55%,#f3e5ab)]"
               style={{ transform: `scaleX(${read})` }} />
          </div>
        </div>

        <Reveal as="section" className="rounded-[18px] border border-[#e5e8eb] bg-white p-7 lg:p-[30px]">
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-ink">Areas of expertise</p>
          <ul className="mt-4 grid gap-4">
            {expertise.map(([t, s], i) => (
              <li key={t} className="grid grid-cols-[34px_1fr] items-start gap-2.5">
                <i className="not-italic font-extrabold text-gold-ink tnum">{String(i + 1).padStart(2, "0")}</i>
                <div>
                  <b className="block">{t}</b>
                  <small className="block text-[#5b6775]">{s}</small>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
