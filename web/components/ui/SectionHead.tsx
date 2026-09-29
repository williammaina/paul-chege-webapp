import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`relative inline-block text-[.78rem] font-extrabold uppercase tracking-[.15em]
                   ${dark ? "text-gold-400" : "text-gold-ink"}`}>
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow, title, lede, dark = false,
}: { eyebrow: string; title: ReactNode; lede?: ReactNode; dark?: boolean }) {
  return (
    <Reveal className="mb-7 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
        <h2 className={`mt-1 text-[clamp(2rem,3vw,3.2rem)] font-semibold leading-[1.05]
                        ${dark ? "text-white" : ""}`}>
          {title}
        </h2>
      </div>
      {lede && (
        <p className={`max-w-[560px] ${dark ? "text-[#b3c4d8]" : "text-[#5f6c7d]"}`}>{lede}</p>
      )}
    </Reveal>
  );
}
