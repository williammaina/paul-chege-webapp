"use client";

import { lanes, type Lane } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/motion/Reveal";
import { useCardDepth } from "@/components/motion/useCardDepth";
import { usePrices } from "@/lib/usePrices";

/**
 * Three lanes, not eight cards.
 *
 * The previous grid used two visual systems at once — some cards carried a
 * glyph, others a ghost numeral — so the eight read as eight unrelated
 * things. One system now: every lane has the numeral, nothing has a glyph.
 */
/* One surface for all three lanes. They ran flat navy, plain white and a
   teal gradient at once, which made three parts of one practice read as
   three unrelated products — and put the middle lane's small text on
   white while its neighbours were on dark. The featured lane is marked at
   its edge now, so the surface itself never varies. */
/* One hue per lane. The surface, the radius, the type and the spacing are
   identical across all three — only the accent changes, so the three read
   as one practice with three doors rather than three products. */
const ACCENT: Record<Lane["tone"], string> = {
  borrowing: "var(--color-accent-gold)",
  personal:  "var(--color-accent-emerald)",
  business:  "var(--color-accent-cyan)",
};



/* The legacy service number carries meaning — a returning visitor looks for
   "07" — so it is real text and has to meet contrast. An opacity would have
   put it at 2.6:1 on the white lane. */




export function Advisory({ onBook }: { onBook: () => void }) {
  const depth = useCardDepth();
  const { fmt } = usePrices();

  return (
    <section id="services" className="section-lg bg-surface-800">
      <div className="wrap">
        <SectionHead
          dark
          eyebrow="Advisory"
          title={<>Financial Guidance Built on Real Life Experience.</>}
          lede={<>Three kinds of decision. Pick the one you are in front of — each is an
                 hour with Paul on a live call, your documents open, your numbers.
                 The first 30 minutes are free.</>}
        />

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {lanes.map((lane, i) => (
            <Reveal key={lane.n} as="article" delay={i * 90}
                    className={`card-tilt glow-card group relative flex flex-col overflow-hidden
                                rounded-[var(--radius-panel)] p-7 transition-all duration-300
                                [transition-timing-function:var(--ease-out-soft)]
                                will-change-transform hover:-translate-y-1.5
                                hover:shadow-2xl hover:shadow-black/50
                                motion-reduce:transition-none motion-reduce:hover:translate-y-0
                                edge-accent bg-surface-700 text-white lg:p-8`}
                    style={{ ["--accent" as string]: ACCENT[lane.tone] }}>
              <div {...depth.bind} className="contents">
                {/* The ghost numeral sits behind the face, so on hover it
                    travels the opposite way to everything else. That
                    opposition is most of what reads as depth. */}
                <span aria-hidden
                      className="pointer-events-none absolute bottom-1 right-4 font-[family-name:var(--font-display)]
                                 text-[5.2rem] font-extrabold leading-none opacity-[.07] tnum
                                 transition-[opacity,translate] duration-500 group-hover:opacity-[.15]
                                 group-hover:[translate:calc(var(--px,0)*-7px)_calc(var(--py,0)*-5px)]">
                  {lane.n}
                </span>

                <div className="relative z-10 flex h-full flex-col">
                  <p className="text-[.66rem] font-extrabold uppercase tracking-[.13em]"
                     style={{ color: "var(--accent)" }}>
                    {lane.kicker}
                  </p>
                  <h3 className="mt-1.5 text-[1.55rem] font-semibold leading-tight text-text-primary">{lane.title}</h3>
                  <p className="mt-2.5 text-[.9rem] leading-[1.6] text-text-tertiary">{lane.lede}</p>

                  <ul className="mt-6 border-t border-white/10">
                    {lane.items.map((item) => (
                      <li key={item.n} className="flex gap-3.5 border-b border-white/10 py-3.5">
                        <span className="mt-0.5 shrink-0 text-[.68rem] font-extrabold tabular-nums tnum text-text-muted">
                          {item.n}
                        </span>
                        <span className="min-w-0">
                          <b className="block text-[.93rem] font-semibold leading-snug text-text-primary">{item.title}</b>
                          <small className="mt-1 block text-[.8rem] leading-[1.6] text-text-tertiary">{item.body}</small>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={onBook}
                          style={{ color: "var(--accent)" }}
                          className="relative mt-auto self-start pt-7 text-[.86rem] font-extrabold
                                     transition-[translate] duration-300
                                     [transition-timing-function:var(--ease-out-soft)]
                                     after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5
                                     after:origin-left after:scale-x-0 after:bg-current after:opacity-60
                                     after:transition-transform after:duration-300
                                     group-hover:[translate:5px_0] group-hover:after:scale-x-100
                                     motion-reduce:transition-none">
                    Book a session →
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5
                           rounded-[var(--radius-card)] border border-white/10 bg-surface-700
                           px-5 py-4 text-[.95rem] text-text-tertiary">
          <span aria-hidden className="pulse-dot h-2 w-2 rounded-full bg-mpesa text-mpesa" />
          <b className="text-text-primary">The first 30 minutes are free.</b>
          {/* The server owns prices. A figure typed in here is one the page can
              advertise while the server charges something else. */}
          <span>A full 60-minute session is <b className="text-text-primary">{fmt("coaching")}</b>, paid by M-Pesa when you book.</span>
          <button onClick={onBook} className="ml-auto font-bold text-gold-400 hover:underline">
            See the live diary →
          </button>
        </Reveal>

        {/* Workshops used to be an eighth advisory card, which put a service
            sold to institutions in a grid a person books an hour in. It has
            its own section further down; this is the pointer to it. */}
        <Reveal className="mt-3 text-[.9rem] text-text-tertiary">
          Booking for a team or an institution?{" "}
          <a href="#insights" className="font-bold text-gold-400 hover:underline">
            Keynotes and workshops are here →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
