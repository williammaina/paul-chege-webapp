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

export function usePrices() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => { if (alive && h) setHealth(h); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const price = (sku: string) => health?.catalogue?.[sku]?.price ?? FALLBACK[sku] ?? 0;
  const fmt = (sku: string) =>
    "KES " + price(sku).toLocaleString("en-KE", { maximumFractionDigits: 0 });

  return { health, price, fmt, live: !!health?.live };
}
