"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Rise-in on first sight, once.
 *
 * Uses the independent `translate` property rather than `transform`: the
 * cards this wraps often carry their own `transform` for tilt, and a
 * second `transform` on the same element replaces the first instead of
 * composing with it. `translate` composes.
 */
export function Reveal({
  children, delay = 0, className = "", as: Tag = "div",
}: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "article" | "li" }) {
  const ref = useRef<HTMLElement>(null);
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

  return (
    <Tag
      // @ts-expect-error — polymorphic ref across the four allowed tags
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        translate: seen ? "none" : "0 26px",
        transition: `opacity .8s var(--ease-out-expo) ${delay}ms, translate .8s var(--ease-out-expo) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
