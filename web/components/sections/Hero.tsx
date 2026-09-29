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

      <div className="relative z-10 mx-auto grid w-[min(1500px,calc(100%-32px))] gap-4
                      lg:grid-cols-[minmax(320px,.92fr)_minmax(340px,1.3fr)_minmax(205px,.58fr)]">
        {/* Frosted, so the shader behind is felt rather than hidden. The
            gold below is darker than the brand gold for the same reason:
            composited over the backdrop the brand value measures 2.95:1. */}
        <div className="rounded-[18px] bg-white/90 p-7 backdrop-blur-[22px] backdrop-saturate-[1.15]
                        shadow-[0_1px_2px_rgba(3,11,22,.28),0_20px_44px_-22px_rgba(3,11,22,.5)] lg:p-9">
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-ink">
            Financial clarity for a brighter tomorrow
          </p>
          <h1 className="mt-2 text-[clamp(2.6rem,5vw,4.4rem)] font-semibold leading-[.96] tracking-[-.042em]">
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

        <div className="relative min-h-[420px] overflow-hidden rounded-[18px] bg-[#d5d9dc] lg:min-h-[520px]">
          <Image src="/img/paul-chege-portrait.jpg" alt="Paul Chege" fill priority
                 sizes="(max-width: 1024px) 100vw, 40vw"
                 className="object-cover object-[center_16%]" />
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
