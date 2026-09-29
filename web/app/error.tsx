"use client";

import { useEffect } from "react";
import { site } from "@/lib/content/site";

/**
 * What a visitor sees when the page itself fails.
 *
 * Next's default is a blank "Application error", which on a page that
 * takes payments is the worst possible thing to show: it tells somebody
 * mid-transaction nothing about whether their money moved. This says what
 * to do and gives a person to call.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[page]", error); }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-navy px-6 text-center">
      <div>
        <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">
          Something went wrong
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,1.3rem+2vw,2.6rem)] font-semibold text-white">
          This page did not load properly.
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-[#b3c4d8]">
          If you were part-way through a payment, nothing is lost — any M-Pesa
          message you received is the record, and we can find your order from it.
          Call <a href={site.phoneHref} className="font-bold text-white underline underline-offset-4">{site.phone}</a>.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={reset}
                  className="rounded-[10px] bg-gold-bright px-5 py-3.5 font-bold text-navy">
            Try again
          </button>
          <a href="/" className="rounded-[10px] border border-white/30 px-5 py-3.5 font-bold text-white">
            Start over
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 font-mono text-[.72rem] text-[#6b7f96]">Reference {error.digest}</p>
        )}
      </div>
    </main>
  );
}
