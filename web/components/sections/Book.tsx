"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { bookFacts } from "@/lib/content/site";
import { Reveal } from "@/components/motion/Reveal";
import { usePrices } from "@/lib/usePrices";
import { FreeChapter } from "@/components/sections/FreeChapter";
import { useAffordable3D } from "@/lib/useAffordable3D";

// three.js is 550KB, so it is never in the first load and never fetched at
// all on a device that will not run it.
const BookCanvas = dynamic(() => import("@/components/three/BookCanvas").then((m) => m.BookCanvas), {
  ssr: false,
});

const CHIP_ACCENT = [
  "var(--color-accent-gold)",
  "var(--color-accent-coral)",
  "var(--color-accent-violet)",
];

export function Book({ onBuy }: { onBuy: (sku: "ebook" | "physical") => void }) {
  const { fmt } = usePrices();
  const gl = useAffordable3D();

  return (
    <section id="book" className="section-lg grain aurora relative isolate overflow-hidden
      [background:radial-gradient(90%_70%_at_78%_8%,rgba(230,184,76,.18),transparent_58%),linear-gradient(180deg,#0c2238_0%,#17344f_50%,#0c2238_100%)]">
      <div className="wrap relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <Reveal>
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">Featured book</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,1.3rem+2.4vw,3.1rem)]
                         font-semibold leading-[1.06] text-white">
            The Anatomy of<br /><span className="text-gold-400">Smart Borrowing</span>
          </h2>
          <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-text-tertiary">{bookFacts.blurb}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Fact label="Foreword" value={bookFacts.foreword} />
            <span className="h-9 w-px bg-white/15" />
            <Fact label="ISBN" value={bookFacts.isbn} mono />
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {bookFacts.topics.map((t, i) => (
              <li key={t}
                  style={{ ["--accent" as string]: CHIP_ACCENT[i % CHIP_ACCENT.length] }}
                  className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5
                             text-[.8rem] text-text-tertiary transition-all duration-300
                             [transition-timing-function:var(--ease-out-soft)]
                             hover:-translate-y-0.5 hover:border-[color:var(--accent)]
                             hover:text-text-primary motion-reduce:transition-none
                             motion-reduce:hover:translate-y-0">
                <span className="mr-1.5" style={{ color: "var(--accent)" }}>✓</span>{t}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => onBuy("physical")}
                    className="magnetic rounded-[10px] bg-gold-bright px-5 py-3.5 font-bold text-navy">
              Paperback — {fmt("physical")}
            </button>
            <button onClick={() => onBuy("ebook")}
                    className="rounded-[10px] bg-white px-5 py-3.5 font-bold text-navy">
              eBook — {fmt("ebook")}
            </button>
          </div>
        </Reveal>

        <Reveal delay={120} className="relative mx-auto aspect-[1/1.18] w-[min(440px,92vw)]">
          {gl ? (
            <BookCanvas />
          ) : (
            /* Not a placeholder. This is what a phone, a reduced-motion
               reader and a machine without WebGL2 are meant to see. */
            <div className="grid h-full place-items-center">
              <Image src="/img/book-cover.jpg" alt={`${bookFacts.title} — cover`} width={600} height={900}
                     sizes="(max-width: 1024px) 80vw, 300px"
                     className="h-auto w-[min(300px,68vw)] rounded-[4px_7px_7px_4px] shadow-2xl
                                [transform:perspective(1200px)_rotateY(-13deg)_rotateX(3deg)]" />
            </div>
          )}
        </Reveal>
      </div>

      <div className="wrap relative z-10">
        <FreeChapter />
      </div>
    </section>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[.66rem] font-extrabold uppercase tracking-[.16em] text-text-muted">{label}</div>
      <div className={`mt-1 text-[.92rem] font-semibold text-white ${mono ? "font-mono text-[.86rem] tnum" : ""}`}>
        {value}
      </div>
    </div>
  );
}
