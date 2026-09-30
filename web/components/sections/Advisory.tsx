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
const TONE: Record<Lane["tone"], string> = {
  borrowing: "bg-navy text-white",
  personal:  "bg-white text-ink ring-1 ring-[#e3e7ea]",
  business:  "text-white [background:radial-gradient(circle_at_24%_18%,rgba(239,202,119,.5),transparent_26%),linear-gradient(140deg,#1d4a45,#0e2740)]",
};

const RULE: Record<Lane["tone"], string> = {
  borrowing: "border-white/12",
  personal:  "border-[#e6eaef]",
  business:  "border-white/12",
};

/* The legacy service number carries meaning — a returning visitor looks for
   "07" — so it is real text and has to meet contrast. An opacity would have
   put it at 2.6:1 on the white lane. */
const NUM: Record<Lane["tone"], string> = {
  borrowing: "text-[#9fb0be]",
  personal:  "text-[#6b7683]",
  business:  "text-[#9db8b4]",
};

const KICKER: Record<Lane["tone"], string> = {
  borrowing: "text-gold-400",
  personal:  "text-gold-ink",
  business:  "text-[#f0c45b]",
};

export function Advisory({ onBook }: { onBook: () => void }) {
  const depth = useCardDepth();
  const { fmt } = usePrices();

  return (
    <section id="services" className="section-lg">
      <div className="wrap">
        <SectionHead
          eyebrow="Advisory"
          title={<>Financial Guidance Built on Real Life Experience.</>}
          lede={<>Three kinds of decision. Pick the one you are in front of — each is an
                 hour with Paul on a live call, your documents open, your numbers.
                 The first 30 minutes are free.</>}
        />

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {lanes.map((lane, i) => (
            <Reveal key={lane.n} as="article" delay={i * 90}
                    className={`card-tilt group relative flex flex-col overflow-hidden
                                rounded-[18px] p-7 lg:p-8 ${TONE[lane.tone]}`}>
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
                  <p className={`text-[.66rem] font-extrabold uppercase tracking-[.13em] ${KICKER[lane.tone]}`}>
                    {lane.kicker}
                  </p>
                  <h3 className="mt-1.5 text-[1.55rem] font-semibold leading-tight">{lane.title}</h3>
                  <p className="mt-2.5 text-[.9rem] leading-relaxed opacity-85">{lane.lede}</p>

                  <ul className={`mt-6 border-t ${RULE[lane.tone]}`}>
                    {lane.items.map((item) => (
                      <li key={item.n} className={`flex gap-3.5 border-b py-3.5 ${RULE[lane.tone]}`}>
                        <span className={`mt-0.5 shrink-0 text-[.68rem] font-extrabold tabular-nums tnum ${NUM[lane.tone]}`}>
                          {item.n}
                        </span>
                        <span className="min-w-0">
                          <b className="block text-[.93rem] font-semibold leading-snug">{item.title}</b>
                          <small className="mt-1 block text-[.8rem] leading-relaxed opacity-75">{item.body}</small>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={onBook}
                          className="relative mt-auto self-start pt-7 text-[.86rem] font-extrabold
                                     transition-[translate] duration-500
                                     after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5
                                     after:origin-left after:scale-x-0 after:bg-current after:opacity-60
                                     after:transition-transform after:duration-500
                                     group-hover:[translate:5px_0] group-hover:after:scale-x-100">
                    Book a session →
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-[14px]
                           border border-[#e5e8eb] bg-white px-5 py-4 text-[.95rem] text-[#4a5865]">
          <b className="text-navy">The first 30 minutes are free.</b>
          {/* The server owns prices. A figure typed in here is one the page can
              advertise while the server charges something else. */}
          <span>A full 60-minute session is <b className="text-navy">{fmt("coaching")}</b>, paid by M-Pesa when you book.</span>
          <button onClick={onBook} className="ml-auto font-bold text-gold-ink hover:underline">
            See the live diary →
          </button>
        </Reveal>

        {/* Workshops used to be an eighth advisory card, which put a service
            sold to institutions in a grid a person books an hour in. It has
            its own section further down; this is the pointer to it. */}
        <Reveal className="mt-3 text-[.9rem] text-[#5f6c7d]">
          Booking for a team or an institution?{" "}
          <a href="#insights" className="font-bold text-gold-ink hover:underline">
            Keynotes and workshops are here →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
