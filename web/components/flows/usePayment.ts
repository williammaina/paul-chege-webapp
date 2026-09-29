"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type OrderStatus } from "@/lib/api";

export type PayState =
  | { phase: "idle" }
  | { phase: "prompting"; orderId: string; amount: number }
  | { phase: "done"; order: OrderStatus }
  | { phase: "failed"; message: string };

/**
 * Poll an order until it settles.
 *
 * The server is the only thing that decides whether money moved — the
 * browser never infers it from a timeout. `pending` keeps polling; every
 * other status is final and is shown in the server's own words, because
 * those words were written for the buyer.
 */
export function usePayment() {
  const [state, setState] = useState<PayState>({ phase: "idle" });
  const timer = useRef<number | undefined>(undefined);

  const stop = useCallback(() => { clearInterval(timer.current); timer.current = undefined; }, []);
  useEffect(() => stop, [stop]);

  const watch = useCallback((orderId: string, amount: number) => {
    setState({ phase: "prompting", orderId, amount });
    stop();
    const started = Date.now();
    timer.current = window.setInterval(async () => {
      try {
        const o = await api.order(orderId);
        if (o.status === "paid") { stop(); setState({ phase: "done", order: o }); return; }
        if (o.status !== "pending" && o.status !== "demo") {
          stop();
          setState({ phase: "failed", message: o.message || "The payment did not go through." });
          return;
        }
        // Safaricom's own prompt expires around 60s; give it a margin and
        // then stop rather than spinning forever.
        if (Date.now() - started > 150_000) {
          stop();
          setState({ phase: "failed", message: "The prompt expired without a response. You have not been charged." });
        }
      } catch { /* a dropped poll is not a verdict; the next one decides */ }
    }, 2500);
  }, [stop]);

  const reset = useCallback(() => { stop(); setState({ phase: "idle" }); }, [stop]);

  return { state, watch, reset, setState };
}
