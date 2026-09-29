"use client";

import { useEffect, useState } from "react";
import { usePrices } from "@/lib/usePrices";

/**
 * A booking bar that follows on a phone.
 *
 * The page is roughly eight thousand pixels tall on a handset, and the
 * hero's button is gone after the first screen — so for most of the visit
 * there is nothing to tap. This appears once the hero has scrolled away
 * and hides again at the contact section, where the real call to action
 * already is and two of them would compete.
 *
 * Phones only: on a desktop the header is sticky and already carries one.
 */
export function StickyBook({ onBook }: { onBook: () => void }) {
  const [show, setShow] = useState(false);
  const { fmt } = usePrices();

  useEffect(() => {
    if (matchMedia("(min-width: 768px)").matches) return;

    let queued = false;
    const paint = () => {
      queued = false;
      const hero = document.querySelector(".hero-bg");
      const contact = document.querySelector("#contact");
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
      const atContact = contact ? contact.getBoundingClientRect().top < innerHeight * 0.9 : false;
      setShow(pastHero && !atContact);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    paint();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, []);

  return (
    <div aria-hidden={!show}
         className={`fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#03090f]/95
                     backdrop-blur-md transition-transform duration-300 md:hidden
                     ${show ? "translate-y-0" : "translate-y-full"}`}
         /* Clear of the home indicator on a notched phone. */
         style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[.82rem] font-bold text-white">Talk it through with Paul</p>
          <p className="truncate text-[.72rem] text-[#9db2c9]">
            First 30 minutes free · then {fmt("coaching")}
          </p>
        </div>
        <button onClick={onBook} tabIndex={show ? 0 : -1}
                className="shrink-0 rounded-full bg-gold-bright px-5 py-3 text-[.82rem]
                           font-extrabold text-navy">
          Book →
        </button>
      </div>
    </div>
  );
}
