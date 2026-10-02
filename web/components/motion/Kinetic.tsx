"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState,
         type ReactNode } from "react";

/**
 * A heading whose words rise into place one after the other.
 *
 * The text is split on whitespace and each word wrapped in its own clip,
 * so the reveal reads as type setting itself rather than a block fading.
 * `<br />` survives as a line break, and the walk recurses through nested
 * elements so a coloured `<span>` inside the headline keeps its colour and
 * still joins the stagger — passing elements through whole would have left
 * the hero's last line sitting there while the first two rose.
 *
 * Reduced motion gets the finished state on the first paint — not a
 * shortened animation, none at all.
 */
export function Kinetic({
  children, as: Tag = "h2", className = "", step = 55, start = 0,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  /** Milliseconds between one word and the next. */
  step?: number;
  /** Milliseconds before the first word moves. */
  start?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setOn(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0;
  const walk = (node: ReactNode, key: string): ReactNode => {
    if (typeof node === "string") {
      return node.split(/(\s+)/).map((piece, i) => {
        if (!piece.trim()) return piece;
        const delay = start + n++ * step;
        return (
          <span key={`${key}-${i}`} className="kinetic-word">
            <span style={{ ["--kin-delay" as string]: `${delay}ms` }}>{piece}</span>
          </span>
        );
      });
    }
    if (Array.isArray(node)) return node.map((c, i) => walk(c, `${key}-${i}`));
    if (isValidElement(node)) {
      const inner = (node.props as { children?: ReactNode }).children;
      if (inner === undefined) return node;
      return cloneElement(node as never, { key },
                          walk(inner, `${key}c`) as never);
    }
    return node;
  };

  const kids = walk(Children.toArray(children), "k");

  return (
    <Tag ref={ref as never} className={`${on ? "kinetic-on" : ""} ${className}`}>
      {kids}
    </Tag>
  );
}
