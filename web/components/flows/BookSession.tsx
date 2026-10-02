"use client";

import { useEffect, useMemo, useState } from "react";
import { api, money, type Booking, type Day, type Payee, type Session } from "@/lib/api";
import { site } from "@/lib/content/site";
import { Modal } from "./Modal";
import { Assurance } from "./Assurance";
import { usePayment } from "./usePayment";
import { Prompting, ErrorBox, Mark } from "./BuyBook";

/**
 * Hold first, pay second.
 *
 * The seat is taken off the board the moment a time is chosen and before
 * any money is asked for, so nobody pays for a slot somebody else is
 * about to take. A failed payment leaves the hold alive so they can
 * retry; an abandoned one lapses on its own with no cleanup job.
 */
export function BookSession({
  open, initialType, onClose,
}: { open: boolean; initialType?: "free" | "paid"; onClose: () => void }) {
  const [days, setDays] = useState<Day[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [payee, setPayee] = useState<Payee | null>(null);
  const [type, setType] = useState<"free" | "paid">(initialType ?? "paid");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [held, setHeld] = useState<Booking | null>(null);
  const [left, setLeft] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [diary, setDiary] = useState<"loading" | "ready" | "down">("loading");
  const { state, watch, reset, busy: paying, generation } = usePayment();

  useEffect(() => { if (initialType) setType(initialType); }, [initialType]);

  /* A failed diary used to be swallowed, leaving an empty grid, a dead
     button and no explanation — the exact state a visitor hits if the API
     is down or the page was deployed without it. It says so now, and
     gives them the phone number instead of a dead end. */
  const load = () => {
    setDiary("loading");
    return api.slots()
      .then((d) => { setDays(d.days); setSessions(d.sessions); setPayee(d.payee); setDiary("ready"); })
      .catch(() => setDiary("down"));
  };
  useEffect(() => { if (open) load(); }, [open]);

  // The countdown reads the hold's own deadline, not a tick counter: a
  // counter drifts, and the lapse has to agree with the server's clock.
  useEffect(() => {
    if (!held?.holdExpires) return;
    const tick = () => setLeft(Math.max(0, Math.round((held.holdExpires! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [held]);

  const session = sessions[type];
  const amount = session?.price ?? (type === "paid" ? 5000 : 0);
  const day = useMemo(() => days.find((d) => d.date === date), [days, date]);

  const close = () => {
    reset(); setHeld(null); setDate(null); setTime(null); setConfirmed(null); setError(null); onClose();
  };

  async function hold() {
    if (!date || !time) return;
    setBusy(true); setError(null);
    try {
      const r = await api.hold({ type, date, time });
      setHeld(r.booking); setPayee(r.payee);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That slot could not be held.");
      load();                       // the board moved under us
      setDate(null); setTime(null);
    } finally { setBusy(false); }
  }

  async function go() {
    if (!held) return;
    setBusy(true); setError(null);
    const mine = generation.current;
    try {
      if (!held.amount) {
        const r = await api.confirmFree({ bookingRef: held.ref, ...form });
        if (generation.current !== mine) return;
        setConfirmed(r.booking);
      } else {
        const r = await api.checkout({ bookingRef: held.ref, ...form });
        // The dialog may have been closed while Safaricom was thinking.
        if (generation.current !== mine) return;
        watch(r.orderId, r.amount);
      }
    } catch (e) {
      if (generation.current !== mine) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const done = confirmed ?? (state.phase === "done" ? state.order.booking ?? null : null);
  const mm = String(Math.floor(left / 60)); const ss = String(left % 60).padStart(2, "0");

  return (
    <Modal open={open} onClose={close} locked={paying}
           kicker="Consultation" title="Book a Session with Paul">
      {done ? (
        <Confirmed b={done} onClose={close} />
      ) : state.phase === "prompting" ? (
        <Prompting amount={state.amount} />
      ) : state.phase === "failed" ? (
        <div className="mt-5 text-center">
          <Mark />
          <h4 className="mt-4 text-[1.3rem] font-semibold">Not completed</h4>
          <p className="mx-auto mt-2 max-w-[380px] text-[.9rem] text-[#5a6a7c]">{state.message}</p>
          <p className="mt-2 text-[.82rem] text-[#8d9aa8]">Your slot is still held. You can try again.</p>
          <button onClick={reset} className="mt-4 w-full rounded-[10px] bg-navy py-3 font-bold text-white">Try again</button>
        </div>
      ) : !held ? (
        <>
          <div className="mt-4 flex gap-1.5 rounded-full bg-[#f1f4f8] p-1.5">
            {(["free", "paid"] as const).map((k) => (
              <button key={k} onClick={() => { setType(k); setDate(null); setTime(null); }}
                      className={`flex-1 rounded-full px-3 py-2.5 text-[.85rem] font-semibold transition
                        ${type === k ? "bg-[#17344f] text-white shadow" : "text-[#4a5865]"}`}>
                {sessions[k]
                  ? `${sessions[k].label}${sessions[k].price ? " · " + money(sessions[k].price) : " · Free"}`
                  : k === "free" ? "30-minute review · Free" : "60-minute coaching"}
              </button>
            ))}
          </div>

          {diary === "down" && (
            <div className="mt-4 rounded-[13px] border border-[#f1c9c9] bg-[#fdf2f2] px-4 py-3.5 text-[.88rem] leading-relaxed text-[#8c2f2f]">
              We cannot reach the diary right now, so we cannot show you what is free.
              Call <a href={site.phoneHref} className="font-bold underline">{site.phone}</a> and
              a person will book you in.
            </div>
          )}
          {diary === "loading" && (
            <p className="mt-4 text-[.88rem] text-[#8d9aa8]">Loading the diary…</p>
          )}
          {diary === "ready" && days.length === 0 && (
            <div className="mt-4 rounded-[13px] bg-[#f5f8fa] px-4 py-3.5 text-[.88rem] leading-relaxed text-[#5a6a7c]">
              Every slot in the next two weeks is taken. Call{" "}
              <a href={site.phoneHref} className="font-bold text-navy underline">{site.phone}</a>{" "}
              and we will find you a time.
            </div>
          )}

          <p className={`mt-4 text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8d9aa8] ${diary === "ready" && days.length ? "" : "hidden"}`}>Choose a date</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {days.map((d) => {
              const free = d.slots.some((s) => s.available);
              const [, m, dd] = d.date.split("-");
              return (
                <button key={d.date} disabled={!free} onClick={() => { setDate(d.date); setTime(null); }}
                        className={`rounded-[10px] border px-1 py-2.5 text-[.72rem] transition
                          ${date === d.date ? "border-[#17344f] bg-[#17344f] text-white"
                            : free ? "border-[#dfe5ec] bg-white hover:border-gold" : "border-[#eef1f5] opacity-40"}`}>
                  <span className="block text-[#8d9aa8]">{d.weekday}</span>
                  <b className="block text-base tnum">{Number(dd)}</b>
                  <span className="block text-[#8d9aa8]">{MONTHS[Number(m) - 1]}</span>
                </button>
              );
            })}
          </div>

          {day && (
            <>
              <p className="mt-4 text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8d9aa8]">
                Choose a time (EAT)
              </p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {day.slots.map((s) => (
                  <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)}
                          className={`rounded-[10px] border px-1 py-2.5 text-[.82rem] tnum transition
                            ${time === s.time ? "border-[#17344f] bg-[#17344f] text-white"
                              : s.available ? "border-[#dfe5ec] bg-white hover:border-gold"
                              : "border-[#eef1f5] line-through opacity-40"}`}>
                    {s.time}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <ErrorBox>{error}</ErrorBox>}

          <button onClick={hold} disabled={!date || !time || busy}
                  className="mt-5 w-full rounded-[10px] bg-gold-bright py-3.5 font-extrabold text-navy
                             transition disabled:opacity-40">
            Hold this slot →
          </button>
          <p className="mt-2.5 text-center text-[.74rem] text-[#8d9aa8]">
            The slot is held for you before anything is paid.
          </p>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-[13px]
                          border-2 border-mpesa/25 bg-mpesa/5 px-4 py-3.5">
            <div>
              <p className="text-[.72rem] font-extrabold uppercase tracking-[.1em] text-mpesa">✓ Your slot is held</p>
              <p className="mt-1 text-[.88rem] text-[#3c4a5a]">
                {longDate(held.startsAt)} · {held.time} EAT
              </p>
              <p className="text-[.7rem] text-[#8d9aa8]">Reference {held.ref}</p>
            </div>
            <div className="text-right">
              <div className="text-[1.4rem] font-extrabold leading-none text-[#17344f] tnum">{mm}:{ss}</div>
              <div className="text-[.62rem] uppercase tracking-[.1em] text-[#8d9aa8]">held for you</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <F label="Full name" v={form.name} set={(v) => setForm({ ...form, name: v })} ph="Jane Wanjiku" />
            <F label="Phone (M-Pesa)" v={form.phone} set={(v) => setForm({ ...form, phone: v })} ph="07XX XXX XXX" />
            <div className="sm:col-span-2">
              <F label="Email" v={form.email} set={(v) => setForm({ ...form, email: v })} ph="you@example.com" type="email" />
            </div>
            <div className="sm:col-span-2">
              <F label="What would you like to discuss?" v={form.note} set={(v) => setForm({ ...form, note: v })}
                 ph="Briefly describe what you need clarity on" />
            </div>
          </div>

          {held.amount > 0 && <Assurance amount={held.amount} payee={payee} />}
          {error && <ErrorBox>{error}</ErrorBox>}

          <button onClick={go} disabled={busy || left === 0}
                  className={`mt-5 w-full rounded-[10px] py-3.5 font-extrabold text-white transition disabled:opacity-60
                              ${held.amount ? "bg-mpesa hover:brightness-110" : "bg-navy"}`}>
            {held.amount ? `📱 Send the M-Pesa prompt · ${money(held.amount)}` : "Confirm the free review"}
          </button>
          {left === 0 && <p className="mt-2 text-center text-[.8rem] text-[#8c2f2f]">
            The hold lapsed. Pick a time again — you have not been charged.
          </p>}
        </>
      )}
    </Modal>
  );
}

function Confirmed({ b, onClose }: { b: Booking; onClose: () => void }) {
  return (
    <div className="mt-5 text-center">
      <Mark ok />
      <h4 className="mt-4 text-[1.3rem] font-semibold">Your session is confirmed.</h4>
      <p className="mx-auto mt-2 max-w-[400px] text-[.9rem] leading-relaxed text-[#5a6a7c]">
        {longDate(b.startsAt)} at {b.time} EAT. Reference <b>{b.ref}</b>.
        {b.emailedTo ? <> A confirmation is on its way to <b>{b.emailedTo}</b>.</> : null}
      </p>

      <dl className="mt-4 space-y-1.5 rounded-[13px] bg-[#f5f8fa] px-4 py-3.5 text-[.85rem]">
        <Row k="Session" v={b.session} />
        {b.receipt && <Row k="M-Pesa receipt" v={b.receipt} />}
        {b.amount > 0 && <Row k="Paid" v={money(b.amount)} />}
      </dl>

      {b.meetLink ? (
        <a href={b.meetLink} target="_blank" rel="noreferrer"
           className="mt-4 block rounded-full bg-[#1a73e8] py-3.5 font-extrabold text-white">
          Join with Google Meet
        </a>
      ) : (
        <p className="mt-4 rounded-[11px] bg-[#f5f8fa] px-4 py-3 text-[.82rem] text-[#5a6a7c]">
          Your Meet link is being created and will be in your email. If it does not
          arrive, call and we will read it to you.
        </p>
      )}

      {b.icsUrl && (
        <a href={b.icsUrl} className="mt-3 block rounded-[10px] border border-[#cbd3dc] py-3 font-bold text-navy">
          Add to calendar
        </a>
      )}
      <button onClick={onClose} className="mt-3 w-full text-[.85rem] text-[#6b7784] hover:text-navy">Close</button>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4"><dt className="text-[#6b7784]">{k}</dt>
    <dd className="text-right font-semibold text-[#17344f]">{v}</dd></div>
);

function F({ label, v, set, ph, type = "text" }: {
  label: string; v: string; set: (s: string) => void; ph?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[.78rem] font-semibold text-[#4a5865]">{label}</span>
      <input type={type} value={v} placeholder={ph} onChange={(e) => set(e.target.value)}
             className="w-full rounded-[10px] border border-[#d7dee6] px-3.5 py-2.5 text-[.92rem]
                        outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20" />
    </label>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Nairobi",
  });
