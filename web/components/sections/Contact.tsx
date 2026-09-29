"use client";

import { site } from "@/lib/content/site";
import { Reveal } from "@/components/motion/Reveal";
import { usePrices } from "@/lib/usePrices";

const checks = ["Personalised guidance", "Practical solutions", "Confidential conversation", "Focused on your goals"];

const steps = [
  ["Pick a time", "Live diary. The slot is held for you before anything is paid."],
  ["Tell Paul the question", "An offer letter, a restructure, a declined claim — whatever it is."],
  ["Leave with a decision", "Not a brochure. A number, a clause, and what to do about it."],
];

export function Contact({ onBook }: { onBook: (type?: "free" | "paid") => void }) {
  const { fmt } = usePrices();

  return (
    <section id="contact" className="grain aurora relative isolate overflow-hidden py-[88px]
      [background:radial-gradient(85%_70%_at_18%_6%,rgba(230,184,76,.17),transparent_58%),linear-gradient(180deg,#050f1c_0%,#0b2038_52%,#071726_100%)]">
      <div className="wrap relative z-10 grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
        <Reveal>
          <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">Work with Paul</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,1.3rem+2.3vw,3rem)]
                         font-semibold leading-[1.07] text-white">
            Make your next financial<br />decision with <span className="text-gold-400">greater clarity.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-[#b8c8dc]">
            Book a one-on-one consultation, or send an enquiry for speaking and
            corporate education. The first 30 minutes are free.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {checks.map((c) => (
              <div key={c} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full
                                 bg-gold-400/20 text-[.66rem] font-extrabold text-gold-400">✓</span>
                <span className="text-[.92rem] text-[#cfdcea]">{c}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => onBook("free")}
                    className="magnetic rounded-[10px] bg-gold-bright px-5 py-3.5 font-bold text-navy">
              Book the free 30 minutes →
            </button>
            <button onClick={() => onBook("paid")}
                    className="rounded-[10px] border border-white/30 px-5 py-3.5 font-bold text-white
                               transition hover:border-gold-400 hover:text-gold-bright">
              60-min coaching — {fmt("coaching")}
            </button>
          </div>
          <p className="mt-4 text-[.8rem] text-[#8fa3bd]">
            Paid by M-Pesa at the time of booking. Refunded in full if Paul has to move
            the session and the new time does not work for you.
          </p>
        </Reveal>

        <Reveal delay={120}
                className="relative rounded-[22px] border border-gold-400/35 p-8
                  [background:linear-gradient(165deg,#0c2138,#123049_70%,#0e2740)]
                  shadow-[0_1px_2px_rgba(0,0,0,.5),0_52px_90px_-50px_rgba(0,0,0,.95)]">
          <p className="text-[.66rem] font-extrabold uppercase tracking-[.18em] text-gold-400">What happens next</p>
          <ol className="mt-6 space-y-5">
            {steps.map(([t, s], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px]
                                 border-gold-400/55 text-[.8rem] font-extrabold text-gold-400 tnum">{i + 1}</span>
                <span>
                  <b className="block text-[.96rem] text-white">{t}</b>
                  <span className="mt-1 block text-[.85rem] leading-relaxed text-[#a9bcd2]">{s}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
            <span className="relative h-2.5 w-2.5 shrink-0 rounded-full bg-[#00c46a]
                             after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-[#00c46a]" />
            <span className="text-[.82rem] text-[#a9bcd2]">
              Or call <a href={site.phoneHref} className="font-bold text-white underline underline-offset-4">{site.phone}</a>
              {" "}— a person answers.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
