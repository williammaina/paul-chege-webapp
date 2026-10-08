"use client";

import { createElement, useEffect, useRef, useState,
         type CSSProperties, type ReactNode } from "react";

type Tag = "div" | "section" | "article" | "li";

/**
 * Rise-in on first sight, once.
 *
 * Uses the independent `translate` property rather than `transform`: the
 * cards this wraps often carry their own `transform` for tilt, and a
 * second `transform` on the same element replaces the first instead of
 * composing with it. `translate` composes.
 *
 * Rendered through `createElement` rather than `<Tag>` because the ref
 * type of a union of four elements does not narrow, and the alternative
 * was a `@ts-expect-error` — a silenced error is still an error, and it
 * would go on silencing the next one too.
 */
export function Reveal({
  children, delay = 0, className = "", as = "div", style,
}: {
  children: ReactNode; delay?: number; className?: string; as?: Tag;
  /** Merged under the entrance styles, so callers can pass custom
      properties — a per-card accent, say — without losing the reveal. */
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setSeen(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref: (node: HTMLElement | null) => { ref.current = node; },
      className,
      style: {
        ...style,
        opacity: seen ? 1 : 0,
        translate: seen ? "none" : "0 26px",
        transition: `opacity .8s var(--ease-out-expo) ${delay}ms, translate .8s var(--ease-out-expo) ${delay}ms`,
      },
    },
    children,
  );
}
