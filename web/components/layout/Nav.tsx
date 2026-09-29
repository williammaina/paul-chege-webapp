"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { nav } from "@/lib/content/site";

/**
 * The nav, with a scrollspy that decides the active link by which section
 * crosses a reading line a third of the way down the viewport.
 *
 * Not IntersectionObserver: thresholds say nothing useful once a section is
 * taller than the window, and "most visible" flickers between two long
 * sections at the boundary.
 */
export function Nav({ onBook }: { onBook: () => void }) {
  const [active, setActive] = useState<string>("#home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let queued = false;
    const pick = () => {
      queued = false;
      const line = window.scrollY + window.innerHeight * 0.32;

      // At the very bottom the last section may never reach the line, so
      // Contact would otherwise be impossible to highlight.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        setActive(nav[nav.length - 1].href);
        return;
      }
      let best: { top: number; href: string } | null = null;
      for (const { href } of nav) {
        const el = document.querySelector(href);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line && (!best || top > best.top)) best = { top, href };
      }
      setActive(best ? best.href : nav[0].href);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    pick();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-xl">
      <div className="wrap flex h-[68px] items-center justify-between gap-5 lg:h-[78px]">
        <a href="#home" className="flex min-w-0 items-center gap-3">
          <Image src="/img/logo-navy.webp" alt="" width={120} height={94} priority
                 className="h-[42px] w-auto drop-shadow-[0_1px_6px_rgba(0,0,0,.35)] lg:h-[54px]" />
          {/* The wordmark truncated to "PAUL CH…" on a phone. The logo
              already says who this is; the text needs room to earn its place. */}
          <span className="min-w-0 max-[430px]:hidden">
            <strong className="block truncate text-[1.05rem] tracking-[.04em] text-white">PAUL CHEGE</strong>
            <small className="hidden truncate text-[.62rem] text-[#9fb0be] lg:block">{/* role */}
              Financial Advisor • Author • Educator • Speaker
            </small>
          </span>
        </a>

        <nav className="hidden items-center gap-[clamp(9px,1.05vw,23px)] text-[.7rem] md:flex lg:text-[.8rem] xl:text-[.94rem]">
          {nav.map(({ href, label }) => (
            <a key={href} href={href}
               className={`relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5
                 after:origin-left after:scale-x-0 after:bg-gold-400 after:transition-transform after:duration-300
                 ${active === href ? "text-gold-400 after:scale-x-100" : "text-[#cfdcea] hover:text-gold-400"}`}>
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={onBook}
                  className="magnetic whitespace-nowrap rounded-full bg-gold-bright px-4 py-2.5 text-[.75rem]
                             font-extrabold text-navy transition hover:brightness-105 lg:px-5 lg:text-[.8rem]">
            {/* The full label wrapped onto two lines on a phone, doubling
                the header height. */}
            <span className="hidden sm:inline">Book a Consultation →</span>
            <span className="sm:hidden">Book →</span>
          </button>
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu"
                  className="text-2xl text-white md:hidden">☰</button>
        </div>
      </div>

      {open && (
        <nav className="absolute inset-x-0 top-full flex flex-col bg-[#0c2238] shadow-2xl md:hidden">
          {nav.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
               className={`border-b border-white/5 px-6 py-3.5 text-[.92rem] ${
                 active === href ? "bg-gold-400/10 text-gold-400" : "text-[#cfdcea]"}`}>
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
