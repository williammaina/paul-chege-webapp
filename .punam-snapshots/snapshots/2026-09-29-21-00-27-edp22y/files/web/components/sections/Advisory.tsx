"use client";

import { services, type Service } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/motion/Reveal";
import { useCardDepth } from "@/components/motion/useCardDepth";
import { usePrices } from "@/lib/usePrices";

const TONE: Record<Service["tone"], string> = {
  dark:      "bg-navy text-white",
  sand:      "bg-[#c8b293] text-[#14293f]",
  light:     "bg-white text-ink ring-1 ring-[#e3e7ea]",
  claims:    "text-white [background:radial-gradient(circle_at_24%_20%,rgba(239,202,119,.55),transparent_22%),linear-gradient(135deg,#1d4a45,#0e2740)]",
  planning:  "text-white [background:radial-gradient(circle_at_75%_18%,rgba(239,202,119,.75),transparent_24%),linear-gradient(145deg,#9f8a6c,#314f49)]",
  education: "text-white [background:radial-gradient(circle_at_22%_24%,rgba(222,177,74,.45),transparent_20%),linear-gradient(135deg,#243e55,#8b7657)]",
  decision:  "text-white [background:radial-gradient(circle_at_76%_20%,rgba(255,255,255,.2),transparent_23%),linear-gradient(135deg,#8296a5,#193650)]",
};

const SCRIM = new Set<Service["tone"]>(["claims", "planning", "education", "decision"]);

export function Advisory({ onBook }: { onBook: () => void }) {
  const depth = useCardDepth();
  const { fmt } = usePrices();

  return (
    <section id="services" className="py-[76px]">
      <div className="wrap">
        <SectionHead
          eyebrow="Advisory"
          title={<>Financial Guidance Built on Real Life Experience.</>}
          lede={<>Choose the area closest to the decision you are in front of. Every one of
                 these is an hour with Paul on a live call — your documents open, your
                 numbers, your decision. The first 30 minutes are free.</>}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((s, i) => (
            <Reveal key={s.n} as="article" delay={(i % 4) * 80}
                    className={`card-tilt group relative flex min-h-[260px] flex-col overflow-hidden
                                rounded-[18px] p-7 ${TONE[s.tone]}`}>
              <div {...depth.bind} className="contents">
                {/* The ghost numeral sits behind the face, so on hover it
                    travels the opposite way to everything else. That
                    opposition is most of what reads as depth. */}
                <span aria-hidden
                      className="pointer-events-none absolute bottom-2 right-4 font-[family-name:var(--font-display)]
                                 text-[4.4rem] font-extrabold leading-none opacity-[.06] tnum
                                 transition-[opacity,translate] duration-500 group-hover:opacity-[.14]
                                 group-hover:[translate:calc(var(--px,0)*-7px)_calc(var(--py,0)*-5px)]">
                  {s.n}
                </span>

                {SCRIM.has(s.tone) ? (
                  <div className="relative z-10 mt-auto rounded-[14px] bg-[rgba(5,13,24,.9)] p-5">
                    <Kicker>{s.kicker}</Kicker>
                    <Title>{s.title}</Title>
                    <Body className="text-[#d9e1e7]">{s.body}</Body>
                    <Cta onClick={s.cta === "View programmes" ? undefined : onBook}
                         href={s.cta === "View programmes" ? "#insights" : undefined}>{s.cta}</Cta>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full flex-col">
                    {s.icon && (
                      <span className="mb-auto grid h-12 w-12 place-items-center rounded-full border
                                       border-current/30 text-lg opacity-80 transition-transform duration-500
                                       group-hover:rotate-[-8deg] group-hover:scale-110
                                       group-hover:[translate:calc(var(--px,0)*9px)_calc(var(--py,0)*7px)]">
                        {s.icon}
                      </span>
                    )}
                    <Title className="mt-5">{s.title}</Title>
                    <Body>{s.body}</Body>
                    <Cta onClick={onBook}>{s.cta}</Cta>
                  </div>
                )}
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
      </div>
    </section>
  );
}

const Kicker = ({ children }: { children?: React.ReactNode }) =>
  children ? <p className="text-[.62rem] font-extrabold uppercase tracking-[.12em] text-[#f0c45b]">{children}</p> : null;

const Title = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <h3 className={`text-[1.3rem] font-semibold leading-tight ${className}`}>{children}</h3>;

const Body = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <p className={`mt-2 text-[.86rem] leading-relaxed opacity-90 ${className}`}>{children}</p>;

function Cta({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls = `relative mt-4 self-start text-[.84rem] font-extrabold transition-[translate] duration-500
               after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0
               after:bg-current after:opacity-60 after:transition-transform after:duration-500
               group-hover:[translate:5px_0] group-hover:after:scale-x-100`;
  return href
    ? <a href={href} className={cls}>{children} →</a>
    : <button onClick={onClick} className={cls}>{children} →</button>;
}
