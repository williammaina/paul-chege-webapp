"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  open, onClose, title, kicker, children, wide = false,
}: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(2,10,18,.72)] p-5"
         onClick={onClose} role="dialog" aria-modal aria-label={title}>
      {/* Lenis owns the page, not this panel. */}
      <div data-lenis-prevent onClick={(e) => e.stopPropagation()}
           className={`max-h-[90vh] w-full overflow-auto rounded-[22px] bg-white p-7
                       shadow-[0_2px_6px_rgba(6,18,32,.16),0_60px_110px_-50px_rgba(6,18,32,.55)]
                       ${wide ? "max-w-[900px]" : "max-w-[620px]"}`}>
        <div className="flex items-start justify-between gap-5">
          <div>
            {kicker && <p className="text-[.7rem] font-extrabold uppercase tracking-[.14em] text-gold-ink">{kicker}</p>}
            <h3 className="mt-1 text-[1.4rem] font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef2f5] hover:bg-[#e2e8ee]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
