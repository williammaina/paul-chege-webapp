"use client";

import { useEffect, useState } from "react";
import type { Payee, Session } from "@/lib/api";

type Health = {
  live?: boolean;
  catalogue?: Record<string, { price: number; label: string; digital: boolean }>;
  sessions?: Record<string, Session>;
  payee?: Payee;
};

/**
 * Prices come from the server and only from the server.
 *
 * The figures below are what the page ships with so it is honest offline;
 * the moment /api/health answers they are replaced. The browser never
 * sends a price — it sends what the buyer chose — so a page that is a
 * little stale can never charge the wrong amount, only display one.
 */
const FALLBACK: Record<string, number> = { physical: 1999, ebook: 999, coaching: 5000 };

/**
 * One request, however many components ask.
 *
 * Four components call this hook, and each was firing its own
 * `/api/health` on mount — four identical round trips before the page had
 * finished painting. The promise is shared; the result is not cached
 * beyond the page's life, so a reload still gets fresh prices.
 */
let inflight: Promise<Health | null> | null = null;
function healthOnce(): Promise<Health | null> {
  inflight ??= fetch("/api/health")
    .then((r) => (r.ok ? (r.json() as Promise<Health>) : null))
    .catch(() => null);
  return inflight;
}

export function usePrices() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;
    healthOnce().then((h) => { if (alive && h) setHealth(h); });
    return () => { alive = false; };
  }, []);

  const price = (sku: string) => health?.catalogue?.[sku]?.price ?? FALLBACK[sku] ?? 0;
  const fmt = (sku: string) =>
    "KES " + price(sku).toLocaleString("en-KE", { maximumFractionDigits: 0 });

  return { health, price, fmt, live: !!health?.live };
}
