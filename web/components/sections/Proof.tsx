import Image from "next/image";
import { proof, bookFacts } from "@/lib/content/site";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The credential band, directly under the hero.
 *
 * Until now the first proof a visitor met was a marquee of six SME logos,
 * and the fact that a sitting Deputy President wrote the foreword was a
 * grey line of body copy three screens further down. This puts the
 * strongest fact first, on the dark the hero already established, and
 * hands off to the white of the partners marquee below it.
 *
 * Every figure here is read off `site.ts`, which carries the date it was
 * read. Nothing is asserted here that Paul cannot evidence.
 */
export function Proof() {
  return (
    <section aria-label="Credentials"
             className="relative isolate overflow-hidden border-b border-white/10 bg-navy
                        [background:linear-gradient(180deg,#0b0b10,#131319)]">
      <Reveal className="wrap section-sm grid items-center gap-8
                         lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-11">
        <div className="flex items-center gap-5">
          <Image src="/img/book-cover.jpg" alt={`${bookFacts.title} — front cover`}
                 width={132} height={198} sizes="132px"
                 className="h-[124px] w-auto shrink-0 rounded-[3px] shadow-[0_10px_26px_-8px_rgba(0,0,0,.75)]
                            ring-1 ring-white/15" />

          <div className="min-w-0">
            <p className="text-[.63rem] font-extrabold uppercase tracking-[.14em] text-text-muted">
              {bookFacts.title}
            </p>
            {/* The focal point of the band, and it has to win on size.
                The three figures beside it were set at 1.45rem and the
                credential at 1.5rem, so the strongest fact was the same
                weight as the episode count. */}
            <p className="mt-2 font-[family-name:var(--font-display)]
                          text-[clamp(1.45rem,1rem+1.5vw,2.15rem)] font-semibold
                          leading-[1.08] text-white">
              {proof.headline}
            </p>
            <p className="mt-1.5 text-[.88rem] text-gold-400">{proof.headlineSub}</p>
          </div>
        </div>

        {/* The rule is the whole separator on a wide screen and disappears
            entirely on a narrow one, where the stack already separates. */}
        <div aria-hidden className="hidden h-16 w-px justify-self-center bg-white/12 lg:block" />

        <dl className="grid gap-x-9 gap-y-5 sm:grid-cols-3">
          {proof.facts.map((f) => (
            <div key={f.label}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <b className="block font-[family-name:var(--font-display)] text-[1.08rem] font-semibold
                              leading-none text-gold-400 tnum">
                  {f.value}
                </b>
                <span className="mt-1.5 block text-[.78rem] font-semibold leading-tight text-white">
                  {f.label}
                </span>
                <span className="mt-0.5 block text-[.7rem] leading-tight text-text-muted">{f.sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
