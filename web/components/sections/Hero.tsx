import Image from "next/image";
import { HeroCanvas } from "@/components/three/HeroCanvas";

const trust = [
  "Personalised financial guidance",
  "Practical financial education",
  "Real-life strategies",
  "Author & educator",
];

export function Hero({ onBook }: { onBook: () => void }) {
  return (
    <section className="hero-bg relative isolate overflow-hidden bg-navy py-12 lg:py-[46px] lg:pb-20">
      <HeroCanvas />

      {/* On `.wrap`, like every other section. The columns are re-weighted
          for the narrower axis: the headline column takes the space the
          portrait used to have, because at 1180 a 377px text column
          cannot hold a 70px display line. */}
      <div className="relative z-10 wrap grid gap-4
                      lg:grid-cols-[minmax(320px,1.46fr)_minmax(330px,.95fr)_minmax(230px,.64fr)]">
        {/* Frosted, so the shader behind is felt rather than hidden. The
            gold below is darker than the brand gold for the same reason:
            composited over the backdrop the brand value measures 2.95:1. */}
        <div className="rounded-[18px] bg-white/90 p-7 backdrop-blur-[22px] backdrop-saturate-[1.15]
                        shadow-[0_1px_2px_rgba(3,11,22,.28),0_20px_44px_-22px_rgba(3,11,22,.5)] lg:p-8">
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-ink">
            Financial clarity for a brighter tomorrow
          </p>
          <h1 className="mt-2 text-[clamp(2.2rem,1rem+2.2vw,2.9rem)] font-semibold leading-[.98] tracking-[-.04em]">
            Understand Money.<br />Borrow Intentionally.<br />
            <span className="text-[#996918]">Build With Confidence.</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-[1.05rem] text-[#4b5c6e]">
            Practical financial guidance for individuals, professionals and business
            owners to make better borrowing and financial decisions.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onBook}
                    className="magnetic rounded-[10px] bg-gold-bright px-5 py-3.5 font-bold text-navy transition hover:brightness-105">
              Book a Consultation →
            </button>
            <a href="#about"
               className="rounded-[10px] border border-[#cbd3dc] bg-white px-5 py-3.5 font-bold text-navy transition hover:border-gold">
              Discover Paul&apos;s Approach
            </a>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {trust.map((t, i) => (
              <li key={t} className="flex items-center gap-2.5 text-[.9rem] text-[#405163]">
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full
                                 border border-[#d7bd7b] text-[.8rem] font-extrabold text-gold-ink tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* The file is square (2047x2048) and Paul occupies the middle
            ~1280px of it, so the only rule that matters is that the frame
            never gets narrower than he is.

            It used to be `min-h` with `object-[center_16%]`: 0.58 aspect at
            desktop, which cut his shoulders, and 2.1 when the columns stack,
            which cut him off at the chest. Both ratios below keep the whole
            of him — 4:5 holds 1638px of the width and 0.73 holds 1497px,
            against the 1280px he actually spans — so all that leaves the
            frame is empty studio backdrop.

            2:3 is the tallest the desktop frame can go: at 358px wide it
            shows 1366px of the file's width centred on Paul at 52%, which
            is [377, 1743] against the [420, 1700] he occupies. Any taller
            and the frame starts taking his shoulders. */}
        <div className="group relative mx-auto aspect-[4/5] w-full max-w-[460px] overflow-hidden lg:aspect-[2/3]
                        rounded-[18px] bg-[linear-gradient(160deg,#dfe3e7,#c6ccd3)]
                        shadow-[0_2px_4px_rgba(3,11,22,.3),0_28px_64px_-30px_rgba(3,11,22,.85)]
                        ring-1 ring-white/12
                        lg:max-w-none lg:self-center">
          <Image src="/img/paul-chege-portrait.jpg" alt="Paul Chege" fill priority
                 sizes="(max-width: 1024px) 92vw, 34vw"
                 className="object-cover object-[52%_center] saturate-[1.06] contrast-[1.03]
                            transition-transform duration-[900ms] ease-out-expo
                            motion-safe:group-hover:scale-[1.03]" />

          {/* The studio grey is colder than anything else in the hero. A
              navy wash at the foot and a gold breath at the head sit the
              photograph in the palette instead of on top of it. */}
          <div aria-hidden className="pointer-events-none absolute inset-0
                                      [background:linear-gradient(to_top,rgba(12,34,56,.42),transparent_34%),radial-gradient(120%_58%_at_50%_0%,rgba(230,184,76,.16),transparent_62%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[18px]
                                      ring-1 ring-inset ring-white/14" />
        </div>

        <aside className="flex flex-col gap-3 rounded-[18px] bg-[#0e2439]/70 p-3 backdrop-blur-[20px]
                          ring-1 ring-white/10">
          <div className="rounded-[14px] bg-[#17344f]/70 p-5 backdrop-blur-[12px]">
            <p className="text-[.72rem] font-extrabold uppercase tracking-[.14em] text-gold-400">
              Paul&apos;s perspective
            </p>
            <span aria-hidden className="mt-2 block font-[family-name:var(--font-display)]
                                         text-[2.4rem] leading-[0.6] text-gold-400">&ldquo;</span>
            <blockquote className="mt-3 font-[family-name:var(--font-display)] text-[1.02rem]
                                   leading-snug text-white">
              Better financial decisions begin with clarity &mdash; understanding the
              commitment before making it.
            </blockquote>
            <p className="mt-4 font-[family-name:var(--font-display)] text-[.95rem] italic text-gold-bright">
              Paul Chege
            </p>
            <p className="text-[.7rem] text-[#9fb0be]">Financial Advisor &bull; Author &bull; Educator</p>
          </div>

          <div className="flex flex-1 flex-col rounded-[14px] p-4">
            <div aria-hidden className="mb-4 h-px bg-white/10" />
            <p className="text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8fa3bd]">
              Start with what matters to you
            </p>
            <ul className="mt-3 space-y-0">
              {[
                ["Personal Finance", "Build clarity around your financial direction."],
                ["Borrowing Decisions", "Understand loans before you commit."],
                ["Business Finance", "Think clearly about capital and growth."],
              ].map(([t, sub], i) => (
                <li key={t} className="border-b border-white/10 last:border-0">
                  <button onClick={onBook} className="group flex w-full items-start gap-3 py-3 text-left">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border
                                     border-gold-400/50 text-[.65rem] font-extrabold text-gold-400 tnum">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <b className="block text-[.82rem] text-white">{t}</b>
                      <small className="block text-[.68rem] leading-tight text-[#9fb0be]">{sub}</small>
                    </span>
                    <i className="ml-auto self-center not-italic text-gold-400 transition
                                  group-hover:translate-x-0.5">&rarr;</i>
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={onBook}
                    className="magnetic mt-5 w-full rounded-[10px] bg-gold-bright py-3.5 text-[.9rem]
                               font-extrabold text-navy transition hover:brightness-105">
              Talk to Paul &rarr;
            </button>
          </div>
        </aside>

      </div>
    </section>
  );
}
