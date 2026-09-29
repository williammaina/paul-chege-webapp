"use client";

import { useCallback, useRef } from "react";

/**
 * Parallax depth for a hovered card.
 *
 * Writes --px/--py (-1..1 from the card centre) so CSS can move each layer
 * by a different amount. `transform-style: preserve-3d` would be the
 * textbook answer and is unavailable here: the cards clip their overflow
 * for the rounded scrim, and an element with clipped overflow flattens its
 * 3D context.
 */
export function useCardDepth() {
  const raf = useRef(0);
  const pending = useRef<{ el: HTMLElement; x: number; y: number } | null>(null);

  const paint = useCallback(() => {
    raf.current = 0;
    const p = pending.current;
    if (!p) return;
    p.el.style.setProperty("--px", p.x.toFixed(3));
    p.el.style.setProperty("--py", p.y.toFixed(3));
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget.closest<HTMLElement>(".card-tilt");
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending.current = {
      el,
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    };
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget.closest<HTMLElement>(".card-tilt");
    if (!el) return;
    el.style.removeProperty("--px");
    el.style.removeProperty("--py");
  }, []);

  return { bind: { onPointerMove, onPointerLeave } };
}
