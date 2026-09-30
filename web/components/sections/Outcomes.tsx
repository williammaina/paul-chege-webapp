import { caseOutcomes, outcomesDisclaimer } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Anonymised case outcomes — what stands in for testimonials here.
 *
 * Paul is a regulated intermediary, so a review needs the client's written
 * consent and no outcome may be written by anyone but him. The array in
 * `site.ts` therefore ships empty and this returns nothing at all: an
 * absent section is a gap in the page, while an invented one is a false
 * claim about a financial service. The moment Paul fills the array the
 * section appears, with no change here.
 *
 * The disclaimer is not optional and is not a prop. It renders whenever
 * the section does, because a past outcome is not a promise of a future
 * one and the page has to say so in the same breath.
 */
export function Outcomes() {
  if (caseOutcomes.length === 0) return null;

  return (
    <section id="outcomes" className="border-y border-[#e6eaef] bg-[#f7f8fa] py-[76px]">
      <div className="wrap">
        <SectionHead
          eyebrow="What came of it"
          title={<>Some of what has actually happened.</>}
          lede={<>Not endorsements — outcomes. A handful of real cases, with the
                 identifying detail taken out, so you can see the shape of the work
                 before you book an hour of it.</>}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {caseOutcomes.map((c, i) => (
            <Reveal key={c.headline} as="article" delay={(i % 3) * 90}
                    className="flex flex-col rounded-[18px] border border-[#e3e7ea] bg-white p-7
                               transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg">
              <p className="self-start rounded-full bg-[#f2e6c8] px-3 py-1 text-[.66rem] font-extrabold
                            uppercase tracking-[.1em] text-[#6b5312]">
                {c.tag}
              </p>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-[1.28rem] font-semibold
                             leading-snug text-navy">
                {c.headline}
              </h3>
              <p className="mt-3 text-[.9rem] leading-relaxed text-[#4a5865]">{c.body}</p>
              <p className="mt-5 border-t border-[#eceff2] pt-3.5 text-[.74rem] uppercase
                            tracking-[.08em] text-[#78838f]">
                {c.detail}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 max-w-[760px] text-[.8rem] leading-relaxed text-[#6b7683]">
          <p>{outcomesDisclaimer}</p>
        </Reveal>
      </div>
    </section>
  );
}
