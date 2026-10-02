"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { usePrices } from "@/lib/usePrices";

type State =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "sent"; message: string; url: string | null }
  | { phase: "error"; message: string };

/**
 * An address in exchange for a chapter.
 *
 * The strongest thing Paul has to give away is the book he already wrote,
 * and every other conversion on this page is a one-off payment: somebody
 * who is not ready to buy today leaves no trace. This is the only part of
 * the site that starts a relationship instead of ending one.
 *
 * The chapter is sent as a link rather than an attachment — a megabyte of
 * PDF is what turns a first email into a spam folder — and the download
 * is offered on screen as well, because the address is captured whether
 * or not the email provider is having a good minute.
 */
export function FreeChapter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const { chapterReady } = usePrices();

  // Until the chapter file exists the endpoint answers 503, so offering
  // the form would be asking for an address in exchange for an error.
  // The section simply is not there.
  if (!chapterReady) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ phase: "sending" });
    try {
      const res = await fetch("/api/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "book-section" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "That did not go through. Please try again.");
      setState({ phase: "sent", message: body.message, url: body.downloadUrl ?? null });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "That did not go through." });
    }
  }

  return (
    <Reveal className="mt-12 rounded-[20px] border border-gold-400/25 p-7 lg:p-9
      [background:radial-gradient(90%_80%_at_10%_0%,rgba(230,184,76,.12),transparent_60%),linear-gradient(160deg,#0c2238,#17344f)]">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-[.72rem] font-extrabold uppercase tracking-[.16em] text-gold-400">
            Read a chapter first
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.2vw,2.1rem)]
                         font-semibold leading-tight text-white">
            The chapter on reading a loan offer — free.
          </h3>
          <p className="mt-3 max-w-lg text-[.95rem] leading-relaxed text-text-tertiary">
            The rate you are actually paying, the fees behind it, and whether the
            repayment survives a bad month. No payment, no card — an email address
            and it is yours.
          </p>
        </div>

        {state.phase === "sent" ? (
          <div className="rounded-[14px] border border-mpesa/30 bg-mpesa/10 p-5">
            <p className="text-[.9rem] font-bold text-white">{state.message}</p>
            {state.url && (
              <a href={state.url}
                 className="mt-3 block rounded-[10px] bg-gold-bright py-3 text-center text-[.88rem]
                            font-extrabold text-navy">
                Download it now
              </a>
            )}
            <p className="mt-3 text-[.75rem] leading-relaxed text-text-tertiary">
              You will not be added to anything else without being asked.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[.76rem] font-semibold text-text-tertiary">
                Your name <span className="font-normal text-text-muted">(optional)</span>
              </span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Wanjiku"
                     className="w-full rounded-[10px] border border-white/15 bg-white/5 px-3.5 py-3
                                text-[.92rem] text-white placeholder:text-text-muted outline-none
                                transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[.76rem] font-semibold text-text-tertiary">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="you@example.com"
                     className="w-full rounded-[10px] border border-white/15 bg-white/5 px-3.5 py-3
                                text-[.92rem] text-white placeholder:text-text-muted outline-none
                                transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
            </label>

            {state.phase === "error" && (
              <p className="rounded-[10px] border border-[#f1c9c9]/40 bg-[#fdf2f2]/10 px-3.5 py-2.5
                            text-[.84rem] text-[#ffb4b4]">
                {state.message}
              </p>
            )}

            <button type="submit" disabled={state.phase === "sending"}
                    className="magnetic mt-1 rounded-[10px] bg-gold-bright py-3.5 text-[.9rem]
                               font-extrabold text-navy transition hover:brightness-105 disabled:opacity-60">
              {state.phase === "sending" ? "Sending…" : "Send me the chapter →"}
            </button>
            <p className="text-[.72rem] leading-relaxed text-text-muted">
              One email with the chapter. Nothing else unless you ask.
            </p>
          </form>
        )}
      </div>
    </Reveal>
  );
}
