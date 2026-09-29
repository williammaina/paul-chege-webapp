"use client";

import { useState } from "react";
import { api, money, type Payee } from "@/lib/api";
import { Modal } from "./Modal";
import { Assurance } from "./Assurance";
import { usePayment } from "./usePayment";
import { usePrices } from "@/lib/usePrices";

export function BuyBook({
  sku, onClose,
}: { sku: "ebook" | "physical" | null; onClose: () => void }) {
  const { price, health } = usePrices();
  const { state, watch, reset } = usePayment();
  const [form, setForm] = useState({ name: "", phone: "", email: "", town: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const payee: Payee | null = health?.payee ?? null;
  const amount = sku ? price(sku) : 0;
  const physical = sku === "physical";

  const close = () => { reset(); setError(null); onClose(); };

  async function pay() {
    if (!sku) return;
    setBusy(true); setError(null);
    try {
      // Only the SKU goes up. The price is the server's to decide.
      const r = await api.checkout({ items: [{ sku, qty: 1 }], ...form });
      watch(r.orderId, r.amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const label = physical ? "Paperback" : "eBook";

  return (
    <Modal open={!!sku} onClose={close} kicker="The Anatomy of Smart Borrowing" title={`Buy the ${label}`}>
      {state.phase === "idle" && (
        <>
          <div className="mt-4 flex items-baseline justify-between rounded-[13px] bg-[#f5f8fa] px-4 py-3">
            <span className="text-[.9rem] text-[#6b7784]">{label}</span>
            <b className="text-[1.1rem] text-[#12304d] tnum">{money(amount)}</b>
          </div>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Jane Wanjiku" />
            <Field label="M-Pesa phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="07XX XXX XXX" />
            <Field label="Email — receipt & download" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" type="email" />
            {physical && <Field label="Delivery town" value={form.town} onChange={(v) => setForm({ ...form, town: v })} placeholder="Nairobi" />}
          </div>

          <Assurance amount={amount} payee={payee} />
          {error && <ErrorBox>{error}</ErrorBox>}

          <button onClick={pay} disabled={busy}
                  className="mt-5 w-full rounded-[10px] bg-mpesa py-3.5 font-extrabold text-white
                             transition hover:brightness-110 disabled:opacity-60">
            📱 Send the M-Pesa prompt · {money(amount)}
          </button>
          <p className="mt-2.5 text-center text-[.74rem] leading-relaxed text-[#8d9aa8]">
            You will get a prompt on your handset. Enter your PIN there — never here.
          </p>
        </>
      )}

      {state.phase === "prompting" && <Prompting amount={state.amount} />}

      {state.phase === "done" && (
        <div className="mt-5 text-center">
          <Mark ok />
          <h4 className="mt-4 text-[1.3rem] font-semibold">Paid. Thank you.</h4>
          <p className="mx-auto mt-2 max-w-[380px] text-[.9rem] leading-relaxed text-[#5a6a7c]">
            M-Pesa receipt <b className="tnum">{state.order.receipt}</b>.
            {state.order.digital ? " Your download is ready below." : " We will be in touch about delivery."}
          </p>
          {state.order.downloadUrl && (
            <a href={state.order.downloadUrl}
               className="mt-4 block rounded-full bg-mpesa py-3.5 font-extrabold text-white">
              Download the eBook
            </a>
          )}
          <button onClick={close} className="mt-3 w-full text-[.85rem] text-[#6b7784] hover:text-navy">Close</button>
        </div>
      )}

      {state.phase === "failed" && (
        <div className="mt-5 text-center">
          <Mark />
          <h4 className="mt-4 text-[1.3rem] font-semibold">Not completed</h4>
          <p className="mx-auto mt-2 max-w-[380px] text-[.9rem] leading-relaxed text-[#5a6a7c]">{state.message}</p>
          <button onClick={reset} className="mt-4 w-full rounded-[10px] bg-navy py-3 font-bold text-white">
            Try again
          </button>
        </div>
      )}
    </Modal>
  );
}

export function Prompting({ amount }: { amount: number }) {
  return (
    <div className="mt-6 text-center">
      <div className="relative mx-auto grid h-[74px] w-[74px] place-items-center text-[1.8rem]">
        <span className="absolute inset-0 animate-ping rounded-full bg-mpesa/20" />
        📲
      </div>
      <p className="mt-4 font-extrabold text-mpesa">Check your phone</p>
      <ol className="mx-auto mt-4 max-w-[320px] space-y-2 text-left text-[.83rem] text-[#5a6a7c]">
        <li>1. A prompt for <b>{money(amount)}</b> appears on your handset.</li>
        <li>2. Enter your M-Pesa PIN there.</li>
        <li>3. This page updates itself — do not close it.</li>
      </ol>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[.78rem] font-semibold text-[#4a5865]">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
             className="w-full rounded-[10px] border border-[#d7dee6] px-3.5 py-2.5 text-[.92rem]
                        outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20" />
    </label>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5 rounded-[11px] border border-[#f1c9c9] bg-[#fdf2f2] px-3.5 py-3 text-[.85rem] text-[#8c2f2f]">
      {children}
    </p>
  );
}

export function Mark({ ok = false }: { ok?: boolean }) {
  return (
    <div className={`mx-auto grid h-[58px] w-[58px] place-items-center rounded-[18px] text-[1.6rem]
                     ${ok ? "bg-mpesa/10 text-mpesa" : "bg-[rgba(220,38,38,.1)] text-[#dc2626]"}`}>
      {ok ? "✓" : "✕"}
    </div>
  );
}
