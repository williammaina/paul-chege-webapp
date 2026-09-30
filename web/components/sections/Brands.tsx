import Image from "next/image";
import { brands } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/motion/Reveal";

/**
 * A marquee of the businesses Paul works alongside. The row is duplicated
 * and the track translated -50%, so the loop has no seam; `aria-hidden` on
 * the copy keeps a screen reader from reading every name twice.
 */
export function Brands() {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 gap-3.5 pr-3.5" aria-hidden={hidden || undefined}>
      {brands.map((b) => (
        <div key={(hidden ? "b-" : "a-") + b.file}
             className="group flex w-[210px] shrink-0 flex-col items-center gap-2 rounded-2xl border
                        border-[#e6eaef] bg-white px-5 py-6 text-center transition
                        hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg sm:w-[240px]">
          <Image src={`/img/brands/${b.file}`} alt={b.name} width={150} height={56}
                 className="h-14 w-auto max-w-[150px] object-contain" />
          <b className="text-[.78rem] font-bold leading-tight text-[#24384f]">{b.name}</b>
          <span className="text-[.68rem] uppercase tracking-[.06em] text-[#5f6d7d]">{b.kind}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section id="brands" className="section border-b border-[#e6eaef] bg-white">
      {/* Flush-left, on the shared axis, like every other section head.
          This one was centred in a 620px measure, which made it the only
          heading on the page that did not begin where the others do. */}
      <div className="wrap">
        <SectionHead
          eyebrow="Trusted partners"
          title={<>The businesses Paul works alongside.</>}
          lede={<>Insurance placed through a licensed broker, and advisory work with
                 businesses building, financing and growing across Kenya.</>}
        />
      </div>

      <div className="marquee relative overflow-hidden
                      [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee-track flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
