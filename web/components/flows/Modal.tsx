"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open, onClose, title, kicker, children, wide = false,
}: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);

  /* Escape, a scroll lock, and a focus trap.
   *
   * The trap is not decoration. This dialog takes a phone number and
   * sends a payment prompt; without it, Tab walks straight out of the
   * dialog into the page behind, which a keyboard or screen-reader user
   * cannot see is still there, and focus is left on a dead element when
   * the dialog closes. */
  useEffect(() => {
    if (!open) return;

    const returnTo = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () => [
      ...(panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ].filter((el) => el.offsetParent !== null);

    // Into the dialog, but onto the panel rather than the close button, so
    // a screen reader reads the heading before it offers a way out.
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    };

    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnTo?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(2,10,18,.72)] p-5"
         onClick={onClose} role="dialog" aria-modal aria-label={title}>
      {/* Lenis owns the page, not this panel. */}
      <div ref={panel} tabIndex={-1} data-lenis-prevent onClick={(e) => e.stopPropagation()}
           className={`max-h-[90vh] w-full overflow-auto rounded-[22px] bg-white p-7
                       shadow-[0_2px_6px_rgba(6,18,32,.16),0_60px_110px_-50px_rgba(6,18,32,.55)]
                       focus:outline-none ${wide ? "max-w-[900px]" : "max-w-[620px]"}`}>
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
