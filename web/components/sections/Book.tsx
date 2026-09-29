"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { bookFacts } from "@/lib/content/site";
import { Reveal } from "@/components/motion/Reveal";
import { usePrices } from "@/lib/usePrices";

// three.js is 550KB, so it is never in the first load and never fetched at
// all on a device that will not run it.
const BookCanvas = dynamic(() => import("@/components/three/BookCanvas").then((m) => m.BookCanvas), {
  ssr: false,
});

export function Book({ onBuy }: { onBuy: (sku: "ebook" | "physical") => void }) {
  const { fmt } = usePrices();

  return (
    <section id="book" className="grain aurora relative isolate overflow-hidden py-[92px]
      [background:radial-gradient(90%_70%_at_78%_8%,rgba(230,184,76,.18),transparent_58%),linear-gradient(180deg,#03090f_0%,#081a2c_52%,#0b2038_100%)]">
      <div className="wrap relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <Reveal>
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">Featured book</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,1.3rem+2.4vw,3.1rem)]
                         font-semibold leading-[1.06] text-white">
            The Anatomy of<br /><span className="text-gold-400">Smart Borrowing</span>
          </h2>
          <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-[#b9c8dc]">{bookFacts.blurb}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Fact label="Foreword" value={bookFacts.foreword} />
            <span className="h-9 w-px bg-white/15" />
            <Fact label="ISBN" value={bookFacts.isbn} mono />
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[.88rem] text-[#c3d1e2]">
            {bookFacts.topics.map((t) => (
              <li key={t} className="flex gap-2.5"><span className="text-gold-400">✓</span>{t}</li>
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
          <BookCanvas />
          {/* The still cover is what a phone, a reduced-motion reader and a
              machine with no WebGL2 all see. It is not a placeholder. */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Image src="/img/book-cover.jpg" alt={`${bookFacts.title} — cover`} width={600} height={900}
                   sizes="(max-width: 1024px) 80vw, 300px"
                   className="h-auto w-[min(300px,68vw)] rounded-[4px_7px_7px_4px] shadow-2xl
                              [transform:perspective(1200px)_rotateY(-13deg)_rotateX(3deg)]
                              [.has-gl_&]:opacity-0" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[.66rem] font-extrabold uppercase tracking-[.16em] text-[#8fa3bd]">{label}</div>
      <div className={`mt-1 text-[.92rem] font-semibold text-white ${mono ? "font-mono text-[.86rem] tnum" : ""}`}>
        {value}
      </div>
    </div>
  );
}
