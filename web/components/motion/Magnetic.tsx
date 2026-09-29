"use client";

import { useEffect } from "react";

/**
 * Buttons marked `.magnetic` lean toward the cursor and spring back.
 *
 * One delegated listener and one rAF for the whole page, writing to a
 * custom property so the transform composes with whatever CSS is already
 * doing to the element.
 */
export function Magnetic() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(hover: hover)").matches) return;

    const PULL = 0.32, RANGE = 1.7;
    let el: HTMLElement | null = null;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const loop = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      if (el) el.style.setProperty("--mag", `${cx.toFixed(2)}px ${cy.toFixed(2)}px`);
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) { raf = requestAnimationFrame(loop); }
      else { raf = 0; if (!tx && !ty && el) { el.style.removeProperty("--mag"); el = null; } }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const move = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement)?.closest?.<HTMLElement>(".magnetic");
      const near = hit || el;
      if (!near) return;
      const r = near.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.abs(dx) > (r.width / 2) * RANGE || Math.abs(dy) > (r.height / 2) * RANGE) {
        tx = ty = 0; kick(); return;
      }
      if (el && el !== near) el.style.removeProperty("--mag");
      el = near; tx = dx * PULL; ty = dy * PULL; kick();
    };
    const drop = () => { tx = ty = 0; kick(); };

    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", drop, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", drop);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
