import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Menu, X, ChevronDown, ShoppingCart, Phone, MessageCircle, Play, Search,
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown,
  BookOpen, Plus, Minus, Youtube, Star, ArrowRight, Loader2, Smartphone,
  Users, Mail, Calculator, Sparkles, Trash2, Scale, FileText,
  Instagram, Facebook, Linkedin, Quote, Landmark, CreditCard,
  Globe2, ArrowUpRight, Award, PlayCircle, MapPin, Send,
  GraduationCap, Target, Building2, Sprout, Music2, Navigation, ChevronRight, HeartPulse, Sun, Moon, ArrowUp,
  AlertCircle, XCircle, Info, Download, Lock, Video,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   PAUL CHEGE CONSULTANCY TV
   Learn · Plan · Build · Prosper

   Visual system — navy hero, light body (per reference), gold as the constant.
     ink      #0A1128   royal #12306B   line #E3E8F2
     paper    #FFFFFF   mist  #F5F7FC   cream #FBF7EC
     gold     #D4AF37 / #F3E5AB / #A8842A
     m-pesa   #00A651
   ──────────────────────────────────────────────────────────────────────────── */

const WHATSAPP = "https://wa.me/254796882372";
const USSD = "*519*30#";

/* Verified from bizsure.co.ke (the brokerage Paul partners with) and from his
   own public channels. The consultancy publishes no separate street address —
   see README before changing these. */
const OFFICE = {
  org: "Bizsure Insurance Brokers",
  line1: "Ciata City Mall, Block A, 2nd Floor",
  line2: "Ridgeways, Kiambu Road, Nairobi",
  hours: "Mon–Fri, 8:00 AM – 5:00 PM",
  phone: "+254 710 890 994",
  phoneAlt: "0709 784 222",
  email: "info@bizsure.co.ke",
  maps: "https://www.google.com/maps/search/?api=1&query=Ciata+City+Mall+Ridgeways+Kiambu+Road+Nairobi",
};

/* Follower counts read off each platform on 28 Sep 2026 — they drift, so treat
   them as a snapshot and re-check before launch. */
const SOCIAL = [
  { icon: Music2, label: "TikTok", href: "https://www.tiktok.com/@paulchegetv", count: "358.7K" },
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/paulchegeconsultancyTv", count: "183K" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@paulchege91", count: "3.2K" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/paul.chege.7739", count: "1.2K" },
];
const CUTOUT = "/img/paul-cutout.webp";
const LOGO = "/img/logo.webp?v=3";          // full lockup, transparent
const LOGO_MARK = "/img/logo-mark.webp?v=3";   // the P + microphone, for small sizes
const PHOTO = "/img/paul-chege.webp";
const BOOK_ART = "/img/book-cover.webp";        // front cover, cropped from the jacket
const BOOK_LAUNCH = "/img/book-launch.webp";   // the launch poster
const NYORO_PHOTO = "/img/paul-ndindi-nyoro.webp";
const YT_CHANNEL = "https://www.youtube.com/@paulchege91";
const YT_PODCASTS = "https://www.youtube.com/@paulchege91/podcasts";
const BOOK_ISBN = "978-9914-9204-1-3";

/* Brands named in Paul's own posts. `logo` is left empty until real logo files
   are supplied — the card falls back to a monogram wordmark. */
const BRANDS = [
  { name: "Bizsure Insurance Brokers", kind: "Insurance partner", logo: "/img/brands/bizsure.webp", href: "https://www.bizsure.co.ke" },
  { name: "Marnju Tiles", kind: "Building & finishes", logo: "/img/brands/marnju-tiles.webp" },
  { name: "Capital Mabati Limited", kind: "Roofing", logo: "/img/brands/capital-mabati.webp" },
  { name: "Mjengo Flexi Limited", kind: "Construction finance", logo: "/img/brands/mjengo-flexi.webp" },
  { name: "Nicmaa Home & Office Furniture", kind: "Workspace fit-out", logo: "/img/brands/nicmaa.webp" },
  { name: "Chic Logistics", kind: "Transport & logistics", logo: "/img/brands/chic-logistics.webp" },
];

const PRICES = { physical: 1999, ebook: 999, coaching: 5000 };

/* ── where form submissions go ────────────────────────────────────────────────
   Two sinks, same shape. Set `provider` plus the matching credential and that
   form goes live; until then it runs in demo mode and says so on screen.

     web3forms  → free access key at web3forms.com (you give the inbox that
                  should receive submissions; they email you the key). Delivery
                  is bound to that inbox — `to` is only used for the fallback
                  "email it instead" link.
     sheets     → a Google Apps Script Web App that appends a row to a Sheet.
                  Deploy the snippet in README.md, paste the /exec URL as `url`.
                  This is the option that gives you a bookings LIST, not just
                  an email. Note: Apps Script answers opaque CORS responses, so
                  we post no-cors and cannot read a reply — see `blind` below.
     formspree  → form id from https://formspree.io/f/XXXXXXXX
     custom     → your own handler; receives JSON by POST, answers 2xx.

   All of these work from a static page with no backend of your own.
   ──────────────────────────────────────────────────────────────────────────── */

const CONTACT_ENDPOINT = {
  provider: "web3forms",   // "web3forms" | "sheets" | "formspree" | "custom" | "none"
  key: "",            // ← paste your Web3Forms access key here to go live
  url: "",            // sheets / custom only
  subject: "New enquiry — Paul Chege Consultancy TV",
  to: "info@bizsure.co.ke",
};

/* Bookings want a durable record, not just a notification. Point `sheets` at an
   Apps Script Web App to get a row per booking in a spreadsheet Paul can open.
   Leave it on web3forms to simply have each booking emailed to the desk. */
const BOOKING_SINK = {
  provider: "sheets",   // a row per booking in a Google Sheet
  key: "",            // unused for sheets
  url: "",            // ← paste your Apps Script /exec URL here to go live
  subject: "New booking — Paul Chege Consultancy TV",
  to: "info@bizsure.co.ke",
};

/* ── Calendly ─────────────────────────────────────────────────────────────────
   Paste the two event links from your Calendly account and the booking hub
   swaps its mock diary for Calendly's real inline widget: live availability,
   Calendly's own confirmation emails, and the invite on Paul's calendar.

     https://calendly.com/<you>/<event-slug>

   Leave them blank and the hub falls back to the built-in diary, which is a
   demo only — it does not know what is already booked.

   When both Calendly and BOOKING_SINK are configured, a scheduled event is
   also logged to the Sheet. Calendly's browser event carries the event and
   invitee URIs, not the full details — for name, email and time in the Sheet,
   add a Calendly webhook server-side.
   ──────────────────────────────────────────────────────────────────────────── */
const CALENDLY = {
  free: "",   // 30-min free insurance review
  paid: "",   // 60-min paid coaching
};

/* ── Payments ─────────────────────────────────────────────────────────────────
   The address of the payment server in `server/`. Point it there and buying
   the book becomes real: a Safaricom STK push to the buyer's handset, the
   money into Paul's own shortcode, and — for the eBook — the file downloading
   by itself the instant Safaricom confirms.

     PC_CONFIG.payments = { api: "https://pay.paulchege.co.ke" }

   Left blank, the modal keeps its honest demo: it says plainly that nothing
   was charged, and it does not pretend a payment happened.
   ──────────────────────────────────────────────────────────────────────────── */
const PAYMENTS = { api: "" };

/* Runtime configuration from public/config.js, so the site can be pointed at
   real services after the build without recompiling anything. */
if (typeof window !== "undefined" && window.PC_CONFIG) {
  Object.assign(CONTACT_ENDPOINT, window.PC_CONFIG.contact || {});
  Object.assign(BOOKING_SINK, window.PC_CONFIG.booking || {});
  Object.assign(CALENDLY, window.PC_CONFIG.calendly || {});
  Object.assign(PAYMENTS, window.PC_CONFIG.payments || {});
}

const calendlyUrlFor = (tab) => (tab === "free" ? CALENDLY.free : CALENDLY.paid);
const calendlyOn = () => !!(CALENDLY.free || CALENDLY.paid);

/** Loads Calendly's widget assets once; resolves false if they cannot be fetched. */
let calendlyLoader = null;
function loadCalendly() {
  if (window.Calendly) return Promise.resolve(true);
  if (calendlyLoader) return calendlyLoader;
  calendlyLoader = new Promise((resolve) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "https://assets.calendly.com/assets/external/widget.js";
    js.async = true;
    js.onload = () => resolve(true);
    js.onerror = () => resolve(false);
    document.head.appendChild(js);
  });
  return calendlyLoader;
}

/** Calendly's inline widget, remounted whenever the event URL changes. */
function CalendlyEmbed({ url, prefill }) {
  const host = useRef(null);
  const [state, setState] = useState("loading");   // loading | ready | failed

  useEffect(() => {
    let dead = false;
    loadCalendly().then((ok) => { if (!dead) setState(ok ? "ready" : "failed"); });
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (state !== "ready" || !host.current || !window.Calendly) return;
    host.current.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: url + "?hide_gdpr_banner=1&primary_color=D4AF37",
      parentElement: host.current,
      prefill,
    });
  }, [state, url]);

  if (state === "failed") {
    return (
      <div className="p-10 text-center">
        <AlertTriangle size={26} className="mx-auto text-[#D4AF37]" />
        <p className="mt-4 text-[14px] text-[var(--ink-3)]">Calendly could not be loaded here.</p>
        <a
          href={url} target="_blank" rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0A1128] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white"
        >
          Open the diary in a new tab <ArrowUpRight size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {state === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-[var(--paper)]">
          <span className="flex items-center gap-2.5 text-[13px] text-[var(--ink-4)]">
            <Loader2 size={16} className="animate-spin text-[#D4AF37]" /> Loading Paul's diary…
          </span>
        </div>
      )}
      <div ref={host} style={{ minWidth: 320, height: 720 }} />
    </div>
  );
}

/* ══ PAYMENTS ══════════════════════════════════════════════════════════════
   The browser's half of the M-Pesa flow. It never sees a price it can change,
   never sees a PIN, and never decides whether a payment succeeded — it asks
   the server, which asks Safaricom.
   ════════════════════════════════════════════════════════════════════════ */

const payApi = (path) => String(PAYMENTS.api || "").replace(/\/+$/, "") + path;

/**
 * Whether a real payment server is answering.
 *
 * This used to be `!!PAYMENTS.api` — a string check. That was wrong in the
 * normal deployment, where the API is served from the same origin as the
 * site and so needs no URL at all: the checkout announced "demo mode" while
 * a perfectly good server sat behind it. Liveness is now something we ask
 * the server, not something we infer from config.
 *
 *   null  → not asked yet
 *   false → nothing there, or there but without Daraja credentials
 *   true  → real money will move
 */
let payHealth = null;
const payListeners = new Set();

async function probePayments() {
  try {
    const res = await fetch(payApi("/api/health"), { cache: "no-store" });
    const body = await res.json();
    payHealth = { reachable: !!body.ok, live: !!body.live, payee: body.payee || null, meet: !!body.meet };
  } catch {
    payHealth = { reachable: false, live: false, payee: null, meet: false };
  }
  payListeners.forEach((fn) => fn(payHealth));
  return payHealth;
}

/** Subscribes a component to the probe result. */
function usePayments() {
  const [health, setHealth] = useState(payHealth);
  useEffect(() => {
    payListeners.add(setHealth);
    if (payHealth === null) probePayments();
    else setHealth(payHealth);
    return () => payListeners.delete(setHealth);
  }, []);
  return health;
}

const paymentsLive = () => !!payHealth?.live;

/** Same rule the server applies, run early so the buyer is told before a
 *  push is spent rather than after Safaricom rejects it. */
function normalisePhone(raw) {
  const d = String(raw || "").replace(/[^\d]/g, "");
  let n = d;
  if (n.startsWith("254")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  return /^[17]\d{8}$/.test(n) ? "254" + n : null;
}

/** Starts a payment. Resolves with { orderId, demo, message }. */
async function startCheckout(payload) {
  const res = await fetch(payApi("/api/checkout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "We could not reach M-Pesa. Please try again.");
  return body;
}

/**
 * Watches one order until Safaricom has decided, then stops. Polling — rather
 * than a socket — because the answer arrives within a minute, and because a
 * poll survives the buyer's phone stealing focus from the browser, which on
 * Android it always does.
 */
function watchOrder(orderId, onUpdate, { timeoutMs = 150000 } = {}) {
  let stopped = false;
  const started = Date.now();

  (async function loop() {
    let wait = 2000;
    while (!stopped) {
      await new Promise((r) => setTimeout(r, wait));
      if (stopped) return;
      try {
        const res = await fetch(payApi("/api/order/" + orderId), { cache: "no-store" });
        const body = await res.json();
        if (stopped) return;
        if (!res.ok) throw new Error(body.error || "Lost contact with the order.");
        if (body.status !== "pending") { onUpdate(body); return; }
        onUpdate(body);
      } catch (err) {
        // A blip in the buyer's connection is not a failed payment. Keep
        // trying until the overall timeout; only then give up.
        if (Date.now() - started > timeoutMs) {
          onUpdate({ status: "unknown", message: err.message });
          return;
        }
      }
      if (Date.now() - started > timeoutMs) {
        onUpdate({
          status: "timeout",
          message: "We did not hear back from Safaricom. If your phone was debited, keep the SMS and contact us — we will not charge you twice.",
        });
        return;
      }
      wait = Math.min(wait * 1.25, 5000);   // ease off, but stay responsive
    }
  })();

  return () => { stopped = true; };
}

/**
 * Pulls the file down into the buyer's Downloads folder.
 *
 * The server already sends `Content-Disposition: attachment`, which is what
 * actually makes every browser — desktop and mobile — save rather than
 * display. The anchor click just starts it. A hidden iframe is not used
 * because iOS Safari ignores those, and a `window.open` would be eaten by
 * the popup blocker since this runs after an await, not inside the click.
 */
function pullDownload(url, filename) {
  try {
    const a = document.createElement("a");
    a.href = url;
    if (filename) a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 4000);
    return true;
  } catch {
    return false;
  }
}

/** True once a placeholder has been replaced with a real value. The bracket
 *  glyph is built from its code point rather than typed, so that the launch
 *  checklist scanning for unfilled placeholders does not match this line. */
const PLACEHOLDER_OPEN = String.fromCharCode(0x27E6);
const filled = (v) => !!v && !String(v).includes(PLACEHOLDER_OPEN);

/**
 * Everything a careful person wants to know before sending KES 5,000 to a
 * number they have never dealt with.
 *
 * The design assumption is that the client is *right* to be suspicious. So
 * rather than reassuring them, this hands them the things they can actually
 * check: the name that will appear on their own handset, a licence number
 * they can look up, an address on a map, and a phone that rings a person.
 * The one line that does the most work is the third — Kenyans are trained to
 * read the name on an M-Pesa prompt, and telling them in advance what it will
 * say turns their own caution into a verification step.
 */
function PayeeAssurance({ payee, amount, compact = false }) {
  const shortcode = payee?.shortcode;
  const name = payee?.name || OFFICE.org;
  return (
    <div className={"rounded-2xl border border-[var(--line)] bg-[var(--paper)] " + (compact ? "p-5" : "p-6")}>
      <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-4)]">
        <ShieldCheck size={13} className="text-[#00A651]" /> Before you pay — check these
      </div>

      <ul className="mt-4 space-y-3.5 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
        <li className="flex gap-3">
          <Smartphone size={15} className="mt-0.5 shrink-0 text-[#00A651]" />
          <span>
            The prompt on your phone will ask for{" "}
            <strong className="text-[var(--ink)]">{fmt(amount)}</strong>
            {shortcode ? (<> to {payee.type === "till" ? "till" : "paybill"} <strong className="text-[var(--ink)]">{shortcode}</strong></>) : null}
            , and it will name <strong className="text-[var(--ink)]">{name}</strong>.{" "}
            <span className="text-[var(--ink-4)]">If it says any other name or any other amount, cancel it and call us.</span>
          </span>
        </li>
        <li className="flex gap-3">
          <Lock size={15} className="mt-0.5 shrink-0 text-[#00A651]" />
          <span>
            You enter your PIN on your own handset, into Safaricom's prompt — never on this page.{" "}
            <strong className="text-[var(--ink)]">Nobody here will ever ask you for your M-Pesa PIN</strong>, on the phone or in writing.
          </span>
        </li>
        <li className="flex gap-3">
          <Landmark size={15} className="mt-0.5 shrink-0 text-[#00A651]" />
          <span>
            {name} is a licensed insurance broker{filled(ENTITY.ira) ? <>, IRA <strong className="text-[var(--ink)]">{ENTITY.ira}</strong></> : null}, at{" "}
            <a href={OFFICE.maps} target="_blank" rel="noreferrer" className="font-bold text-[var(--gold-ink)] underline underline-offset-2">
              {OFFICE.line1}, {OFFICE.line2}
            </a>. Walk in during office hours.
          </span>
        </li>
        <li className="flex gap-3">
          <Phone size={15} className="mt-0.5 shrink-0 text-[#00A651]" />
          <span>
            Anything looks wrong, ring{" "}
            <a href={"tel:" + OFFICE.phone.replace(/\s/g, "")} className="font-bold text-[var(--ink)] underline underline-offset-2">{OFFICE.phone}</a>{" "}
            now, before you pay. A person answers.
          </span>
        </li>
      </ul>

      <div className="mt-5 rounded-xl bg-[#00A651]/[0.07] p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#00A651]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--ink-2)]">
            <strong className="text-[var(--ink)]">If Paul does not join within 10 minutes, you get every shilling back.</strong>{" "}
            No form and no argument — quote your booking reference on WhatsApp and the refund goes out the same day.
            Reschedule free up to 24 hours before.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══ THE DIARY ═════════════════════════════════════════════════════════════
   A seat is held before any money is asked for, and confirmed only when
   Safaricom says the money moved. The client watches a countdown on their own
   hold, which is both true and the clearest signal there is a real system on
   the other end.
   ════════════════════════════════════════════════════════════════════════ */

async function apiJson(path, init) {
  const res = await fetch(payApi(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "That did not work. Please try again.");
  return body;
}

const fetchSlots = () => apiJson("/api/slots");
const holdSlot = (type, date, time) =>
  apiJson("/api/booking/hold", { method: "POST", body: JSON.stringify({ type, date, time }) });
const confirmFreeBooking = (payload) =>
  apiJson("/api/booking/confirm", { method: "POST", body: JSON.stringify(payload) });

/** yyyy-mm-dd in East Africa Time, which is the only clock anyone here uses. */
const eatDate = (d) => {
  const eat = new Date(d.getTime() + (3 * 60 + d.getTimezoneOffset()) * 60000);
  return eat.getFullYear() + "-" + String(eat.getMonth() + 1).padStart(2, "0") + "-" + String(eat.getDate()).padStart(2, "0");
};

/** "10:00" → "10:00 AM", because nobody in Nairobi says fifteen thirty. */
const prettyTime = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ":" + String(m).padStart(2, "0") + " " + ampm;
};

/** Counts a hold down in the client's own view. Returns seconds remaining. */
function useCountdown(until) {
  const [left, setLeft] = useState(() => (until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) return setLeft(0);
    const tick = () => setLeft(Math.max(0, Math.round((until - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);
  return left;
}

const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

/**
 * A page for one order, addressable by its reference.
 *
 * The point is that a purchase does not evaporate when the tab closes. The
 * reference goes in the receipt email and on the confirmation screen, and
 * this is where it leads: current status, and the download if one is owed.
 */
function OrderPage({ reference, onHome }) {
  const [state, setState] = useState({ loading: !!reference, order: null, error: null });
  const [ref, setRef] = useState(reference || "");

  const look = async (id) => {
    if (!id) return;
    setState({ loading: true, order: null, error: null });
    try {
      const res = await fetch(payApi("/api/order/" + encodeURIComponent(id)), { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "We cannot find that order.");
      setState({ loading: false, order: body, error: null });
    } catch (err) {
      setState({ loading: false, order: null, error: err.message });
    }
  };

  useEffect(() => { if (reference) look(reference); }, [reference]);

  const o = state.order;
  const paid = o?.status === "paid";

  return (
    <section className="bg-[var(--mist)] py-12 sm:py-16">
      <div className="mx-auto max-w-[680px] px-4 sm:px-6">
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_60px_-42px_rgba(10,17,40,.5)] sm:p-9">

          {!reference && (
            <form onSubmit={(e) => { e.preventDefault(); look(ref.trim()); }}>
              <h2 className="font-display text-[1.4rem] font-extrabold text-[var(--ink)]">Look up an order</h2>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-4)]">
                The reference is on your receipt, and looks like <span className="font-mono">PC1A2B3C4D</span>.
              </p>
              <div className="mt-5 flex gap-2.5">
                <input
                  value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="PC1A2B3C4D" aria-label="Order reference"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-mono text-sm uppercase text-[var(--ink)] outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
                />
                <GoldButton type="submit" className="shrink-0">Find it</GoldButton>
              </div>
            </form>
          )}

          {state.loading && (
            <p className="flex items-center gap-2.5 py-6 text-[13.5px] text-[var(--ink-4)]">
              <Loader2 size={16} className="animate-spin text-[#D4AF37]" /> Looking that up…
            </p>
          )}

          {state.error && (
            <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-[13px] leading-relaxed text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {state.error} If you have your M-Pesa SMS, send it to us on{" "}
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">WhatsApp</a>{" "}
              and we will sort it out.
            </div>
          )}

          {o && (
            <>
              <div className="flex items-center gap-3.5">
                <span className={"grid h-12 w-12 shrink-0 place-items-center rounded-2xl " +
                  (paid ? "bg-[#00A651]/10 text-[#00A651]" : "bg-[var(--cream)] text-[var(--gold-ink)]")}>
                  {paid ? <CheckCircle2 size={24} /> : <Clock size={22} />}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-[1.3rem] font-extrabold leading-tight text-[var(--ink)]">
                    {paid ? "Paid" : o.status === "pending" ? "Waiting for your PIN" : "Not completed"}
                  </h2>
                  <p className="font-mono text-[12px] text-[var(--ink-5)]">{o.orderId}</p>
                </div>
              </div>

              <div className="mt-6 space-y-2.5 rounded-2xl bg-[var(--mist)] p-6 text-[13px]">
                {[
                  ["Status", o.status],
                  ["Amount", fmt(o.amount)],
                  o.receipt ? ["M-Pesa receipt", o.receipt] : null,
                  o.physical ? ["Delivery", (o.town || "—") + " · 2–3 working days"] : null,
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-[var(--ink-4)]">{k}</span>
                    <span className="text-right font-bold capitalize text-[var(--ink)]">{v}</span>
                  </div>
                ))}
              </div>

              {o.downloadUrl && (
                <a href={o.downloadUrl} download={o.filename || true}
                  className="pc-tap mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00A651] px-6 py-3.5 text-[13px] font-extrabold text-white shadow-lg shadow-[#00A651]/25">
                  <Download size={16} /> Download your eBook
                </a>
              )}

              {o.message && !paid && (
                <p className="mt-5 rounded-2xl bg-[var(--mist)] p-5 text-[12.5px] leading-relaxed text-[var(--ink-3)]">{o.message}</p>
              )}
            </>
          )}

          <button onClick={onHome}
            className="mt-7 text-[12px] font-bold text-[var(--ink-4)] underline underline-offset-4 hover:text-[var(--ink)]">
            Back to the site
          </button>
        </div>
      </div>
    </section>
  );
}

/** Resolves a sink's effective credential (bookings may borrow the contact key). */
const sinkKey = (cfg) => cfg.key || (cfg === BOOKING_SINK ? CONTACT_ENDPOINT.key : "");

const isLive = (cfg = CONTACT_ENDPOINT) =>
  (cfg.provider === "formspree" && !!sinkKey(cfg)) ||
  (cfg.provider === "web3forms" && !!sinkKey(cfg)) ||
  (cfg.provider === "sheets" && !!cfg.url) ||
  (cfg.provider === "custom" && !!cfg.url);

/** POSTs a payload to a sink and resolves with a reference, or throws a readable error. */
async function postForm(cfg, payload, refPrefix) {
  const { provider, url, subject } = cfg;
  const key = sinkKey(cfg);
  const fallbackRef = refPrefix + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  let endpoint = url;
  let body = payload;
  let blind = false;   // true when the response is unreadable by design

  if (provider === "formspree") {
    endpoint = "https://formspree.io/f/" + key;
    body = { ...payload, _subject: subject };
  } else if (provider === "web3forms") {
    endpoint = "https://api.web3forms.com/submit";
    body = { ...payload, access_key: key, subject, from_name: payload.name, replyto: payload.email };
  } else if (provider === "sheets") {
    // Apps Script Web Apps redirect to googleusercontent, which blocks CORS reads.
    // Posting no-cors still appends the row; we just cannot see the response.
    blind = true;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      mode: blind ? "no-cors" : "cors",
      headers: blind
        ? { "Content-Type": "text/plain;charset=utf-8" }   // avoids the preflight Apps Script rejects
        : { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(
      err.name === "AbortError"
        ? "That took too long. Check your connection and try again."
        : "We could not reach the server. Check your connection and try again."
    );
  }
  clearTimeout(timer);

  if (blind) return fallbackRef;   // opaque response: the row is written, we just cannot read back

  let data = null;
  try { data = await res.json(); } catch { /* some handlers answer with no body */ }

  if (!res.ok || data?.success === false || data?.ok === false) {
    const detail = data?.errors?.[0]?.message || data?.message;
    throw new Error(detail || "The server rejected it (" + res.status + "). Please contact us directly.");
  }

  return data?.ref || data?.id || fallbackRef;
}

/** Builds a downloadable .ics so the client can drop the session into their calendar. */
function buildIcs({ title, start, minutes, description, location }) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d) =>
    d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
  const end = new Date(start.getTime() + minutes * 60000);
  const esc = (t) => String(t).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Paul Chege Consultancy TV//EN",
    "BEGIN:VEVENT",
    "UID:" + Date.now() + "@paulchege.co.ke",
    "DTSTAMP:" + stamp(new Date()),
    "DTSTART:" + stamp(start),
    "DTEND:" + stamp(end),
    "SUMMARY:" + esc(title),
    "DESCRIPTION:" + esc(description),
    "LOCATION:" + esc(location),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

/** Turns "2:00 PM" on a Date into a real Date in the browser's zone. */
function atSlot(day, slot) {
  const d = new Date(day);
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return d;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  d.setHours(h, Number(m[2]), 0, 0);
  return d;
}

/* ── navigation ───────────────────────────────────────────────────────────── */

const NAV = [
  { label: "Home", route: "" },
  { label: "About", route: "about" },
  {
    label: "Services",
    route: "services",
    items: [
      { label: "Insurance Brokerage", desc: "Bizsure partner · " + USSD, route: "services", hash: "brokerage", icon: ShieldCheck },
      { label: "Debt & Borrowing Coaching", desc: "Restructure before you sign", route: "services", hash: "coaching", icon: TrendingDown },
      { label: "Claims Advocacy", desc: "We push the insurer, you rest", route: "services", hash: "claims", icon: Scale },
    ],
  },
  { label: "The Book", route: "book" },
  {
    label: "TV Hub",
    route: "tv-hub",
    items: [
      { label: "All Video Guides", desc: "Policies in plain words", route: "tv-hub", filter: "all", icon: PlayCircle },
      { label: "Kikuyu Media", desc: "Ũhoro wa mbeca na Gĩkũyũ", route: "tv-hub", filter: "kikuyu", icon: Globe2 },
      { label: "Debt Strategy", desc: "Loans, CRB and restructuring", route: "tv-hub", filter: "debt", icon: FileText },
    ],
  },
  { label: "Calculator", route: "calculator" },
  { label: "FAQ", route: "faq" },
  { label: "Contact", route: "contact" },
];

/* Which page each route renders, and the banner it carries. */
const PAGES = {
  "": { title: "Home" },
  about: { title: "About Paul", kicker: "Who you are dealing with", sub: "Insurance broker, financial coach, media personality and author — one job across all four: translating what the paperwork will not." },
  services: { title: "Services", kicker: "What we do", sub: "Brokerage, coaching and advocacy under one roof, so the advice you get is never the advice that pays a commission." },
  book: { title: "The Book", kicker: "Understanding loans before you engage", sub: "Six chapters on how lending actually works in Kenya — written for the borrower, not the lender." },
  "tv-hub": { title: "TV Hub", kicker: "The knowledge base", sub: "Every policy, clause and loan structure explained in plain English — and in Kikuyu." },
  calculator: { title: "Smart Calculator", kicker: "The differentiator", sub: "Model a top-up against a consolidation before the bank models it for you." },
  booking: { title: "Book a Session", kicker: "Booking hub", sub: "Pick the conversation you need and take the seat across the table." },
  contact: { title: "Contact", kicker: "Get in touch", sub: "A quote, an offer letter you want read, a claim that was declined, or a media request." },
  faq: { title: "Questions & Answers", kicker: "Straight answers", sub: "The questions that come through the desk most often — on cover, on borrowing, on claims, and on how we work." },
  privacy: { title: "Privacy Notice", kicker: "How we handle your data", sub: "What we collect, why we hold it, who else sees it, and the rights you have under the Data Protection Act 2019." },
  terms: { title: "Terms of Use", kicker: "The agreement", sub: "What this site is, what it is not, and the terms on which we work together." },
  checkout: { title: "Checkout", kicker: "Secure M-Pesa payment", sub: "Confirm what you are buying, see exactly who you are paying, then approve the prompt on your phone." },
  order: { title: "Your order", kicker: "Order status", sub: "Everything about this order — receipt, delivery and your download." },
  404: { title: "Page not found", kicker: "Lost the thread", sub: "That page does not exist. Everything below is one tap away." },
};

/* Pages that exist but should stay out of the sitemap and the nav: one is a
   step in a purchase, the other is personal to a single order. */
const UNLISTED = new Set(["checkout", "order", "404"]);

/* Where the site will live. `config.js` can override it. */
const SITE = { origin: "https://paulchege.co.ke", basePath: "/" };
if (typeof window !== "undefined" && window.PC_CONFIG?.site) Object.assign(SITE, window.PC_CONFIG.site);

/** Per-page title and description, for search results and link previews. */
const SEO = {
  "":          { t: "Paul Chege Consultancy TV — Demystifying Insurance & Smart Leverage",
                 d: "Insurance brokerage, debt and borrowing coaching, and claims advocacy in Kenya. Model a top-up against a consolidation before you sign." },
  about:       { t: "About Paul Chege — Insurance Broker & Financial Coach",
                 d: "Financial advisor, banking professional and author of The Anatomy of Smart Borrowing. Licensed brokerage in partnership with Bizsure." },
  services:    { t: "Services — Insurance Brokerage, Debt Coaching & Claims Advocacy",
                 d: "Cover placed with the underwriter that pays, offer letters read before you sign, and declined claims pursued to settlement." },
  book:        { t: "The Anatomy of Smart Borrowing — by Paul Chege",
                 d: "Understanding loans before you engage. Bank risk models, good debt versus bad, and the top-up trap. Foreword by H.E. Rigathi Gachagua." },
  "tv-hub":    { t: "TV Hub — Financial Literacy Episodes in English & Kikuyu",
                 d: "Banking, borrowing, investing and cover explained plainly. The Financial Literacy podcast and the full video library." },
  calculator:  { t: "Smart Calculator — Top-Up vs Consolidation",
                 d: "Model what a bank top-up really costs against consolidating, with the hidden interest surplus shown in shillings." },
  booking:     { t: "Book a Session with Paul Chege",
                 d: "A free 30-minute insurance review, or 60 minutes of smart borrowing coaching. Pick a slot and the diary confirms it." },
  contact:     { t: "Contact — Paul Chege Consultancy TV",
                 d: "Call the desk, WhatsApp the team, dial the Bizsure USSD line, or send the offer letter you want read." },
  faq:         { t: "Questions & Answers — Insurance and Borrowing in Kenya",
                 d: "Straight answers on excess, comprehensive versus third party, top-up loans, CRB listing, declined claims and working with a broker in Kenya." },
  privacy:     { t: "Privacy Notice — Paul Chege Consultancy TV",
                 d: "What we collect, why, who processes it, how long we keep it, and your rights under Kenya's Data Protection Act 2019." },
  terms:       { t: "Terms of Use — Paul Chege Consultancy TV",
                 d: "The terms on which this site is offered, including that its content is general education and not personal financial advice." },
  404:         { t: "Page not found · Paul Chege Consultancy TV",
                 d: "That page does not exist." },
};

/** Legacy in-page anchors map onto routes so every old call site keeps working. */
const ANCHOR_ROUTE = {
  "#top": "", "#about": "about", "#services": "services", "#book": "book",
  "#tvhub": "tv-hub", "#calculator": "calculator", "#booking": "booking", "#contact": "contact",
};

/** Reads the route out of the hash: "#/services" → "services". */
const baseDir = () => ("/" + String(SITE.basePath || "/").replace(/^\/+|\/+$/g, "") + "/").replace(/\/{2,}/g, "/");

const validRoute = (r) => (r === "" ? "" : r in PAGES && r !== "404" ? r : "404");

/** `/order/PC1A2B3C` → { route: "order", param: "PC1A2B3C" } */
const splitPath = (p) => {
  const [head, ...rest] = p.split("/").filter(Boolean);
  return { head: head || "", param: rest.join("/") || null };
};

/** Real paths, with the old #/hash links still honoured. */
const readRoute = () => {
  const hash = (window.location.hash || "").replace(/^#\/?/, "").split(/[?#]/)[0];
  if (hash) return validRoute(splitPath(hash).head);
  let p = decodeURIComponent(window.location.pathname);
  const b = baseDir();
  if (p.startsWith(b)) p = p.slice(b.length);
  p = p.replace(/^\/+/, "").replace(/index\.html$/, "").replace(/\/+$/, "");
  return validRoute(splitPath(p).head);
};

/** The segment after the route, for pages that address a single record. */
const readParam = () => {
  const hash = (window.location.hash || "").replace(/^#\/?/, "").split(/[?#]/)[0];
  if (hash) return splitPath(hash).param;
  let p = decodeURIComponent(window.location.pathname);
  const b = baseDir();
  if (p.startsWith(b)) p = p.slice(b.length);
  return splitPath(p.replace(/^\/+/, "").replace(/\/+$/, "")).param;
};

const hrefFor = (to) => (to ? baseDir() + to : baseDir());

/* ── content ──────────────────────────────────────────────────────────────── */

const STATS = [
  { icon: Music2, big: "358.7K", small: "TikTok followers", note: "15.5M likes" },
  { icon: Facebook, big: "183K", small: "Facebook followers" },
  { icon: PlayCircle, big: "151", small: "Videos published", note: "9 podcast episodes" },
  { icon: Users, big: "546K+", small: "Combined community" },
];

const SERVICES = [
  {
    id: "brokerage",
    icon: ShieldCheck,
    title: "Insurance Brokerage",
    tag: "Bizsure Partner",
    body: "Motor, medical, WIBA, property and life — placed with the underwriter that actually pays. One broker, every insurer, no allegiance to any of them but yours.",
    points: ["Motor & commercial fleet", "Medical / inpatient cover", "Last expense & life", "Dial " + USSD + " for instant quotes"],
  },
  {
    id: "coaching",
    icon: TrendingDown,
    title: "Debt & Borrowing Coaching",
    tag: "Most requested",
    body: "Before you take the top-up, let us read the offer letter together. Most Kenyans lose six figures to a clause nobody ever explained to them.",
    points: ["Loan offer letter review", "Top-up vs consolidation modelling", "Debt exit roadmap", "Personal & SME facilities"],
  },
  {
    id: "claims",
    icon: Scale,
    title: "Claims Advocacy",
    tag: "We do the fighting",
    body: "A claim declined is not a claim closed. We assemble the file, quote the policy back to the insurer, and follow it all the way to settlement.",
    points: ["Declined claim appeals", "Assessor disputes", "Settlement follow-through", "No jargon left unexplained"],
  },
];

const CHAPTERS = [
  { n: "01", title: "How Banks Actually Model Your Risk", body: "Risk-based pricing, CRB scoring and the internal grade your relationship manager will never show you. Once you can see the model, you can negotiate inside it." },
  { n: "02", title: "Good Debt vs Bad Debt — The Honest Test", body: "A three-question test you can apply in ninety seconds. If the asset cannot service the instalment on its own, you are not leveraging. You are gambling on a repayment schedule." },
  { n: "03", title: "The Top-Up Trap", body: "Why a top-up feels cheaper and almost never is. The clock resets, the balance is repriced, and you pay interest twice on money you had already amortised." },
  { n: "04", title: "Hidden Clauses in the Offer Letter", body: "Variable-rate triggers, early-settlement penalties, insurance tie-ins and the set-off clause. Fourteen pages nobody reads, and the four that decide your outcome." },
  { n: "05", title: "Borrowing for Business, Not for Optics", body: "Working-capital cycles, asset finance and the cash-conversion maths that tells you the largest instalment your business can honestly carry." },
  { n: "06", title: "The Exit Plan", body: "Snowball, avalanche or restructure — chosen by arithmetic, not by mood. Plus how to renegotiate from a position of information rather than desperation." },
];

const PLAYLIST = "PLjTSsypiUf4ZDN7OLT0aOI7HTuo_PFEOP";

/* The FINANCIAL LITERACY podcast, read off the channel on 28 Sep 2026.
   `id` is the YouTube video id — thumbnails and the player derive from it. */
const VIDEOS = [
  { id: "gJXa44cpn_o", cat: "banking", title: "Mobile Banking Nightmare: Is Your Money Safe?", len: "40:27", views: "1K", age: "4mo ago", kw: "mobile banking fraud security money safe" },
  { id: "JlPbNG8olcM", cat: "banking", title: "Grace Period or Debt Trap? ⚠️ The Hidden Cost That Can Sink You", len: "23:00", views: "698", age: "8mo ago", kw: "grace period debt trap loan hidden cost" },
  { id: "atqQnaseJ3c", cat: "business", title: "Married 11 times, auctioned 5 times, and 10 failed businesses — Kariuki, Comfort Homes", len: "55:31", views: "4.4K", age: "8mo ago", kw: "business failure auction comeback entrepreneur kariuki comfort homes" },
  { id: "rFvz1p1AhBI", cat: "investing", title: "Kenya Pipeline Company KPC IPO: What You Need to Know Before Investing 📈", len: "38:22", views: "3.5K", age: "8mo ago", kw: "kpc ipo shares investing kenya pipeline" },
  { id: "5koeXz9-R8I", cat: "insurance", title: "The health cover that pays YOU the cash instead of the hospital", len: "45:15", views: "418", age: "10mo ago", kw: "health cover medical insurance cash benefit hospital" },
  { id: "Kl-BNPd2Ksg", cat: "business", title: "CEO Podcast · Episode 1: From hawker to millionaire entrepreneur", len: "51:51", views: "2.3K", age: "10mo ago", kw: "ceo podcast hawker millionaire entrepreneur business" },
  { id: "7FFJKnwpEpo", cat: "investing", title: "NCBA Shares Are Skyrocketing — The Truth Behind the Hype 🔥", len: "10:59", views: "1.7K", age: "11mo ago", kw: "ncba shares stocks nse investing bank" },
  { id: "xApF-msZJ6M", cat: "investing", title: "Why Promitto Is Selling Shares (Bank + Mortgage Plan): Smart or Risky?", len: "13:56", views: "19K", age: "11mo ago", kw: "promitto shares mortgage bank plan risky" },
  { id: "Daq2pcruXZg", cat: "kikuyu", title: "EP01 · Ndukagure lorii ya FRR na ũrimũ nĩũgũtahwo", len: "28:05", views: "1.9K", age: "1y ago", kw: "kikuyu gikuyu lorii frr mbeca loan" },
];

const ytThumb = (id) => "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
const ytWatch = (id) => "https://www.youtube.com/watch?v=" + id + "&list=" + PLAYLIST;

const FILTERS = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "banking", label: "Banking & Loans", emoji: "💳" },
  { key: "investing", label: "Investing", emoji: "📈" },
  { key: "insurance", label: "Insurance", emoji: "🏥" },
  { key: "business", label: "Business", emoji: "💼" },
  { key: "kikuyu", label: "Kikuyu", emoji: "🇰🇪" },
];







/* ── Legal pages ──────────────────────────────────────────────────────────
   DRAFTS. Written against what this site actually does with data, but they
   have not been reviewed by a Kenyan advocate. Every bracketed token below is a
   value only Paul can supply. Get both reviewed before launch. */
const LEGAL_UPDATED = "28 September 2026";

const ENTITY = {
  name: "⟦Registered entity name⟧",
  trading: "Paul Chege Consultancy TV",
  odpc: "⟦ODPC registration number⟧",
  ira: "⟦IRA licence number⟧",
};

const PRIVACY = [
  {
    h: "Who is responsible for your data",
    p: [
      "This notice covers " + ENTITY.trading + ", trading as " + ENTITY.name + ", of " +
      OFFICE.line1 + ", " + OFFICE.line2 + ". We are the data controller for the information described here.",
      "Insurance business is transacted through Bizsure Insurance Brokers, who act as a separate controller for the cover they place. Where we pass your details to an insurer or to Bizsure in order to obtain a quote, they handle that information under their own notices.",
      "Data Protection Officer: " + OFFICE.email + " · " + OFFICE.phone + ". ODPC registration " + ENTITY.odpc + ".",
    ],
  },
  {
    h: "What we collect, and when",
    list: [
      ["The contact form", "Your name, email address, phone number, the topic you pick, your message, and the fact that you ticked the consent box. Nothing else."],
      ["Booking a session", "Your name, email address, phone number, your chosen date and time, and anything you write in the brief. If you arrive from the calculator, the figures you modelled are attached so Paul can prepare."],
      ["Buying the book", "Your name, phone number and delivery town. Payment itself is handled by Safaricom M-Pesa — we never see or store your PIN, and we do not store card details because we do not accept cards."],
      ["The calculator", "Nothing leaves your browser. The modelling runs entirely on your device. Figures are only transmitted if you choose to attach them to a booking."],
      ["Your browser", "We store two things locally on your device: your light or dark preference, and a flag so a prompt about the book is shown at most once. These never reach our servers and you can clear them at any time."],
      ["Automatically", "Our hosting provider records standard server logs, including IP address, browser type and the pages requested, for security and troubleshooting."],
    ],
  },
  {
    h: "Why we hold it, and on what basis",
    p: [
      "Under the Data Protection Act 2019 we must have a lawful basis for processing. Ours are:",
    ],
    list: [
      ["Your consent", "For the contact form and for any marketing. You may withdraw it at any time by replying to any message or writing to " + OFFICE.email + "."],
      ["Performance of a contract", "To deliver a session you have booked, place cover you have asked for, or send a book you have bought."],
      ["Legitimate interests", "To keep records of advice given, to pursue a claim on your behalf, and to secure the site. We balance these against your rights."],
      ["Legal obligation", "Insurance intermediaries are required to keep certain records; tax law requires others."],
    ],
  },
  {
    h: "Who else sees it",
    p: ["We do not sell your data, and we do not share it for advertising. We use these processors:"],
    list: [
      ["Web3Forms", "Delivers the contact form to our inbox. Your message passes through their servers."],
      ["Google (Sheets and Apps Script)", "Stores the booking record."],
      ["Calendly", "Runs the appointment diary when you book a session."],
      ["Google / YouTube", "Video is embedded in privacy-enhanced mode, which sets no cookie until you press play. Once you play a video, YouTube's own terms and cookies apply."],
      ["Google Fonts", "Serves the typefaces, which involves a request from your browser to Google."],
      ["Our hosting provider", "Serves the pages and keeps the server logs."],
      ["Insurers and Bizsure Insurance Brokers", "Only where you have asked us to obtain a quote, place cover, or pursue a claim."],
    ],
    after: ["Several of these providers operate outside Kenya, so your information may be transferred abroad. We rely on their contractual commitments to protect it to a standard comparable to the Act."],
  },
  {
    h: "How long we keep it",
    list: [
      ["Enquiries that go nowhere", "Deleted within 12 months."],
      ["Client records, advice given, and claims", "Held for 7 years after the relationship ends, which reflects the record-keeping expected of insurance intermediaries."],
      ["Booking records", "24 months."],
      ["Server logs", "As long as our host retains them, typically under 90 days."],
    ],
  },
  {
    h: "Your rights",
    p: ["Under the Data Protection Act 2019 you have the right to:"],
    list: [
      ["Be informed", "Which is what this notice is for."],
      ["Access", "Ask for a copy of what we hold about you."],
      ["Correction", "Have anything inaccurate put right."],
      ["Deletion", "Ask us to erase your data, where we are not required to keep it."],
      ["Object and restrict", "Including objecting to marketing at any time."],
      ["Portability", "Receive your data in a usable format."],
    ],
    after: [
      "Write to " + OFFICE.email + " and we will respond within the statutory timeframe. If you are not satisfied you may complain to the Office of the Data Protection Commissioner at odpc.go.ke.",
    ],
  },
  {
    h: "Security",
    p: [
      "The site is served over HTTPS. Access to enquiry and booking records is limited to Paul and the people who need it to do the work. No transmission over the internet is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    h: "Children",
    p: ["This site is not directed at children under 18, and we do not knowingly collect their data. If you believe a child has sent us information, write to " + OFFICE.email + " and we will delete it."],
  },
  {
    h: "Changes",
    p: ["We will update this notice when our practices change, and the date at the top will change with it. Material changes will be announced on the site."],
  },
];

const TERMS = [
  {
    h: "Who these terms are with",
    p: [
      "These terms govern your use of " + SITE.origin.replace(/^https?:\/\//, "") + ", operated by " + ENTITY.name +
      ", trading as " + ENTITY.trading + ". By using the site you accept them. If you do not accept them, please do not use the site.",
    ],
  },
  {
    h: "This site is education, not advice",
    p: [
      "Everything published here — the articles, the episodes, the book extracts and the calculator — is general financial education. It does not take account of your circumstances, and it is not personal financial, legal or tax advice.",
      "Do not act on anything here without taking advice suited to your situation. A booked consultation is where advice is given; a web page is not.",
    ],
  },
  {
    h: "About the calculator",
    p: [
      "The Smart Calculator is an indicative model. It assumes a standard amortising facility and applies illustrative assumptions for the arrangement fee, the top-up premium and the early settlement penalty. Those assumptions are stated on the page.",
      "Your lender's offer letter governs. Real pricing depends on your credit profile, the security offered, insurance tie-ins and charges we cannot see. Figures produced here are not a quotation, an offer of credit, or a promise of any outcome.",
    ],
  },
  {
    h: "Insurance business",
    p: [
      "Insurance is arranged through Bizsure Insurance Brokers, regulated by the Insurance Regulatory Authority of Kenya under licence " + ENTITY.ira + ".",
      "Cover begins only when the insurer accepts the risk and issues a policy, and the policy wording is what governs — not anything said on this site or in a meeting. We will always tell you the exclusions we know of, but you should read the wording.",
      "Where we are paid commission by an insurer, we will tell you on request.",
    ],
  },
  {
    h: "Bookings, fees and cancellation",
    list: [
      ["Free reviews", "The 30-minute insurance review is free and carries no obligation."],
      ["Paid coaching", "Charged at the rate shown when you book. Payment is due before the session unless agreed otherwise."],
      ["Rescheduling", "Please give at least 24 hours' notice. We will do the same."],
      ["Missed sessions", "A session missed without notice may be charged in full."],
    ],
  },
  {
    h: "The book, and payments",
    list: [
      ["Physical copies", "Dispatched to the town you give us, typically within 2–3 working days. Delivery times are estimates."],
      ["eBook", "The PDF downloads to your device the moment M-Pesa confirms, and the link is emailed to you as well. Because it is delivered immediately and cannot be returned, eBook sales are final once the file has been sent."],
      ["M-Pesa", "Payments are processed by Safaricom. We never see your PIN. Keep the M-Pesa confirmation as your receipt."],
      ["Problems", "If something does not arrive, write to " + OFFICE.email + " and we will put it right."],
    ],
  },
  {
    h: "Intellectual property",
    p: [
      "The text, design, video, the book and its contents belong to " + ENTITY.name + " or its licensors. You may read, quote briefly with attribution, and share links freely.",
      "You may not republish substantial extracts, resell the book or its PDF, or pass the material off as your own.",
    ],
  },
  {
    h: "Third-party content",
    p: [
      "The site embeds video from YouTube, may load a diary from Calendly, and links to other businesses. We do not control those services and are not responsible for their content or their terms. Brands shown on the site are named as associations, not endorsements of any particular product.",
    ],
  },
  {
    h: "What we are liable for",
    p: [
      "We give no warranty that the site will be uninterrupted or error-free, or that the information is complete or current.",
      "To the extent the law allows, we are not liable for loss arising from decisions you take based on the general information on this site. Nothing here excludes liability for fraud, for death or personal injury caused by negligence, or for anything else that cannot lawfully be excluded.",
      "Nothing in these terms limits your rights under the Consumer Protection Act 2012 or the Insurance Act.",
    ],
  },
  {
    h: "Complaints",
    p: [
      "Tell us first: " + OFFICE.email + " or " + OFFICE.phone + ". We aim to acknowledge within two working days.",
      "If we cannot resolve it, an insurance complaint may be taken to the Insurance Regulatory Authority at ira.go.ke, and a data protection complaint to the Office of the Data Protection Commissioner at odpc.go.ke.",
    ],
  },
  {
    h: "Governing law",
    p: ["These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction."],
  },
  {
    h: "Changes",
    p: ["We may update these terms. The date at the top shows when they last changed, and continuing to use the site means you accept the current version."],
  },
];


const LEAD_MAGNET = {
  file: "/downloads/offer-letter-checklist.pdf",
  title: "The Offer Letter Checklist",
  sub: "29 questions to ask your bank before you sign",
  blurb: "Three pages. The fees people miss, the four clauses that decide the outcome, and the six questions to ask if you are being offered a top-up.",
};

const FAQ_GROUPS = [
  { key: "insurance", label: "Insurance", emoji: "🛡️" },
  { key: "borrowing", label: "Borrowing", emoji: "💳" },
  { key: "claims", label: "Claims", emoji: "⚖️" },
  { key: "working", label: "Working with Paul", emoji: "🤝" },
];

const FAQS = [
  { g: "insurance", q: "What does a broker do that going direct to an insurer does not?",
    a: "An insurer can only sell you their own product. A broker holds agencies with many underwriters, so we compare wording as well as price, and we are paid to argue with the insurer on your behalf when a claim is disputed. Our duty is to you, not to any one company." },
  { g: "insurance", q: "Does using a broker cost me more?",
    a: "No. Premiums are filed with the regulator and are the same whether you buy direct or through a broker. We are paid a commission by the insurer out of that premium, and we will tell you what it is if you ask." },
  { g: "insurance", q: "What is the difference between comprehensive and third party?",
    a: "Third party covers damage you cause to other people and their property, and is the legal minimum. Comprehensive adds damage to your own vehicle, theft and fire. The gap matters most when the accident is your fault — under third party, your own repair bill is entirely yours." },
  { g: "insurance", q: "What is an excess, and can I reduce it?",
    a: "The excess is the first part of any claim you pay yourself. A higher excess lowers your premium and raises your exposure. Some insurers let you buy the excess down. Always ask for the excess in shillings, not as a percentage you have to work out." },
  { g: "insurance", q: "Can I get medical cover for parents over 65?",
    a: "Yes, through specialist senior plans, though premiums load sharply with age and pre-existing conditions are usually excluded or subject to a waiting period. Placing cover before a diagnosis is far easier than after, which is why this is worth doing early." },
  { g: "insurance", q: "What is *519*30#?",
    a: "The Bizsure USSD line. Dial it from any handset — no smartphone, no data — for an instant quote and to start a policy. It is the fastest route to cover if you need something today." },

  { g: "borrowing", q: "Is a top-up loan ever the right answer?",
    a: "Sometimes. If your existing rate is already low, the outstanding balance is small, and you need money urgently, a top-up can be reasonable. It becomes expensive when a large balance you have partly repaid is repriced at a higher rate and the clock resets. Model both before deciding — that is what the calculator on this site is for." },
  { g: "borrowing", q: "What is the hidden interest surplus the calculator shows?",
    a: "It is the extra you pay by taking a top-up rather than consolidating, on the same money over the same term. It appears because a top-up charges interest a second time on a balance you had already partly amortised, usually at a higher rate, over a term that starts again." },
  { g: "borrowing", q: "Should I move a bank loan to a SACCO, or the other way?",
    a: "It depends on the rate, the term you can get, and whether your deposits are tied up. SACCO development loans are often cheaper but cap what you can borrow against your shares. As a balance sheet scales, a commercial line sometimes becomes the better tool. The arithmetic decides, not the loyalty." },
  { g: "borrowing", q: "I am listed on CRB. Is anything possible?",
    a: "Yes. Listing is not a life sentence. Get your report first so you know what is actually recorded, then negotiate a settlement or a payment plan with the lender, and rebuild from there. There is a full episode on this in the TV Hub." },
  { g: "borrowing", q: "Do you lend money?",
    a: "No. We are not a lender and we take no commission from lenders. We read the paperwork, model the options and tell you what the facility will actually cost. The borrowing decision, and the lender, remain yours." },
  { g: "borrowing", q: "Is the calculator accurate for my loan?",
    a: "It is indicative. It models a standard amortising facility using the assumptions printed under it. Your real pricing depends on your credit profile, the security offered, insurance tie-ins and charges we cannot see. Use it to understand the shape of the decision, then bring the offer letter to a review." },

  { g: "claims", q: "My claim was declined. Is that the end?",
    a: "Usually not. A declined claim is a position, not a verdict. We re-read the repudiation letter against the actual policy wording, re-examine the police report and assessor's notes, and where the alleged breach is not material to the loss, we take it back to the underwriter formally." },
  { g: "claims", q: "How long should a motor claim take?",
    a: "A straightforward own-damage claim with complete documents typically settles in weeks, not months. Delay is usually caused by missing documents, a disputed assessment, or an insurer waiting to be pushed. We keep the file moving and escalate when it stalls." },
  { g: "claims", q: "Do you charge to pursue a claim?",
    a: "Not for policies placed through us — advocacy is part of the service. If the policy was placed elsewhere, talk to us and we will tell you honestly whether we can help and on what terms." },
  { g: "claims", q: "What if the insurer still will not pay?",
    a: "Complaints can be escalated to the Insurance Regulatory Authority, which supervises insurers in Kenya. We help assemble that file. Most disputes settle before that point, once the policy is quoted back accurately." },

  { g: "working", q: "What happens in a free 30-minute review?",
    a: "We look at what you already have — the cover, the loans, the gaps — and tell you plainly what is working and what is not. No slides, no pitch. If there is nothing worth changing, we will say so." },
  { g: "working", q: "What does coaching cost?",
    a: "A 60-minute smart borrowing session is charged at the rate shown on the booking page. The free insurance review carries no charge or obligation." },
  { g: "working", q: "Can we meet in person?",
    a: "Yes, by appointment at the office at Ciata City Mall, Ridgeways. Most sessions run on Google Meet, which is faster to arrange and works wherever you are." },
  { g: "working", q: "Do you work in Kikuyu?",
    a: "Yes. Much of the TV Hub is in Kikuyu, and sessions can be held in Kikuyu or English. Clarity should not depend on which language you think in." },
  { g: "working", q: "Where can I buy the book?",
    a: "Through this site, by M-Pesa. You get a prompt on your phone; enter your PIN and that is it. The eBook downloads to your device straight away — no waiting for an email — and physical copies are delivered countrywide in two to three working days." },
];


/* Every figure below is checkable by anyone: the platform counts were read on
   28 Sep 2026, the view counts come from the published episodes, and the book
   details are printed on the jacket. Nothing here is self-reported. */
const PROOF_STATS = [
  { icon: Music2, big: "15.5M", small: "Likes on TikTok", src: "tiktok.com/@paulchegetv", href: SOCIAL[0].href },
  { icon: Users, big: "546K+", small: "Following across four platforms", src: "read 28 Sep 2026" },
  { icon: PlayCircle, big: "151", small: "Videos published", src: "youtube.com/@paulchege91", href: SOCIAL[2].href },
  { icon: BookOpen, big: "ISBN", small: "Registered author", src: BOOK_ISBN },
];

const PROOF_EPISODES = [...VIDEOS]
  .sort((a, b) => parseFloat(b.views) * (b.views.includes("K") ? 1000 : 1) -
                  parseFloat(a.views) * (a.views.includes("K") ? 1000 : 1))
  .slice(0, 3);

/* Real client testimonials go here, once they exist and once the client has
   agreed in writing to be quoted. The section renders nothing while it is
   empty — the site shows no social proof rather than invented social proof.

   Shape: { name, role, body, consent: "date the client agreed" }            */
const TESTIMONIALS = [];

const PILLARS = ["Learn", "Plan", "Build", "Prosper"];

const PILLAR_DETAIL = [
  { icon: GraduationCap, title: "Learn", body: "Understand the product before it is sold to you — cover, clauses, rates and all." },
  { icon: Target, title: "Plan", body: "Model the decision on paper first. The arithmetic decides, never the pressure." },
  { icon: Building2, title: "Build", body: "Use leverage the way businesses do: against an asset that services its own instalment." },
  { icon: Sprout, title: "Prosper", body: "Protect what you have built, so one accident or illness cannot undo a decade." },
];

const HATS = [
  { icon: ShieldCheck, label: "Insurance Broker", note: "Bizsure partner" },
  { icon: TrendingDown, label: "Financial Coach", note: "Debt & borrowing" },
  { icon: PlayCircle, label: "Media Personality", note: "546K+ across platforms" },
  { icon: BookOpen, label: "Author", note: "Smart Borrowing" },
];

/* ── helpers ──────────────────────────────────────────────────────────────── */

const fmt = (n) => "KES " + Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-KE");

function amortise(principal, annualRatePct, months) {
  const p = Math.max(0, principal);
  const n = Math.max(1, months);
  const r = annualRatePct / 100 / 12;
  const monthly = r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
  return { monthly, total: monthly * n, interest: monthly * n - p };
}

/** Month-by-month cumulative interest, for the chart. */
function schedule(principal, annualRatePct, months) {
  const r = annualRatePct / 100 / 12;
  const n = Math.max(1, Math.round(months));
  const pay = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  let bal = principal, cum = 0;
  const out = [0];
  for (let m = 0; m < n; m++) {
    const interest = bal * r;
    cum += interest;
    bal = bal + interest - pay;
    out.push(cum);
  }
  return out;
}

/** Two cumulative-interest curves, drawn inline. */
function CostChart({ series, height = 210 }) {
  const W = 620, H = height, PADL = 8, PADR = 8, PADT = 14, PADB = 26;
  const maxY = Math.max(1, ...series.flatMap((s) => s.data));
  const maxX = Math.max(1, ...series.map((s) => s.data.length - 1));
  const x = (i) => PADL + (i / maxX) * (W - PADL - PADR);
  const y = (v) => PADT + (1 - v / maxY) * (H - PADT - PADB);
  const path = (d) => d.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  const area = (d) => path(d) + " L " + x(d.length - 1).toFixed(1) + " " + y(0) + " L " + x(0) + " " + y(0) + " Z";

  return (
    <figure className="mt-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={"Cumulative interest over the term. " + series.map((s) => s.label + " ends at " + fmt(s.data[s.data.length - 1])).join(". ")}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={"g-" + s.key} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity=".28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={PADL} x2={W - PADR} y1={y(maxY * t)} y2={y(maxY * t)}
            stroke="#20305C" strokeWidth="1" strokeDasharray={t ? "3 6" : "none"} />
        ))}

        {series.map((s) => (
          <g key={s.key}>
            <path d={area(s.data)} fill={`url(#g-${s.key})`} />
            <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={x(s.data.length - 1)} cy={y(s.data[s.data.length - 1])} r="4"
              fill={s.color} stroke="#0A1128" strokeWidth="2" />
          </g>
        ))}

        <text x={PADL} y={H - 6} fill="#6E7FA3" fontSize="11">Month 0</text>
        <text x={W - PADR} y={H - 6} fill="#6E7FA3" fontSize="11" textAnchor="end">Month {maxX}</text>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2 text-[11.5px] text-[#9FB0D0]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="font-bold tabular-nums text-white">{fmt(s.data[s.data.length - 1])}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

const ARRANGEMENT_FEE = 0.025;
const TOPUP_PREMIUM = 1.5;
const SETTLEMENT_PENALTY = 0.02;

/* ── primitives ───────────────────────────────────────────────────────────── */

const GOLD_BTN =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 " +
  "text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--ink)] " +
  "bg-[linear-gradient(135deg,#F3E5AB_0%,#D4AF37_45%,#C09B2B_100%)] " +
  "shadow-[0_12px_28px_-12px_rgba(212,175,55,.85)] transition-all duration-300 " +
  "hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-14px_rgba(212,175,55,1)] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 " +
  "active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

function GoldButton({ children, className = "", as: Tag = "button", ...p }) {
  return (
    <Tag {...p} className={GOLD_BTN + " pc-mag " + className}>
      <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">{children}</span>
    </Tag>
  );
}

function OutlineButton({ children, className = "", tone = "light", ...p }) {
  const t = tone === "light"
    ? "border-white/35 text-white hover:border-[#D4AF37] hover:bg-[var(--paper)]/5"
    : "border-[var(--line)] text-[var(--ink)] hover:border-[#0A1128] hover:bg-[#0A1128] hover:text-white";
  return (
    <button
      {...p}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-[13px] font-bold " +
        "uppercase tracking-[0.12em] transition-all duration-300 hover:-translate-y-0.5 " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] " + t + " " + className
      }
    >
      {children}
    </button>
  );
}

function MpesaButton({ children, className = "", ...p }) {
  return (
    <button
      {...p}
      className={
        "inline-flex items-center justify-center gap-2.5 rounded-full bg-[#00A651] px-7 py-4 " +
        "text-[13px] font-bold uppercase tracking-[0.1em] text-white " +
        "shadow-[0_14px_30px_-14px_rgba(0,166,81,.95)] transition-all duration-300 " +
        "hover:bg-[#00b85a] focus:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-[#00A651] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 pc-mag " + className
      }
    >
      {children}
    </button>
  );
}

/** Section heading — eyebrow rule + display title + lede. */
function Head({ eyebrow, title, sub, center, dark }) {
  return (
    <div data-reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className={"mb-4 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] " + (dark ? "text-[#D4AF37]" : "text-[var(--gold-ink)]")}>
        <span className="h-px w-7 bg-current opacity-60" />
        {eyebrow}
      </div>
      <h2 className={"pc-h2 font-display font-bold " + (dark ? "text-white" : "text-[var(--ink)]")}>
        {title}
      </h2>
      {sub && (
        <p className={"mt-5 text-[15.5px] leading-relaxed " + (dark ? "text-[#9FB0D0]" : "text-[var(--ink-3)]")}>{sub}</p>
      )}
    </div>
  );
}

function Field({ label, dark, ...p }) {
  return (
    <label className="block">
      <span className={"mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] " + (dark ? "text-[#8FA0C0]" : "text-[var(--ink-3)]")}>
        {label}
      </span>
      <input
        {...p}
        className={
          "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 " +
          (dark
            ? "border-[#20305C] bg-[#0A1128] text-white placeholder-[#4A5878] focus:border-[#D4AF37]"
            : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] placeholder-[#9AA6BF] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12")
        }
      />
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, display, hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8FA0C0]">{label}</span>
        <span className="font-display text-[1.15rem] font-bold tabular-nums text-[#F3E5AB]">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": pct + "%" }} className="w-full" aria-label={label}
      />
      {hint && <p className="mt-2 text-[11px] leading-snug text-[#6E7FA3]">{hint}</p>}
    </div>
  );
}

function Modal({ open, onClose, children, max = "max-w-lg", label }) {
  const panel = useRef(null);
  useFocusTrap(open, panel);

  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto sm:items-center sm:p-6">
      <div className="fixed inset-0 bg-[#060B1A]/65 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={panel} tabIndex={-1}
        role="dialog" aria-modal="true" aria-label={label}
        className={"pc-pop relative z-10 w-full " + max + " rounded-t-[1.75rem] bg-[var(--paper)] shadow-[0_40px_90px_-20px_rgba(6,11,26,.6)] sm:rounded-[1.75rem]"}
      >
        <button
          onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-[var(--ink-3)] transition-colors hover:bg-[#F1F4FA] hover:text-[var(--ink)]"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}


/** Keeps Tab inside an overlay while it is open, and restores focus on close. */
function useFocusTrap(active, ref) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const prev = document.activeElement;
    const SEL =
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
      'textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

    const focusables = () =>
      [...root.querySelectorAll(SEL)].filter((el) => el.offsetParent !== null || el.tagName === "IFRAME");

    const first = focusables()[0];
    (first || root).focus?.();

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) { e.preventDefault(); return; }
      const i = list.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); list[list.length - 1].focus(); }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      else if (i === -1) { e.preventDefault(); list[0].focus(); }
    };

    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      if (prev && prev.focus) prev.focus();
    };
  }, [active, ref]);
}

/** Light/dark, remembered per visitor and defaulting to the OS setting. */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("pc-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* private mode */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("pc-theme", theme); } catch { /* private mode */ }
  }, [theme]);

  /* follow the OS until the visitor makes their own choice */
  useEffect(() => {
    let chosen = false;
    try { chosen = !!localStorage.getItem("pc-theme"); } catch { /* ignore */ }
    if (chosen) return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  /**
   * Flips the theme behind an expanding circle centred on whatever was
   * clicked, using the View Transitions API. Falls straight through to a
   * plain swap where that is unsupported, or where the visitor has asked
   * for less motion.
   */
  const toggle = (event) => {
    const flip = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) return flip();

    // Centre the circle on the switch itself; fall back to the top-right
    // corner, which is where the control lives.
    const el = event?.currentTarget;
    const r = el?.getBoundingClientRect?.();
    const root = document.documentElement;
    root.style.setProperty("--tx", (r ? r.left + r.width / 2 : window.innerWidth - 60) + "px");
    root.style.setProperty("--ty", (r ? r.top + r.height / 2 : 40) + "px");
    root.classList.add("pc-theming");

    const vt = document.startViewTransition(() => flip());
    const done = () => root.classList.remove("pc-theming");
    vt.ready?.catch(() => {});
    vt.finished.catch(() => {}).finally(done);
  };

  return [theme, toggle];
}

/** Reveals [data-reveal] elements once as they enter the viewport. */
function useReveal(dep) {
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]:not(.is-in)");
    if (!nodes.length) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [dep]);
}

/** Rotates [data-tilt] faces toward the pointer, and rests them on leave. */
/**
 * Makes the primary buttons lean toward the pointer.
 *
 * A few pixels, released on leave. Pointer-fine only — on a touchscreen
 * there is no pointer to lean toward, and the transform would just fight
 * the tap. Runs off one delegated listener rather than one per button.
 */
function useMagnetic() {
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let active = null;
    const STRENGTH = 0.28;
    const MAX = 9;

    const move = (e) => {
      const el = e.target.closest?.(".pc-mag");
      if (el !== active) {
        if (active) active.style.transform = "";
        active = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
      const dy = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
      const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));
      el.style.transform = "translate3d(" + clamp(dx) + "px," + clamp(dy) + "px,0)";
    };
    const reset = () => { if (active) { active.style.transform = ""; active = null; } };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", reset, { passive: true });
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, []);
}

function useTilt() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const MAX = 7;   // degrees — past ~8 it stops reading as a card and starts reading as a gimmick

    const onMove = (e) => {
      const frame = e.target.closest?.("[data-tilt]");
      if (!frame) return;
      const face = frame.querySelector(".pc-tilt-face");
      if (!face) return;
      const r = frame.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      face.style.setProperty("--ty", (px * MAX * 2).toFixed(2) + "deg");
      face.style.setProperty("--tx", (-py * MAX * 2).toFixed(2) + "deg");
    };
    const onLeave = (e) => {
      const frame = e.target.closest?.("[data-tilt]");
      const face = frame?.querySelector(".pc-tilt-face");
      if (!face) return;
      face.style.setProperty("--ty", "0deg");
      face.style.setProperty("--tx", "0deg");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, true);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave, true);
    };
  }, []);
}

/** Drives the hero's parallax layers and fade from the scroll position. */
function useHeroScroll(active) {
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.getElementById("top");
    if (!hero) return;

    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      const h = hero.offsetHeight || 1;
      hero.style.setProperty("--sy", String(y * 0.12));
      hero.style.setProperty("--hero-op", String(Math.max(0, 1 - (y / h) * 1.15)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);
}

/** Feeds the pointer position to .pc-spot cards as --mx / --my. */
function useSpotlight() {
  useEffect(() => {
    const onMove = (e) => {
      const card = e.target.closest?.(".pc-spot");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

/** Eases to a new number whenever `value` changes — for figures that move
    while the visitor drags a slider. Renders through `format`. */
function Ticker({ value, format, className = "" }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const delta = value - start;
    if (Math.abs(delta) < 0.5) { from.current = value; setShown(value); return; }

    const t0 = performance.now();
    const dur = 520;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + delta * eased;
      from.current = v;
      setShown(v);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = value;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span className={className}>{format(shown)}</span>;
}

/** "358.7K" → counts up to 358.7 and keeps the K. Runs once, when seen. */
function CountUp({ value, duration = 1500 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const m = /^([\d.,]+)(.*)$/.exec(String(value));
    const el = ref.current;
    if (!m || !el) return;
    const target = parseFloat(m[1].replace(/,/g, ""));
    const suffix = m[2] || "";
    const decimals = (m[1].split(".")[1] || "").length;
    if (!Number.isFinite(target)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      // Start the clock from the first frame's own timestamp. A rAF timestamp
      // is the time the frame began, which can predate a performance.now()
      // taken later in that same frame — that made the first tick negative,
      // and 1-(1-p)³ with p<0 is negative, so the figures counted backwards.
      let t0 = null;
      const tick = (now) => {
        if (t0 === null) t0 = now;
        const p = Math.min(1, Math.max(0, (now - t0) / duration));
        const eased = 1 - Math.pow(1 - p, 3);
        const n = target * eased;
        setShown(
          (decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-KE")) + suffix
        );
        if (p < 1) raf = requestAnimationFrame(tick);
        else setShown(value);          // land on exactly what was written
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    // The loop outlived the component before this, so a route change left it
    // ticking against a element that was no longer on the page.
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);

  return <span ref={ref}>{shown}</span>;
}

/** An image that fades in over a shimmer, so nothing pops. */
function Img({ src, alt = "", className = "", wrapClass = "", ...rest }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={"relative block overflow-hidden " + wrapClass}>
      {!loaded && <span className="pc-skel absolute inset-0" aria-hidden="true" />}
      <img
        src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={"pc-img-in " + (loaded ? "is-loaded " : "") + className}
        {...rest}
      />
    </span>
  );
}

/** Renders a legal document: contents, then numbered sections. */
function LegalDoc({ sections, updated }) {
  return (
    <section className="bg-[var(--paper)] py-14 sm:py-20">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-4 sm:px-6 lg:grid-cols-[230px_1fr] lg:gap-14 lg:px-10">

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <p className="pc-rule text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[var(--gold-ink)]">On this page</p>
          <ol className="mt-4 space-y-2.5">
            {sections.map((sec, i) => (
              <li key={sec.h}>
                <a
                  href={"#s" + (i + 1)}
                  className="pc-tap-row flex gap-2.5 text-[13px] leading-snug text-[var(--ink-3)] transition-colors hover:text-[var(--gold-ink)]"
                >
                  <span className="shrink-0 tabular-nums text-[var(--ink-5)]">{String(i + 1).padStart(2, "0")}</span>
                  {sec.h}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-7 border-t border-[var(--line)] pt-5 text-[12px] leading-relaxed text-[var(--ink-4)]">
            Last updated<br /><span className="font-bold text-[var(--ink-2)]">{updated}</span>
          </p>
        </aside>

        <div>
          <div className="mb-10 flex items-start gap-3.5 rounded-2xl border border-[#D4AF37]/35 bg-[var(--cream)] p-5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--gold-ink)]" />
            <p className="text-[13px] leading-relaxed text-[var(--ink-2)]">
              <span className="font-bold">Draft, pending legal review.</span> This was written against what the
              site actually does, but it has not been settled by an advocate, and the bracketed values below
              still need supplying. Do not rely on it as a final legal document.
            </p>
          </div>

          <div className="space-y-12">
            {sections.map((sec, i) => (
              <section key={sec.h} id={"s" + (i + 1)} className="scroll-mt-32">
                <h2 className="flex items-baseline gap-3 font-display text-[1.3rem] font-extrabold text-[var(--ink)] sm:text-[1.5rem]">
                  <span className="text-[0.9rem] tabular-nums text-[var(--gold-ink)]">{String(i + 1).padStart(2, "0")}</span>
                  {sec.h}
                </h2>

                {sec.p?.map((t, n) => (
                  <p key={n} className="mt-4 text-[15px] leading-relaxed text-[var(--ink-3)]">{t}</p>
                ))}

                {sec.list && (
                  <dl className="mt-5 space-y-4">
                    {sec.list.map(([term, def]) => (
                      <div key={term} className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5">
                        <dt className="text-[13.5px] font-extrabold text-[var(--ink)]">{term}</dt>
                        <dd className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink-3)]">{def}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {sec.after?.map((t, n) => (
                  <p key={n} className="mt-4 text-[15px] leading-relaxed text-[var(--ink-3)]">{t}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-[1.25rem] bg-[#0A1128] p-7">
            <h3 className="font-display text-[1.1rem] font-extrabold text-white">Questions about any of this?</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#9FB0D0]">
              Write to the desk and a person will answer — not a form letter.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={"mailto:" + OFFICE.email}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#0A1128]">
                <Mail size={14} /> {OFFICE.email}
              </a>
              <a href={"tel:+254710890994"}
                className="inline-flex items-center gap-2 rounded-full border border-[#20305C] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#C7D3EA]">
                <Phone size={14} /> {OFFICE.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One logo on the partner wall. Links out when the brand has a site. */
function BrandCard({ brand: b }) {
  const inner = (
    <>
      <span className="flex h-[76px] items-center justify-center">
        {b.logo ? (
          <Img
            src={b.logo} alt={b.name}
            className="pc-logoplate pc-dim max-h-[68px] w-auto max-w-[180px] object-contain"
          />
        ) : (
          <span className="font-display text-[15px] font-extrabold leading-tight text-[var(--ink)]">{b.name}</span>
        )}
      </span>
      <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-5)]">{b.kind}</span>
      <span className="sr-only">{b.name}</span>
    </>
  );
  const cls =
    "group flex h-[150px] flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-6 text-center " +
    "transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-[0_22px_50px_-30px_rgba(10,17,40,.45)]";
  return b.href
    ? <a href={b.href} target="_blank" rel="noreferrer" className={cls} title={b.name}>{inner}</a>
    : <div className={cls} title={b.name}>{inner}</div>;
}

/** Decorative gold arcs used behind the navy bands. */
function GoldArcs({ className = "" }) {
  return (
    <svg className={"pointer-events-none absolute " + className} viewBox="0 0 600 600" fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i} cx="300" cy="300" r={90 + i * 48}
          stroke="url(#arcGold)" strokeWidth={i % 2 ? 0.8 : 1.4}
          strokeDasharray={i % 3 === 0 ? "none" : "4 10"} opacity={0.5 - i * 0.055}
        />
      ))}
      <defs>
        <linearGradient id="arcGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="45%" stopColor="#F3E5AB" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── main ─────────────────────────────────────────────────────────────────── */

function App() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [route, setRoute] = useState(() => (typeof window === "undefined" ? "" : readRoute()));
  const [routeParam, setRouteParam] = useState(() => (typeof window === "undefined" ? null : readParam()));
  const pending = useRef(null);   // an in-page target to scroll to once the page renders
  const navRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [mpesa, setMpesa] = useState(null);
  const [mpesaForm, setMpesaForm] = useState({ name: "", phone: "", town: "" });
  const [bookingModal, setBookingModal] = useState(null);
  const [calcSnapshot, setCalcSnapshot] = useState(null);
  const [faqGroup, setFaqGroup] = useState("all");
  const [faqQ, setFaqQ] = useState("");
  const [faqOpen, setFaqOpen] = useState(0);

  const [lead, setLead] = useState({ name: "", email: "" });
  const [leadState, setLeadState] = useState("idle");   // idle | sending | done | error
  const [leadErr, setLeadErr] = useState(null);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQ, setPaletteQ] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [bookPrompt, setBookPrompt] = useState(false);
  const paletteRef = useRef(null);
  const cartRef = useRef(null);
  const vtBusy = useRef(false);

  const [amount, setAmount] = useState(850000);
  const [rate, setRate] = useState(16.5);
  const [tenure, setTenure] = useState(48);
  const [mode, setMode] = useState("topup");
  const [existing, setExisting] = useState(1200000);
  const [existingRate, setExistingRate] = useState(14);
  const [monthsLeft, setMonthsLeft] = useState(30);

  const [chapter, setChapter] = useState(2);
  const [edition, setEdition] = useState("physical");

  const [tab, setTab] = useState("free");
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [client, setClient] = useState({ name: "", email: "", phone: "", note: "" });
  const [booked, setBooked] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState(null);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [player, setPlayer] = useState(null);   // the episode playing in the lightbox


  const [contact, setContact] = useState({ name: "", email: "", phone: "", topic: "Insurance quote", message: "", consent: false, botcheck: false });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [sendError, setSendError] = useState(null);

  /* scroll: sticky header, progress rail, active section */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [theme, toggleTheme] = useTheme();
  useReveal(route);
  useSpotlight();
  useTilt();
  useMagnetic();
  useFocusTrap(paletteOpen, paletteRef);
  useFocusTrap(cartOpen, cartRef);
  useHeroScroll(route === "");

  /* ⌘K / Ctrl-K anywhere opens the palette */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteQ("");
        setPaletteIdx(0);
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* the desktop conversion bar appears once the hero is behind you */
  useEffect(() => {
    const hero = document.getElementById("top");
    const trigger = () => setShowBar(window.scrollY > (hero?.offsetHeight || 600) * 0.9);
    trigger();
    window.addEventListener("scroll", trigger, { passive: true });
    return () => window.removeEventListener("scroll", trigger);
  }, [route]);

  /* one gentle nudge on the book page, never twice */
  useEffect(() => {
    if (route !== "book") return;
    try { if (localStorage.getItem("pc-book-prompt")) return; } catch { return; }
    const onScroll = () => {
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (p < 0.55) return;
      setBookPrompt(true);
      try { localStorage.setItem("pc-book-prompt", "1"); } catch { /* ignore */ }
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route]);

  /* history routing, with legacy #/hash links redirected once on arrival */
  useEffect(() => {
    const sync = () => { setRoute(readRoute()); setRouteParam(readParam()); };
    window.addEventListener("popstate", sync);

    const legacy = (window.location.hash || "").replace(/^#\/?/, "").split(/[?#]/)[0];
    if (legacy) {
      const to = validRoute(legacy);
      window.history.replaceState({ route: to }, "", hrefFor(to === "404" ? "" : to));
      setRoute(to);
    }
    return () => window.removeEventListener("popstate", sync);
  }, []);

  /* Route-level structured data: breadcrumbs everywhere, plus the schema that
     earns rich results on the pages that qualify. */
  useEffect(() => {
    const origin = String(SITE.origin).replace(/\/$/, "");
    const abs = (r) => origin + hrefFor(r);
    const graph = [];

    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("") },
        ...(route && route !== "404"
          ? [{ "@type": "ListItem", position: 2, name: PAGES[route]?.title || route, item: abs(route) }]
          : []),
      ],
    });

    if (route === "") {
      graph.push({
        "@type": "WebSite",
        "@id": origin + "/#website",
        url: origin + "/",
        name: "Paul Chege Consultancy TV",
        inLanguage: "en-KE",
        publisher: { "@id": origin + "/#org" },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: origin + "/tv-hub?q={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      });
    }

    if (route === "faq") {
      graph.push({
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }

    if (route === "services") {
      SERVICES.forEach((sv) => graph.push({
        "@type": "Service",
        name: sv.title,
        description: sv.body,
        serviceType: sv.title,
        provider: { "@id": origin + "/#org" },
        areaServed: { "@type": "Country", name: "Kenya" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: sv.title,
          itemListElement: sv.points.map((pt) => ({
            "@type": "Offer", itemOffered: { "@type": "Service", name: pt },
          })),
        },
      }));
    }

    if (route === "tv-hub") {
      VIDEOS.forEach((v) => {
        const [mm, ss] = v.len.split(":").map(Number);
        graph.push({
          "@type": "VideoObject",
          name: v.title,
          description: v.title + " — " + (FILTERS.find((f) => f.key === v.cat)?.label || "") +
            " guidance from Paul Chege Consultancy TV.",
          thumbnailUrl: ytThumb(v.id),
          uploadDate: "2026-01-01",
          duration: "PT" + mm + "M" + ss + "S",
          contentUrl: "https://www.youtube.com/watch?v=" + v.id,
          embedUrl: "https://www.youtube-nocookie.com/embed/" + v.id,
          inLanguage: v.cat === "kikuyu" ? "ki" : "en",
          publisher: { "@id": origin + "/#org" },
        });
      });
    }

    if (route === "booking") {
      graph.push({
        "@type": "Service",
        name: "Financial and insurance consultation",
        provider: { "@id": origin + "/#org" },
        areaServed: { "@type": "Country", name: "Kenya" },
        offers: [
          { "@type": "Offer", name: "30-minute insurance review", price: "0", priceCurrency: "KES" },
          { "@type": "Offer", name: "60-minute smart borrowing coaching", price: String(PRICES.coaching), priceCurrency: "KES" },
        ],
      });
    }

    if (route === "privacy" || route === "terms") {
      graph.push({ "@type": "WebPage", name: PAGES[route].title, url: abs(route),
        inLanguage: "en-KE", isPartOf: { "@id": origin + "/#website" } });
    }

    let el = document.getElementById("pc-route-ld");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "pc-route-ld";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  }, [route]);

  /* title, description, canonical and the social card all follow the route */
  useEffect(() => {
    const meta = SEO[route] || SEO[""];
    const origin = String(SITE.origin).replace(/\/$/, "");
    const url = origin + hrefFor(route === "404" ? "" : route);
    const img = origin + baseDir() + "img/share-card.jpg";

    document.title = meta.t;

    const set = (sel, tag, attrs) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = document.createElement(tag); document.head.appendChild(el); }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };

    set('meta[name="description"]', "meta", { name: "description", content: meta.d });
    set('link[rel="canonical"]', "link", { rel: "canonical", href: url });

    const og = {
      "og:type": "website", "og:site_name": "Paul Chege Consultancy TV",
      "og:title": meta.t, "og:description": meta.d, "og:url": url,
      "og:image": img, "og:image:width": "1200", "og:image:height": "630",
      "og:image:alt": "Paul Chege Consultancy TV — Demystifying Insurance & Smart Leverage",
      "og:locale": "en_KE",
    };
    Object.entries(og).forEach(([k, v]) =>
      set('meta[property="' + k + '"]', "meta", { property: k, content: v }));

    const tw = {
      "twitter:card": "summary_large_image", "twitter:title": meta.t,
      "twitter:description": meta.d, "twitter:image": img,
    };
    Object.entries(tw).forEach(([k, v]) =>
      set('meta[name="' + k + '"]', "meta", { name: k, content: v }));
  }, [route]);

  /* any route change closes the overlays — including a browser back/forward,
     which does not go through nav() */
  useEffect(() => {
    setMobileNav(false);
    setOpenMenu(null);
    setPaletteOpen(false);
    setCartOpen(false);
  }, [route]);

  /* every page opens at the top, unless a dropdown asked for a section */
  useEffect(() => {
    const target = pending.current;
    pending.current = null;
    if (target) {
      const el = document.getElementById(target);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);


  useEffect(() => {
    const away = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  useEffect(() => {
    if (!calendlyOn()) return;
    const onMsg = (e) => {
      let host;
      try { host = new URL(e.origin).hostname; } catch { return; }
      if (host !== "calendly.com" && !host.endsWith(".calendly.com")) return;
      if (e.data?.event !== "calendly.event_scheduled") return;

      const p = e.data.payload || {};
      const ref = "CAL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      setBooked({
        ref, tab, name: client.name, via: "calendly",
        session: tab === "free" ? "30-Min Free Insurance Review" : "60-Min Smart Borrowing Coaching",
        demo: false,
      });

      if (isLive(BOOKING_SINK)) {
        postForm(BOOKING_SINK, {
          name: client.name || "(collected by Calendly)",
          email: client.email || "",
          session: tab === "free" ? "30-Min Free Insurance Review" : "60-Min Smart Borrowing Coaching",
          fee: tab === "free" ? 0 : PRICES.coaching,
          calendlyEvent: p.event?.uri || "",
          calendlyInvitee: p.invitee?.uri || "",
          source: "paulchege.co.ke — calendly",
          submittedAt: new Date().toISOString(),
        }, "CAL").catch(() => { /* Calendly already holds the booking; the log is secondary */ });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [tab, client.name, client.email]);

  useEffect(() => {
    if (!player) return;
    const k = (e) => e.key === "Escape" && setPlayer(null);
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [player]);

  useEffect(() => {
    if (!cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", k);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", k); };
  }, [cartOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* the loan engine */
  const engine = useMemo(() => {
    const fee = (p) => p * ARRANGEMENT_FEE;

    const topPrincipal = existing + amount;
    const topRate = rate + TOPUP_PREMIUM;
    const topA = amortise(topPrincipal + fee(topPrincipal), topRate, tenure);

    const conPrincipal = existing + amount + existing * SETTLEMENT_PENALTY;
    const conA = amortise(conPrincipal + fee(conPrincipal), rate, tenure);

    // C) leave the existing facility alone and borrow the new money on its own
    const keepA = amortise(existing, existingRate, monthsLeft);
    const freshA = amortise(amount + fee(amount), rate, tenure);

    const topCost = topA.total - amount - existing;
    const conCost = conA.total - amount - existing;
    const keepCost = (keepA.total - existing) + (freshA.total - amount);

    const activeS = mode === "topup"
      ? { monthly: topA.monthly, cost: topCost, rate: topRate }
      : { monthly: conA.monthly, cost: conCost, rate };

    const surplus = topCost - conCost;
    const best = Math.min(topCost, conCost, keepCost);

    const curves = [
      { key: "top", label: "Top-up", color: "#FF7A7A",
        data: schedule(topPrincipal + fee(topPrincipal), topRate, tenure) },
      { key: "con", label: "Consolidation", color: "#3DDC84",
        data: schedule(conPrincipal + fee(conPrincipal), rate, tenure) },
    ];
    return {
      active: activeS, topCost, conCost, keepCost, surplus, best, curves,
      topMonthly: topA.monthly, conMonthly: conA.monthly,
      keepMonthly: keepA.monthly + freshA.monthly,
      delta: activeS.cost - best,
      inefficient: mode === "topup" && surplus > 0,
      saving: mode === "consolidate" && surplus > 0 ? surplus : 0,
    };
  }, [amount, rate, tenure, mode, existing, existingRate, monthsLeft]);

  /** One sentence a non-financial reader can act on. */
  const plainRead = useMemo(() => {
    const years = (tenure / 12).toFixed(tenure % 12 === 0 ? 0 : 1);
    const cheapest =
      engine.best === engine.conCost ? "consolidating" :
      engine.best === engine.keepCost ? "leaving the old loan alone and borrowing the new money separately" :
      "the top-up";
    const you = mode === "topup" ? "the top-up" : "consolidating";
    const gap = Math.abs(engine.active.cost - engine.best);

    const opening =
      "Borrowing " + fmt(amount) + " on top of " + fmt(existing) + " over " + years +
      " years, " + you + " costs you " + fmt(engine.active.cost) + " above the money you actually receive — " +
      "that is every shilling of interest and fees combined.";

    const verdict = gap < 1000
      ? " That is the cheapest of the three routes on these figures."
      : " " + cheapest.charAt(0).toUpperCase() + cheapest.slice(1) +
        " would cost " + fmt(gap) + " less, which is " +
        fmt(gap / Math.max(1, tenure)) + " a month back in your pocket.";

    const caution = rate > 20
      ? " At " + rate.toFixed(1) + "% the pricing is above what a clean salary-backed facility should attract — worth challenging before you sign."
      : "";

    return opening + verdict + caution;
  }, [amount, existing, tenure, rate, mode, engine]);

  /** Everything the palette can jump to. */
  const paletteItems = useMemo(() => {
    const pages = Object.entries(PAGES).map(([r, meta]) => ({
      kind: "Page", label: meta.title, hint: meta.kicker || "", terms: meta.sub || "",
      go: () => nav(r), icon: ArrowRight,
    }));
    const legal = [
      { kind: "Page", label: "Questions & Answers", hint: "Straight answers", terms: "faq help excess top-up crb claim", go: () => nav("faq"), icon: MessageCircle },
      { kind: "Action", label: "Download the Offer Letter Checklist", hint: "Free, 29 questions", terms: "pdf checklist lead magnet", go: () => nav("calculator"), icon: FileText },
      { kind: "Legal", label: "Privacy notice", hint: "What we do with your data", terms: "data protection gdpr odpc cookies", go: () => nav("privacy"), icon: ShieldCheck },
      { kind: "Legal", label: "Terms of use", hint: "The agreement", terms: "disclaimer liability advice", go: () => nav("terms"), icon: FileText },
    ];
    const filters = FILTERS.filter((f) => f.key !== "all").map((f) => ({
      kind: "Filter", label: f.label, hint: "Filter the TV Hub", terms: "videos episodes " + f.key,
      go: () => nav("tv-hub", { filter: f.key }), icon: Search,
    }));
    const vids = VIDEOS.map((v) => ({
      kind: "Episode", label: v.title, hint: v.len + " · " + v.views + " views",
      terms: v.kw + " " + (FILTERS.find((f) => f.key === v.cat)?.label || ""),
      go: () => { setPaletteOpen(false); nav("tv-hub"); setTimeout(() => setPlayer(v), 320); }, icon: Play,
    }));
    const chapters = CHAPTERS.map((c, i) => ({
      kind: "Chapter", label: c.title, hint: "The Anatomy of Smart Borrowing", terms: c.body,
      go: () => { nav("book"); setChapter(i); }, icon: BookOpen,
    }));
    const actions = [
      { kind: "Action", label: "Book a free insurance review", hint: "30 minutes, no charge", go: () => openBooking(null, "free"), icon: Calendar },
      { kind: "Action", label: "Buy the book via M-Pesa", hint: fmt(PRICES.physical), go: () => openMpesa("physical"), icon: Smartphone },
      { kind: "Action", label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", hint: "Appearance", go: toggleTheme, icon: theme === "dark" ? Sun : Moon },
      { kind: "Action", label: "Call the desk", hint: OFFICE.phone, go: () => { window.location.href = "tel:+254710890994"; }, icon: Phone },
    ];
    return [...actions, ...pages, ...filters, ...vids, ...chapters, ...legal];
  }, [theme]);

  const paletteHits = useMemo(() => {
    const q = paletteQ.trim().toLowerCase();
    const list = q
      ? paletteItems.filter((i) =>
          (i.label + " " + i.hint + " " + i.kind + " " + (i.terms || "")).toLowerCase().includes(q))
      : paletteItems.slice(0, 9);
    return list.slice(0, 12);
  }, [paletteQ, paletteItems]);

  const faqs = useMemo(() => {
    const q = faqQ.trim().toLowerCase();
    return FAQS.filter((f) =>
      (faqGroup === "all" || f.g === faqGroup) &&
      (!q || (f.q + " " + f.a).toLowerCase().includes(q))
    );
  }, [faqGroup, faqQ]);

  const videos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VIDEOS.filter((v) =>
      (filter === "all" || v.cat === filter) &&
      (!q || (v.title + " " + v.kw).toLowerCase().includes(q))
    );
  }, [filter, query]);

  const days = useMemo(() => {
    const out = [];
    const d = new Date(); d.setHours(0, 0, 0, 0);
    // Mon–Fri only: OFFICE.hours says Mon–Fri 8–5, and offering a Saturday
    // slot books a client into a day nobody is there for.
    while (out.length < 12) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) out.push(new Date(d));
    }
    return out;
  }, []);

  const slots = tab === "free"
    ? ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"]
    : ["10:00 AM", "01:00 PM", "02:00 PM", "05:30 PM"];

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* actions */
  const addToCart = useCallback((item) => {
    setCart((c) => {
      const hit = c.find((i) => i.id === item.id);
      return hit ? c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)) : [...c, { ...item, qty: 1 }];
    });
    setToast({ text: item.name + " added to your cart", action: "View cart" });
  }, []);

  /**
   * Adds an edition of the book.
   *
   * There used to be exactly one "add to cart" button on the whole site,
   * buried on the book page — so the cart existed but there was no way to
   * reach it. This puts the same, correctly-shaped item behind every buy
   * button, including the `sku` the server prices by.
   */
  const addBook = useCallback((v) => {
    addToCart({
      id: "book-" + v,
      sku: v,
      name: "The Anatomy of Smart Borrowing (" + (v === "ebook" ? "eBook" : "Physical") + ")",
      price: v === "ebook" ? PRICES.ebook : PRICES.physical,
    });
  }, [addToCart]);

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const bumpQty = (id, d) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));

  /** Moves to a page. `hash` scrolls to a section once it renders; `filter` presets the TV hub. */
  const nav = (to, opts = {}) => {
    setOpenMenu(null);
    setMobileNav(false);
    if (opts.filter) { setFilter(opts.filter); setQuery(""); }
    pending.current = opts.hash || null;

    const next = hrefFor(to);
    const here = window.location.pathname === next;

    const commit = () => {
      window.history.pushState({ route: to }, "", next + (opts.param ? "/" + opts.param : ""));
      setRoute(to);
      setRouteParam(opts.param || null);
    };

    /* already here — just move within the page */
    if (here) {
      setRoute(to);
      if (opts.hash) {
        const el = document.getElementById(opts.hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    /* One transition at a time — a second one started while the first is still
       running aborts it and logs a TimeoutError. */
    if (document.startViewTransition && !vtBusy.current) {
      document.documentElement.classList.add("pc-has-vt");
      vtBusy.current = true;
      const vt = document.startViewTransition(() => {
        commit();
        return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
      const swallow = () => { /* aborted — the navigation itself still happened */ };
      vt.ready?.catch(swallow);
      vt.updateCallbackDone?.catch(swallow);
      vt.finished.catch(swallow).finally(() => { vtBusy.current = false; });
      return;
    }

    commit();
  };

  /** Older call sites pass an anchor; map it to the page that now owns it. */
  const go = (href) => {
    const to = ANCHOR_ROUTE[href];
    if (to !== undefined) return nav(to);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /**
   * Takes the buyer to the checkout page.
   *
   * This used to open a modal. A purchase deserves a page: it has a URL you
   * can come back to, a back button that means something, room to show who
   * is being paid, and it survives the phone stealing focus mid-payment —
   * which on Android it always does.
   */
  const openMpesa = (variant, fromCart = false) => {
    if (!fromCart) setEdition(variant);
    setMpesa({
      variant, step: 1, loading: false, error: null,
      cart: fromCart,
      amount: fromCart ? cartTotal : null,
      items: fromCart ? cartCount : 1,
    });
    setCartOpen(false);
    nav("checkout");
  };

  /**
   * Step 1 → 2. Asks the server for an STK push, then hands over to the
   * watcher. Nothing here decides that a payment succeeded; that answer only
   * ever comes back from Safaricom.
   */
  const submitMpesa = async (e) => {
    e.preventDefault();
    if (mpesa?.loading) return;

    const phone = normalisePhone(mpesaForm.phone);
    if (!phone) {
      setMpesa((m) => ({ ...m, error: "That does not look like a Kenyan mobile number. Use 07XX XXX XXX." }));
      return;
    }

    const items = mpesa.cart
      ? cart.map((c) => ({
          sku: c.sku || ((c.name || "").toLowerCase().includes("ebook") ? "ebook" : "physical"),
          qty: c.qty || 1,
        }))
      : [{ sku: mpesa.variant, qty: 1 }];
    // Everything an eBook, or a mixed/physical order? `some` was wrong here:
    // a cart with one eBook and one physical is not a digital order.
    const digital = items.length > 0 && items.every((i) => i.sku === "ebook");
    const lines = mpesa.cart
      ? cart.map((c) => ({ label: c.name, qty: c.qty, price: c.price }))
      : [{
          label: "The Anatomy of Smart Borrowing (" + (mpesa.variant === "ebook" ? "eBook PDF" : "Physical copy") + ")",
          qty: 1, price: mpesa.variant === "ebook" ? PRICES.ebook : PRICES.physical,
        }];
    const frozenTotal = lines.reduce((t, l) => t + l.price * l.qty, 0);

    setMpesa((m) => ({ ...m, loading: true, error: null }));

    // No server configured: say so plainly rather than faking a receipt.
    if (!paymentsLive()) {
      await new Promise((r) => setTimeout(r, 900));
      if (mpesa.cart) setCart([]);
      setMpesa((m) => ({ ...m, step: 3, loading: false, demo: true, status: "demo", digital, lines, frozenTotal,
        message: "No payment server is reachable, so nothing was sent and nothing was charged." }));
      return;
    }

    try {
      const started = await startCheckout({
        items, phone, name: mpesaForm.name, town: mpesaForm.town, email: mpesaForm.email,
      });
      setMpesa((m) => ({
        ...m, step: 2, loading: false, digital, lines, frozenTotal,
        orderId: started.orderId, amount: started.amount,
        demo: !!started.demo, message: started.message, status: started.demo ? "demo" : "pending",
      }));
      if (started.demo) {
        if (mpesa.cart) setCart([]);
        setMpesa((m) => ({ ...m, step: 3, status: "demo" }));
      }
    } catch (err) {
      setMpesa((m) => ({ ...m, loading: false, error: err.message }));
    }
  };

  /* Once a push is out, watch it until Safaricom answers. The watcher is torn
     down if the buyer closes the modal, so a dismissed purchase stops
     polling — but the order itself is untouched, and the receipt email still
     carries the download link. */
  useEffect(() => {
    if (mpesa?.step !== 2 || !mpesa.orderId || mpesa.demo) return;
    const stop = watchOrder(mpesa.orderId, (o) => {
      setMpesa((m) => {
        if (!m || m.orderId !== o.orderId) return m;
        const next = { ...m, status: o.status, message: o.message || m.message, receipt: o.receipt,
                       downloadUrl: o.downloadUrl, filename: o.filename };
        // The basket is only given up once the money is actually in. A
        // cancelled prompt must leave the buyer exactly where they were.
        if (o.status === "paid" && m.cart) setCart([]);
        return o.status === "pending" ? next : { ...next, step: 3 };
      });
    });
    return stop;
  }, [mpesa?.step, mpesa?.orderId, mpesa?.demo]);

  /* The moment the money clears, the file starts coming down. This is the
     whole promise of the eBook: pay, and it is in your Downloads folder
     before you have put the phone back in your pocket. */
  const pulled = useRef(null);
  useEffect(() => {
    if (mpesa?.status !== "paid" || !mpesa.downloadUrl) return;
    if (pulled.current === mpesa.orderId) return;      // once per order, not per render
    pulled.current = mpesa.orderId;
    const ok = pullDownload(mpesa.downloadUrl, mpesa.filename);
    setMpesa((m) => (m ? { ...m, autoDownloaded: ok } : m));
    if (ok) setToast({ text: "Your eBook is downloading" });
  }, [mpesa?.status, mpesa?.downloadUrl, mpesa?.orderId]);

  const openBooking = (note, which) => { if (which) setTab(which); setBookingModal({ note }); };

  /* ── the diary ──────────────────────────────────────────────────────── */

  /* Real availability, so the diary can say no. A diary that always says yes
     is a diary nobody believes, and it double-books people. */
  const [slotData, setSlotData] = useState(null);
  const [payee, setPayee] = useState(null);
  useEffect(() => {
    if (!paymentsLive()) return;
    let alive = true;
    fetchSlots()
      .then((d) => { if (alive) { setSlotData(d.days); setPayee(d.payee); } })
      .catch(() => { /* fall back to the local diary; the UI says it is a demo */ });
    return () => { alive = false; };
  }, []);

  /** What is actually free on the chosen day, straight from the server. */
  const dayAvailability = useMemo(() => {
    if (!slotData || !day) return null;
    return slotData.find((d) => d.date === eatDate(day)) || null;
  }, [slotData, day]);

  const [held, setHeld] = useState(null);      // the seat, taken off the board
  const [holdErr, setHoldErr] = useState(null);
  const [holding, setHolding] = useState(false);
  const [pay, setPay] = useState(null);        // the payment running against it
  const holdLeft = useCountdown(held?.holdExpires);

  /* A lapsed hold has to say so, or the client sits looking at a dead screen
     and then finds their money went nowhere. */
  useEffect(() => {
    if (!held?.holdExpires || pay?.status === "paid") return;
    // The deadline itself is the authority, not the ticker — the ticker's
    // state lags a render, and reading it here once declared every fresh
    // hold expired the instant it was created.
    const lapse = () => {
      setHeld(null);
      setPay(null);
      setHoldErr("Your hold ran out, so the slot went back into the diary. Nothing was charged — pick a time again.");
    };
    const remaining = held.holdExpires - Date.now();
    if (remaining <= 0) return lapse();
    const id = setTimeout(lapse, remaining);
    return () => clearTimeout(id);
  }, [held?.ref, held?.holdExpires, pay?.status]);

  /**
   * Step 3 → the seat. Free sessions confirm here and now. Paid sessions get
   * the seat first and the prompt second, so that no client is ever in the
   * position of having paid for a slot that was gone.
   */
  const startBooking = async (e) => {
    e.preventDefault();
    if (holding) return;
    setHoldErr(null);
    setBookError(null);

    if (!day || !slot) return;

    // Demo: no payment server, so say so rather than inventing a confirmation.
    if (!paymentsLive()) {
      setBooking(true);
      await new Promise((r) => setTimeout(r, 900));
      setBooking(false);
      setBooked({
        ref: "DEMO-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
        day, slot, tab, name: client.name, starts: atSlot(day, slot),
        session: tab === "free" ? "30-Min Free Insurance Review" : "60-Min Smart Borrowing Coaching",
        demo: true, calc: calcSnapshot,
      });
      return;
    }

    setHolding(true);
    try {
      const time = slotData ? slot : slot;            // server slots are "HH:MM"
      const { booking: b, payee: pe } = await holdSlot(tab, eatDate(day), time);
      if (pe) setPayee(pe);

      if (tab === "free") {
        const done = await confirmFreeBooking({
          bookingRef: b.ref, name: client.name, email: client.email,
          phone: client.phone, note: client.note,
        });
        setBooked({
          ref: done.booking.ref, day, slot, tab, name: client.name,
          starts: new Date(done.booking.startsAt), session: done.booking.session,
          demo: false, calc: calcSnapshot, icsUrl: done.booking.icsUrl,
          meetLink: done.booking.meetLink, meetState: done.booking.meetState,
          emailedTo: done.booking.emailedTo,
        });
        setHeld(null);
        return;
      }

      // Paid: the seat is ours for a few minutes. Now, and only now, money.
      setHeld(b);
      setPay(null);
    } catch (err) {
      setHoldErr(err.message);
    } finally {
      setHolding(false);
    }
  };

  /** Sends the prompt for a seat we are already holding. */
  const payForSeat = async () => {
    if (!held || pay?.loading) return;
    const phone = normalisePhone(client.phone);
    if (!phone) return setPay({ error: "That does not look like a Kenyan mobile number. Use 07XX XXX XXX." });

    setPay({ loading: true });
    try {
      const started = await startCheckout({
        bookingRef: held.ref, phone, name: client.name, email: client.email, note: client.note,
      });
      if (started.payee) setPayee(started.payee);
      setPay({ orderId: started.orderId, status: started.demo ? "demo" : "pending", message: started.message });
    } catch (err) {
      setPay({ error: err.message });
    }
  };

  /* Watch the payment; the seat becomes theirs the moment Safaricom says so. */
  useEffect(() => {
    if (pay?.status !== "pending" || !pay.orderId) return;
    const stop = watchOrder(pay.orderId, (o) => {
      setPay((p) => (p && p.orderId === o.orderId ? { ...p, status: o.status, message: o.message, receipt: o.receipt } : p));
      if (o.status === "paid" && o.booking) {
        setBooked({
          ref: o.booking.ref, day, slot, tab, name: client.name,
          starts: new Date(o.booking.startsAt), session: o.booking.session,
          demo: false, calc: calcSnapshot, icsUrl: o.booking.icsUrl,
          receipt: o.receipt, amount: o.amount,
          meetLink: o.booking.meetLink, meetState: o.booking.meetState,
          emailedTo: o.booking.emailedTo,
        });
        setHeld(null);
      }
    });
    return stop;
  }, [pay?.status, pay?.orderId]);

  const confirmBooking = async (e) => {
    e.preventDefault();
    setBookError(null);
    setBooking(true);

    const starts = atSlot(day, slot);
    const session = tab === "free" ? "30-Min Free Insurance Review" : "60-Min Smart Borrowing Coaching";
    const payload = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      session,
      minutes: tab === "free" ? 30 : 60,
      fee: tab === "free" ? 0 : PRICES.coaching,
      date: day.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      time: slot + " EAT",
      startsAt: starts.toISOString(),
      brief: client.note,
      calculator: calcSnapshot || undefined,
      source: "paulchege.co.ke — booking hub",
      submittedAt: new Date().toISOString(),
    };

    try {
      let ref;
      if (!isLive(BOOKING_SINK)) {
        await new Promise((r) => setTimeout(r, 1200));
        ref = "DEMO-" + Math.random().toString(36).slice(2, 7).toUpperCase();
        setBooked({ ref, day, slot, tab, name: client.name, starts, session, demo: true, calc: calcSnapshot });
      } else {
        ref = await postForm(BOOKING_SINK, payload, "PCC");
        setBooked({ ref, day, slot, tab, name: client.name, starts, session, demo: false, calc: calcSnapshot });
      }
    } catch (err) {
      setBookError(err.message || "We could not save that booking. Please call or WhatsApp us.");
    } finally {
      setBooking(false);
    }
  };

  /* The Meet link is created after the payment, so it can arrive a second or
     two behind the confirmation. Poll the booking — never the payment — until
     it lands or Google says it is not coming. */
  useEffect(() => {
    if (!booked?.ref || booked.demo || booked.meetLink || booked.meetState !== "pending") return;
    let stop = false;
    let tries = 0;
    (async function poll() {
      while (!stop && tries < 20) {
        await new Promise((r) => setTimeout(r, 2500));
        if (stop) return;
        tries += 1;
        try {
          const { booking: b } = await apiJson("/api/booking/" + booked.ref);
          if (stop) return;
          if (b.meetLink || b.meetState !== "pending") {
            setBooked((v) => (v && v.ref === b.ref
              ? { ...v, meetLink: b.meetLink, meetState: b.meetState, emailedTo: b.emailedTo }
              : v));
            return;
          }
        } catch { /* keep trying; the session is confirmed either way */ }
      }
      // Stopped waiting. Say so, rather than spinning forever.
      if (!stop) setBooked((v) => (v && v.meetState === "pending" ? { ...v, meetState: "unavailable" } : v));
    })();
    return () => { stop = true; };
  }, [booked?.ref, booked?.meetState, booked?.meetLink, booked?.demo]);

  /** Hands the confirmed session to the client's calendar app. */
  const downloadIcs = () => {
    if (!booked?.starts) return;
    const ics = buildIcs({
      title: booked.session + " — Paul Chege",
      start: booked.starts,
      minutes: booked.tab === "free" ? 30 : 60,
      description: "Booking reference " + booked.ref + ". A Google Meet link is sent by email." +
        (client.note ? " Brief: " + client.note : ""),
      location: "Google Meet / Nairobi office",
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "paul-chege-" + booked.ref + ".ics";
    a.click();
    URL.revokeObjectURL(url);
    setToast({ text: "Calendar invite downloaded" });
  };

  /** Emails the request through the contact endpoint, then hands over the file. */
  const claimChecklist = async (e) => {
    e.preventDefault();
    setLeadErr(null);
    setLeadState("sending");
    const payload = {
      name: lead.name,
      email: lead.email,
      topic: "Free download — The Offer Letter Checklist",
      message: "Requested the offer letter checklist from " + (PAGES[route]?.title || "the site") + ".",
      source: "paulchege.co.ke — lead magnet",
      submittedAt: new Date().toISOString(),
    };
    try {
      if (isLive(CONTACT_ENDPOINT)) await postForm(CONTACT_ENDPOINT, payload, "DL");
      else await new Promise((r) => setTimeout(r, 900));
      setLeadState("done");
    } catch (err) {
      setLeadErr(err.message || "Could not record that. The download is below anyway.");
      setLeadState("done");   // never hold the file hostage to a failed POST
    }
  };

  const sendContact = async (e) => {
    e.preventDefault();
    setSendError(null);
    setSending(true);

    const payload = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      topic: contact.topic,
      message: contact.message,
      consent: contact.consent,
      botcheck: contact.botcheck,
      source: "paulchege.co.ke — contact form",
      submittedAt: new Date().toISOString(),
    };

    try {
      if (!isLive(CONTACT_ENDPOINT)) {
        // demo mode: no endpoint configured yet
        await new Promise((r) => setTimeout(r, 1200));
        setSent({ ref: "DEMO-" + Math.random().toString(36).slice(2, 7).toUpperCase(), name: contact.name, topic: contact.topic, demo: true });
      } else {
        const ref = await postForm(CONTACT_ENDPOINT, payload, "MSG");
        setSent({ ref, name: contact.name, topic: contact.topic, demo: false });
      }
    } catch (err) {
      setSendError(err.message || "Something went wrong. Please email us instead.");
    } finally {
      setSending(false);
    }
  };

  const payHealthState = usePayments();

  /**
   * The lines shown in the order summary.
   *
   * Once payment is under way this uses the snapshot taken at submit, not
   * the live cart: the cart is emptied when the money lands, and reading it
   * afterwards left the receipt with no line items — and, worse, made
   * `cart.every(isEbook)` vacuously true, so a paid physical order announced
   * itself as an instant download.
   */
  const checkoutLines = useMemo(() => {
    if (mpesa?.lines) return mpesa.lines;
    if (mpesa?.cart) return cart.map((c) => ({ label: c.name, qty: c.qty, price: c.price }));
    const v = mpesa?.variant || edition;
    return [{
      label: "The Anatomy of Smart Borrowing (" + (v === "ebook" ? "eBook PDF" : "Physical copy") + ")",
      qty: 1, price: v === "ebook" ? PRICES.ebook : PRICES.physical,
    }];
  }, [mpesa?.lines, mpesa?.cart, mpesa?.variant, cart, edition]);

  const checkoutDigital = mpesa?.digital !== undefined
    ? mpesa.digital
    : mpesa?.cart
      ? cart.length > 0 && cart.every((c) => (c.sku || "") === "ebook")
      : (mpesa?.variant || edition) === "ebook";

  // Live, not the snapshot taken when checkout opened — otherwise changing a
  // quantity leaves the total showing what it used to be.
  const mpesaPrice = mpesa?.frozenTotal
    ?? (mpesa?.cart
      ? cartTotal || mpesa.amount
      : (mpesa?.variant || edition) === "ebook" ? PRICES.ebook : PRICES.physical);
  const onHero = !scrolled;



  /** Proof anyone can check, plus real client words once they exist. */
  const ProofSection = () => (
    <section className="bg-[var(--mist)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <Head
          center
          eyebrow="Proof you can check"
          title="Not claims — numbers you can go and verify"
          sub="Every figure below links to where it came from. Read on 28 September 2026; live counts move."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROOF_STATS.map((st, i) => {
            const Inner = (
              <>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--sunken)] text-[var(--gold-ink)] transition-colors group-hover:bg-[#0A1128] group-hover:text-[#D4AF37]">
                  <st.icon size={19} />
                </span>
                <span className="mt-4 block font-display text-[1.6rem] font-extrabold leading-none text-[var(--ink)] pc-num"><CountUp value={st.big} /></span>
                <span className="mt-2 block text-[13px] font-semibold text-[var(--ink-2)]">{st.small}</span>
                <span className="mt-2 block break-words text-[11px] text-[var(--ink-5)]">{st.src}</span>
              </>
            );
            const cls = "pc-spot group block rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]";
            return st.href
              ? <a key={st.small} href={st.href} target="_blank" rel="noreferrer" data-reveal style={{ "--rd": i * 80 + "ms" }} className={cls}>{Inner}</a>
              : <div key={st.small} data-reveal style={{ "--rd": i * 80 + "ms" }} className={cls}>{Inner}</div>;
          })}
        </div>

        {/* the most-watched episodes, as published */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {PROOF_EPISODES.map((v) => (
            <a
              key={v.id} href={ytWatch(v.id)} target="_blank" rel="noreferrer" data-reveal
              className="pc-spot group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]"
            >
              <Img src={ytThumb(v.id)} wrapClass="h-16 w-28 shrink-0 overflow-hidden rounded-xl" className="h-full w-full object-cover" />
              <span className="min-w-0">
                <span className="line-clamp-2 block text-[13px] font-bold leading-snug text-[var(--ink)]">{v.title}</span>
                <span className="mt-1 block text-[11.5px] text-[var(--ink-4)]">{v.views} views · {v.len}</span>
              </span>
              <ArrowUpRight size={14} className="ml-auto shrink-0 text-[var(--ink-5)] transition-colors group-hover:text-[#D4AF37]" />
            </a>
          ))}
        </div>

        {TESTIMONIALS.length > 0 ? (
          <div className="mt-14">
            <h3 className="text-center text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--gold-ink)]">
              In their words
            </h3>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} data-reveal className="pc-card rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-7">
                  <Quote size={26} className="text-[#D4AF37]/40" />
                  <blockquote className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-3)]">“{t.body}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--cream)] font-display text-[14px] font-extrabold text-[var(--gold-ink)]">
                      {t.name[0]}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-bold text-[var(--ink)]">{t.name}</span>
                      <span className="block text-[11.5px] text-[var(--ink-4)]">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[var(--paper)] p-7 text-center sm:flex-row sm:text-left">
            <Quote size={24} className="shrink-0 text-[var(--ink-5)]" />
            <p className="flex-1 text-[13.5px] leading-relaxed text-[var(--ink-3)]">
              <span className="font-bold text-[var(--ink)]">Worked with Paul?</span> Client quotes go here —
              real ones, with permission. If he has helped you, we would be glad to hear it.
            </p>
            <OutlineButton tone="dark" onClick={() => { setContact((c) => ({ ...c, topic: "Share my experience" })); nav("contact"); }} className="shrink-0">
              Share your experience
            </OutlineButton>
          </div>
        )}
      </div>
    </section>
  );

  /** The free checklist, in exchange for an email. Used on high-intent pages. */
  const LeadMagnetBand = () => (
    <section className="pc-grain relative overflow-hidden bg-[#0A1128] py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_20%_0%,#16336E_0%,#0A1128_62%)]" />
      <GoldArcs className="-right-44 -top-44 h-[620px] w-[620px] opacity-40" />

      <div className="relative mx-auto grid max-w-[1100px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-10">
        <div>
          <div className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
            <span className="h-px w-7 bg-current opacity-60" /> Free download
          </div>
          <h2 className="pc-h2 font-display font-bold text-white">{LEAD_MAGNET.title}</h2>
          <p className="mt-2 text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#8FA0C0]">{LEAD_MAGNET.sub}</p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#A9BAD8]">{LEAD_MAGNET.blurb}</p>

          <ul className="mt-6 space-y-2.5">
            {["The fees that never make it into the headline rate",
              "The four clauses that decide what happens when things go wrong",
              "Six questions to ask before accepting a top-up"].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-[#C7D3EA]">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#00A651]" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-[#20305C] bg-[#101B3C]/80 p-6 backdrop-blur sm:p-8">
          {leadState === "done" ? (
            <div className="pc-pop text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#00A651]/15 text-[#3DDC84]">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="mt-5 font-display text-[1.25rem] font-extrabold text-white">
                It is yours{lead.name ? ", " + lead.name.split(" ")[0] : ""}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#9FB0D0]">
                Three pages, no email confirmation needed — the file is right here.
              </p>
              <a
                href={LEAD_MAGNET.file} download
                className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.1em] text-[#0A1128]"
              >
                <FileText size={16} /> Download the PDF
              </a>
              {leadErr && (
                <p className="mt-3 text-[11.5px] leading-relaxed text-[#FFB4B4]">
                  We could not record your details ({leadErr}) — the download still works.
                </p>
              )}
              <button
                onClick={() => { setLeadState("idle"); setLead({ name: "", email: "" }); }}
                className="mt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#6E7FA3] hover:text-[#D4AF37]"
              >
                Send to another address
              </button>
            </div>
          ) : (
            <form onSubmit={claimChecklist}>
              <div className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37] text-[#0A1128]">
                  <FileText size={21} />
                </span>
                <div>
                  <h3 className="font-display text-[1.1rem] font-extrabold text-white">Get the checklist</h3>
                  <p className="text-[12.5px] text-[#8FA0C0]">Free. No newsletter unless you ask.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Field dark label="First name" required placeholder="Jane" value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                <Field dark label="Email" type="email" required placeholder="jane@example.com" value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })} />
              </div>

              <GoldButton type="submit" disabled={leadState === "sending"} className="mt-6 w-full !py-4">
                {leadState === "sending"
                  ? (<><Loader2 size={16} className="animate-spin" /> One moment…</>)
                  : (<><FileText size={15} /> Send me the checklist</>)}
              </GoldButton>

              <p className="mt-3.5 text-center text-[11px] leading-relaxed text-[#6E7FA3]">
                We use your email to send the file and nothing else. See the{" "}
                <button type="button" onClick={() => nav("privacy")} className="font-bold text-[#D4AF37] underline underline-offset-2">
                  privacy notice
                </button>.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );

  return (
    // `overflow-x: clip` rather than `hidden`: hidden on one axis computes to
    // `auto` on the other, which makes this a scroll container and silently
    // breaks every position:sticky descendant on the site. clip does the same
    // job without creating one.
    <div className="pc-clip-x min-h-screen bg-[var(--paper)] font-sans text-[var(--ink)] selection:bg-[#D4AF37] selection:text-[var(--ink)]">

      <a
        href="#main"
        onClick={(e) => { e.preventDefault(); const m = document.getElementById("main"); m?.setAttribute("tabindex", "-1"); m?.focus(); m?.scrollIntoView(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#0A1128] focus:px-5 focus:py-3 focus:text-[13px] focus:font-extrabold focus:text-white"
      >
        Skip to content
      </a>

      {/* Reading progress. Driven by scroll-timeline in CSS where it exists,
          so it costs no JavaScript and cannot jitter; elsewhere it is simply
          never shown, which is fine for an ornament. */}
      <div className="pc-progress" aria-hidden="true" />

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="fixed inset-x-0 top-0 z-50">
        {/* utility strip */}
        <div className={"hidden overflow-hidden bg-[#0A1128] transition-[height,opacity] duration-300 lg:block " + (scrolled ? "h-0 opacity-0" : "h-10 opacity-100")}>
          <div className="mx-auto flex h-10 max-w-[1400px] items-center gap-6 px-6 text-[11.5px] lg:px-10">
            <a href={"tel:" + OFFICE.phone.replace(/\s/g, "")} className="flex items-center gap-2 text-[#A9BAD8] transition-colors hover:text-[#F3E5AB]">
              <Phone size={12} className="text-[#D4AF37]" /> {OFFICE.phone}
            </a>
            <a href={"mailto:" + OFFICE.email} className="flex items-center gap-2 text-[#A9BAD8] transition-colors hover:text-[#F3E5AB]">
              <Mail size={12} className="text-[#D4AF37]" /> {OFFICE.email}
            </a>
            <span className="flex items-center gap-2 text-[#A9BAD8]">
              <MapPin size={12} className="text-[#D4AF37]" /> {OFFICE.line2}
            </span>
            <a href={"tel:" + USSD} className="ml-auto flex items-center gap-2 font-bold text-[#F3E5AB]">
              <Smartphone size={12} /> Dial {USSD}
            </a>
            <span className="h-3.5 w-px bg-[#20305C]" />
            <span className="flex items-center gap-2.5">
              {SOCIAL.map((sn) => (
                <a key={sn.label} href={sn.href} target="_blank" rel="me noreferrer" aria-label={sn.label}
                  className="text-[#8FA0C0] transition-colors hover:text-[#D4AF37]">
                  <sn.icon size={13} />
                </a>
              ))}
            </span>
          </div>
        </div>

        {/* main bar */}
        <div className={"border-b bg-[var(--paper)] transition-shadow duration-300 " + (scrolled ? "border-transparent shadow-[0_6px_28px_-14px_rgba(10,17,40,.35)]" : "border-[var(--line)]")}>
          <div className={"mx-auto flex max-w-[1400px] items-center gap-4 px-4 transition-[height] duration-300 sm:px-6 lg:px-10 " + (scrolled ? "h-[60px] lg:h-[64px]" : "h-[68px] lg:h-[76px]")}>
            {/* brand */}
            <button onClick={() => nav("")} className="group mr-4 flex min-w-0 shrink-0 items-center gap-3 text-left">
              <span className="relative shrink-0 transition-transform duration-500 group-hover:scale-[1.05]">
                <img src={LOGO} alt="Paul Chege Consultancy TV" className={"pc-dim w-auto object-contain transition-[height] duration-300 " + (scrolled ? "h-11 sm:h-12" : "h-12 sm:h-14")} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--paper)] bg-[#00A651]" />
              </span>
              <span className="min-w-0 leading-none">
                <span className="block whitespace-nowrap font-display text-[12.5px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[15px]">
                  Paul Chege <span className="text-[var(--gold-ink)]">Consultancy TV</span>
                </span>
                <span className="mt-1.5 hidden items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-ink)] sm:flex">
                  {PILLARS.map((p, i) => (
                    <React.Fragment key={p}>
                      {i > 0 && <span className="opacity-40">·</span>}
                      <span>{p}</span>
                    </React.Fragment>
                  ))}
                </span>
              </span>
            </button>

            {/* desktop nav */}
            <nav ref={navRef} className="ml-auto hidden items-center min-[1360px]:flex">
              {NAV.map((n) => {
                const on = route === n.route;
                return (
                  <div key={n.label} className="relative" onMouseEnter={() => n.items && setOpenMenu(n.label)} onMouseLeave={() => n.items && setOpenMenu(null)}>
                    <span className="group relative flex items-center">
                      <button
                        onClick={() => nav(n.route)}
                        className={
                          "whitespace-nowrap py-2.5 pl-3.5 text-[12px] font-extrabold uppercase tracking-[0.12em] transition-colors duration-300 " +
                          (n.items ? "pr-1.5 " : "pr-3.5 ") +
                          (on ? "text-[var(--gold-ink)]" : "text-[var(--ink-2)] hover:text-[var(--gold-ink)]")
                        }
                        aria-current={on ? "page" : undefined}
                      >
                        {n.label}
                      </button>
                      {n.items && (
                        <button
                          onClick={() => setOpenMenu(openMenu === n.label ? null : n.label)}
                          className={"py-2.5 pr-3.5 transition-colors " + (on ? "text-[var(--gold-ink)]" : "text-[#8A97B2] hover:text-[var(--gold-ink)]")}
                          aria-label={n.label + " menu"}
                          aria-expanded={openMenu === n.label}
                        >
                          <ChevronDown size={13} className={"transition-transform duration-300 " + (openMenu === n.label ? "rotate-180" : "")} />
                        </button>
                      )}
                      <span className={"pointer-events-none absolute inset-x-3 -bottom-0.5 h-[3px] origin-left rounded-full bg-[linear-gradient(90deg,#D4AF37,#F3E5AB)] transition-transform duration-300 " + (on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                    </span>

                    {n.items && openMenu === n.label && (
                      <div className="pc-pop absolute left-0 top-full w-[22rem] pt-3">
                        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-2 shadow-[0_28px_60px_-18px_rgba(10,17,40,.3)]">
                          {n.items.map((it) => (
                            <button
                              key={it.label}
                              onClick={() => nav(it.route, { hash: it.hash, filter: it.filter })}
                              className="group/i flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#F6F8FD]"
                            >
                              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A1128] text-[#D4AF37] transition-colors group-hover/i:bg-[#D4AF37] group-hover/i:text-[var(--ink)]">
                                <it.icon size={17} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[13.5px] font-bold text-[var(--ink)]">{it.label}</span>
                                <span className="block text-[12px] text-[var(--ink-3)]">{it.desc}</span>
                              </span>
                              <ArrowUpRight size={14} className="ml-auto mt-1 shrink-0 text-[var(--ink-5)] transition-all group-hover/i:translate-x-0.5 group-hover/i:text-[#D4AF37]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* actions */}
            <div className="ml-auto flex shrink-0 items-center gap-2.5 min-[1360px]:ml-6">
              <button
                onClick={() => { setPaletteQ(""); setPaletteIdx(0); setPaletteOpen(true); }}
                className="hidden h-11 items-center gap-2 rounded-full border border-[var(--line)] pl-4 pr-2.5 text-[12px] text-[var(--ink-4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)] lg:flex"
                aria-label="Search the site"
              >
                <Search size={15} /> Search
                <kbd className="rounded border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
              </button>

              <button
                onClick={toggleTheme}
                className="group grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)]"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark"
                  ? <Sun size={17} className="transition-transform duration-500 group-hover:rotate-90" />
                  : <Moon size={17} className="transition-transform duration-500 group-hover:-rotate-12" />}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]"
                aria-label={"Cart, " + cartCount + " items"}
              >
                <ShoppingCart size={17} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#D4AF37] px-1 text-[11px] font-extrabold text-[var(--ink)]">
                    {cartCount}
                  </span>
                )}
              </button>

              <GoldButton onClick={() => nav("booking")} className="hidden !px-6 !py-3 sm:inline-flex">
                Book a Session
              </GoldButton>

              <button
                onClick={() => setMobileNav((v) => !v)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-2)] transition-colors min-[1360px]:hidden"
                aria-label="Menu" aria-expanded={mobileNav}
              >
                {mobileNav ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* progress rail */}
        <div className="h-[3px] bg-transparent">
          <div className="h-full bg-[linear-gradient(90deg,#A8842A,#D4AF37,#F3E5AB)] transition-[width] duration-150" style={{ width: progress + "%" }} />
        </div>

        {/* mobile nav */}
        {mobileNav && (
          <div className="pc-pop max-h-[75vh] overflow-y-auto border-t border-[var(--line)] bg-[var(--paper)] px-4 pb-6 pt-3 shadow-xl min-[1360px]:hidden">
            <button
              onClick={() => { setMobileNav(false); setPaletteQ(""); setPaletteIdx(0); setPaletteOpen(true); }}
              className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3.5 text-left text-[14px] text-[var(--ink-4)]"
            >
              <Search size={17} /> Search pages, episodes, chapters…
            </button>

            {NAV.map((n) => {
              const on = route === n.route;
              return (
                <div key={n.label} className="border-b border-[var(--line)] last:border-0">
                  <div className="flex items-center">
                    <button
                      onClick={() => nav(n.route)}
                      className={"flex-1 py-4 text-left text-[13px] font-extrabold uppercase tracking-[0.15em] " + (on ? "text-[var(--gold-ink)]" : "text-[var(--ink)]")}
                    >
                      {n.label}
                    </button>
                    {n.items && (
                      <button
                        onClick={() => setOpenMenu(openMenu === n.label ? null : n.label)}
                        className="grid h-10 w-10 place-items-center rounded-full text-[var(--gold-ink)]"
                        aria-label={"Show " + n.label + " links"} aria-expanded={openMenu === n.label}
                      >
                        <ChevronDown size={16} className={"transition-transform " + (openMenu === n.label ? "rotate-180" : "")} />
                      </button>
                    )}
                  </div>
                  {n.items && openMenu === n.label && (
                    <div className="pb-3">
                      {n.items.map((it) => (
                        <button key={it.label} onClick={() => nav(it.route, { hash: it.hash, filter: it.filter })}
                          className="flex w-full items-center gap-3 py-3 text-left text-[13.5px] text-[var(--ink-2)]">
                          <it.icon size={16} className="text-[#D4AF37]" />
                          {it.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <GoldButton onClick={() => nav("booking")} className="mt-5 w-full">Book a Session</GoldButton>
            <div className="mt-5 flex items-center justify-center gap-4 border-t border-[var(--line)] pt-5">
              {SOCIAL.map((sn) => (
                <a key={sn.label} href={sn.href} target="_blank" rel="me noreferrer" aria-label={sn.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-3)]">
                  <sn.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main id="main" className="pt-[71px] lg:pt-[119px]">
        <div key={route} className="pc-page">

      {/* ══ PAGE BANNER ═════════════════════════════════════════════════════ */}
      {route !== "" && (
        <section className="pc-grain relative overflow-hidden bg-[#0A1128]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_75%_0%,#1B3F86_0%,#122A5E_35%,#0A1128_70%)]" />
          <GoldArcs className="-right-40 -top-72 h-[620px] w-[620px] opacity-50" />
          <div className="relative mx-auto max-w-[1400px] px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8FA0C0]">
              <button onClick={() => nav("")} className="pc-tap transition-colors hover:text-[#D4AF37]">Home</button>
              <ChevronRight size={12} className="text-[#3A4A72]" />
              <span className="text-[#D4AF37]">{PAGES[route]?.title}</span>
            </nav>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">{PAGES[route]?.kicker}</p>
            <h1 className="pc-h2 mt-3 font-display font-extrabold text-white">
              {PAGES[route]?.title}
            </h1>
            {PAGES[route]?.sub && (
              <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#A9BAD8]">{PAGES[route].sub}</p>
            )}
          </div>
        </section>
      )}

      {route === "" && (
        <>
      {/* ══ HERO — bento, composed to one screen ════════════════════════════ */}
      <section id="top" className="pc-grain pc-aurora pc-seam relative overflow-hidden bg-[#0A1128]">
        <span aria-hidden="true" className="pc-aurora-3" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_70%_15%,#1B3F86_0%,#122A5E_34%,#0A1128_70%)]" />
          <div className="pc-par-slow absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[#D4AF37]/[.09] blur-[130px]" />
          <GoldArcs className="pc-par -right-48 -top-56 h-[820px] w-[820px] opacity-60" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-8 pt-8 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:grid-rows-[1fr_auto] lg:gap-4">

            {/* ── headline: the one thing that dominates ── */}
            <div className="pc-par-fade relative col-span-2 md:col-span-7 md:row-start-1 md:self-center lg:pr-6">
              <div className="pc-rise inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[.06] py-1.5 pl-1.5 pr-4 backdrop-blur">
                <span className="flex items-center gap-1.5 rounded-full bg-[#00A651] px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white">
                  <span className="pc-beat h-1.5 w-1.5 rounded-full bg-white" />Live
                </span>
                <span className="text-[12.5px] text-white/85">
                  Bizsure USSD partner · dial <span className="font-bold text-[#F3E5AB]">{USSD}</span>
                </span>
              </div>

              {/* Three clipped lines, each swinging up from behind its own
                  mask. The headline assembles itself rather than fading in. */}
              <h1 className="pc-display mt-6 font-display font-extrabold text-white">
                <span className="pc-split"><span style={{ "--ld": "120ms" }}>Demystifying</span></span>
                <span className="pc-split">
                  <span style={{ "--ld": "240ms" }}
                    className="pc-sheen inline-block bg-[linear-gradient(100deg,#F3E5AB,#D4AF37_35%,#FFF8DC_50%,#D4AF37_65%,#F3E5AB)] bg-clip-text pr-[0.08em] text-transparent">
                    Insurance &amp;
                  </span>
                </span>
                <span className="pc-split"><span style={{ "--ld": "360ms" }}>Smart Leverage</span></span>
              </h1>

              <p className="pc-rise pc-d2 mt-6 max-w-lg text-[15.5px] leading-relaxed text-[#A9BAD8]">
                Stop falling into bad debt traps and hidden bank clauses. Practical guidance on
                borrowing, risk protection and wealth preservation.
              </p>

              <div className="pc-rise pc-d3 mt-7 flex flex-col gap-3 sm:flex-row">
                <GoldButton onClick={() => nav("booking")}>
                  Book Strategy Session
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </GoldButton>
                <OutlineButton onClick={() => openMpesa("physical")}>
                  <BookOpen size={15} className="text-[#D4AF37]" /> Get the Book
                </OutlineButton>
              </div>
            </div>

            {/* ── portrait: bottom-anchored so the tile is never half empty ── */}
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(165deg,#1A3A78,#0A1128)] col-span-2 max-md:h-[248px] md:col-span-5 md:row-span-2 md:min-h-[440px]">
              <div className="pointer-events-none absolute bottom-0 left-1/2 h-[78%] w-[86%] -translate-x-1/2 rounded-t-full bg-[radial-gradient(closest-side,rgba(212,175,55,.28),transparent_70%)]" />
              <img
                src={CUTOUT} alt="Paul Chege" width="712" height="1072" fetchPriority="high" decoding="async"
                className="pc-par-slow absolute inset-0 z-10 mx-auto h-full w-full object-contain object-bottom drop-shadow-[0_24px_46px_rgba(0,0,0,.6)]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-[linear-gradient(to_top,#0A1128_12%,transparent)]" />
              <div className="absolute inset-x-0 bottom-0 z-30 p-5">
                <div className="font-display text-[1.1rem] font-extrabold leading-tight text-white">Paul Chege</div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-[#9FB0D0]">
                  Founder &amp; Managing Principal · Key Partner at Bizsure
                </div>
              </div>
            </div>

            {/* ── two quiet support tiles ── */}
            <button
              onClick={() => nav("calculator")}
              className="pc-spot pc-spot-dark group flex flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/[.045] p-5 text-left backdrop-blur-sm transition-colors hover:border-[#D4AF37]/45 md:col-span-4 md:row-start-2 md:min-h-[148px]"
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[#8FA0C0]">
                  <Calculator size={12} className="text-[#D4AF37]" /> Top-up penalty
                </span>
                <ArrowUpRight size={14} className="text-[#4A5C8A] transition-all group-hover:-translate-y-0.5 group-hover:text-[#D4AF37]" />
              </span>
              <span className="mt-3 block font-display text-[1.6rem] font-extrabold leading-none text-[#FF7A7A] tabular-nums">
                <Ticker value={Math.abs(engine.surplus)} format={fmt} />
              </span>
              <span className="mt-2 block text-[11.5px] leading-snug text-[#9FB0D0]">
                more than consolidating, on the default figures — run yours
              </span>
            </button>

            <button
              onClick={() => setPlayer(VIDEOS[0])}
              className="group relative overflow-hidden rounded-[1.25rem] border border-white/10 text-left md:col-span-3 md:row-start-2 md:min-h-[148px]"
            >
              <Img src={ytThumb(VIDEOS[0].id)}
                wrapClass="absolute inset-0 h-full w-full"
                className="h-full w-full object-cover opacity-45 transition-all duration-700 group-hover:scale-105 group-hover:opacity-65" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,17,40,.96),rgba(10,17,40,.4))]" />
              <div className="relative flex h-full flex-col justify-between p-5">
                <span className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[#D4AF37]">
                  <Youtube size={12} /> Latest
                </span>
                <span className="flex items-end gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition-all duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#0A1128]">
                    <Play size={14} className="ml-0.5 fill-current" />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-[12px] font-bold leading-snug text-white">{VIDEOS[0].title}</span>
                    <span className="mt-0.5 block text-[10.5px] text-[#9FB0D0]">{VIDEOS[0].len}</span>
                  </span>
                </span>
              </div>
            </button>
          </div>

          {/* scroll cue */}
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight - 90, behavior: "smooth" })}
            className="pc-par-fade mx-auto mt-7 hidden items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#6E7FA3] transition-colors hover:text-[#D4AF37] md:flex"
          >
            Scroll
            <span className="grid h-6 w-6 place-items-center rounded-full border border-[#20305C]">
              <ChevronDown size={12} className="pc-beat" />
            </span>
          </button>
        </div>

        <svg className="relative z-10 block w-full" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 70 C 360 6, 1080 6, 1440 70 Z" fill="var(--paper)" />
        </svg>
      </section>

      {/* ══ STATS STRIP ═════════════════════════════════════════════════════ */}
      <section className="relative z-20 -mt-8 bg-[var(--paper)]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--line)] shadow-[0_24px_60px_-30px_rgba(10,17,40,.35)] lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={s.small} data-reveal style={{ "--rd": i * 90 + "ms" }}
                className="pc-spot group flex items-center gap-3.5 bg-[var(--paper)] px-6 py-7 transition-colors hover:bg-[var(--cream)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-[var(--gold-ink)] transition-all duration-300 group-hover:bg-[#0A1128] group-hover:text-[#D4AF37]">
                  <s.icon size={19} />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[1.45rem] font-extrabold leading-none text-[var(--ink)] tabular-nums"><CountUp value={s.big} /></div>
                  <div className="mt-1.5 text-[11.5px] font-medium leading-tight text-[var(--ink-3)]">{s.small}</div>
                  {s.note && <div className="mt-0.5 text-[10.5px] text-[var(--ink-5)]">{s.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOME · SERVICES TEASER ══════════════════════════════════════════ */}
      <section className="bg-[var(--paper)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Head
              eyebrow="What we do"
              title={<>Three desks.<br />One outcome — <span className="text-[var(--gold-ink)]">you keep your money.</span></>}
              sub="Brokerage, coaching and advocacy under one roof, so the advice you get is never the advice that pays a commission."
            />
            <OutlineButton tone="dark" onClick={() => nav("services")} className="shrink-0 self-start lg:self-auto">
              All services <ArrowRight size={15} />
            </OutlineButton>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {SERVICES.map((sv, i) => (
              <button
                key={sv.title}
                onClick={() => nav("services", { hash: sv.id })}
                data-reveal style={{ "--rd": i * 110 + "ms" }}
                className="pc-card pc-spot pc-edge group relative overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_34px_70px_-30px_rgba(10,17,40,.4)]"
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[linear-gradient(90deg,#A8842A,#D4AF37,#F3E5AB)] transition-transform duration-500 group-hover:scale-x-100" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-4 right-5 select-none font-display text-[4.5rem] font-extrabold leading-[0.78] tabular-nums text-[var(--ghost)] transition-colors duration-500 group-hover:text-[var(--ghost-hover)]">0{i + 1}</span>
                <span className="relative block">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0A1128] text-[#D4AF37] shadow-lg transition-all duration-300 group-hover:rotate-[-6deg] group-hover:bg-[linear-gradient(135deg,#D4AF37,#A8842A)] group-hover:text-[var(--ink)]">
                    <sv.icon size={24} />
                  </span>
                  <span className="mt-6 block font-display text-[1.35rem] font-extrabold tracking-tight text-[var(--ink)]">{sv.title}</span>
                  <span className="mt-3 block text-[14.5px] leading-relaxed text-[var(--ink-3)]">{sv.body}</span>
                  <span className="pc-tap mt-6 inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--gold-ink)]">
                    Learn more
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--cream)] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#D4AF37]">
                      <ArrowRight size={13} />
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOME · CALCULATOR TEASER ════════════════════════════════════════ */}
      <section className="pc-grain relative overflow-hidden bg-[#0A1128] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_75%_at_50%_0%,#16336E_0%,#0A1128_62%)]" />
        <GoldArcs className="-left-52 top-1/2 h-[700px] w-[700px] -translate-y-1/2 opacity-35" />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <Head
              dark
              eyebrow="The differentiator"
              title={<>Is that top-up<br />quietly costing you?</>}
              sub="Your relationship manager models this in thirty seconds and never shows you the output. Move four sliders and see the difference between a top-up, a consolidation, and leaving the old loan alone."
            />
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <GoldButton onClick={() => nav("calculator")}>
                Open the Smart Calculator <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </GoldButton>
              <OutlineButton onClick={() => nav("booking")}>Talk it through</OutlineButton>
            </div>
          </div>

          <button onClick={() => nav("calculator")} className="group rounded-[1.5rem] border border-[#20305C] bg-[#101B3C]/80 p-7 text-left backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white">
                <Calculator size={15} className="text-[#D4AF37]" /> Worked example
              </span>
              <span className="rounded-full border border-[#20305C] bg-[#0A1128] px-3 py-1 text-[11px] font-bold text-[#8FA0C0]">48 months</span>
            </div>
            <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-[#20305C] sm:grid-cols-2">
              <div className="bg-[#101B3C] px-5 py-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8FA0C0]">Top-up total cost</div>
                <div className="mt-2 font-display text-[1.4rem] font-extrabold text-[#FF7A7A]">{fmt(engine.topCost)}</div>
              </div>
              <div className="bg-[#101B3C] px-5 py-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8FA0C0]">Consolidation</div>
                <div className="mt-2 font-display text-[1.4rem] font-extrabold text-[#3DDC84]">{fmt(engine.conCost)}</div>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#0A1128] p-4">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#D4AF37]" />
              <p className="text-[13px] leading-relaxed text-[#A9BAD8]">
                On these figures the top-up costs <span className="font-bold text-[#F3E5AB]">{fmt(Math.abs(engine.surplus))}</span> more.
                Run it on your own numbers.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ══ HOME · BOOK TEASER ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--cream)] py-20 sm:py-24">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[#D4AF37]/[.12] blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:px-10">
          <button onClick={() => nav("book")} data-tilt aria-label="Read about The Anatomy of Smart Borrowing" className="pc-tilt group relative mx-auto block w-full max-w-xs">
            <span className="absolute -inset-3 rounded-[1.75rem] bg-[linear-gradient(135deg,#D4AF37,transparent_60%)] opacity-40 blur-xl" />
            <img src={BOOK_ART} alt="The Anatomy of Smart Borrowing" className="pc-tilt-face relative w-full rounded-[1.5rem] shadow-[0_34px_70px_-26px_rgba(10,17,40,.5)]" />
          </button>
          <div>
            <Head
              eyebrow="The book"
              title={<>The Anatomy of <span className="text-[var(--gold-ink)]">Smart Borrowing</span></>}
              sub="Bank risk models, the honest test for good debt, and the top-up trap that quietly costs Kenyan households billions a year. Six chapters, written for the borrower."
            />
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-[var(--ink-3)]">
              <span className="font-bold text-[var(--ink)]">{fmt(PRICES.physical)}</span>
              <span className="text-[var(--gold-ink)]">physical · {fmt(PRICES.ebook)} eBook</span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MpesaButton onClick={() => openMpesa("physical")}>
                <Smartphone size={17} /> Buy via M-Pesa
              </MpesaButton>
              <OutlineButton tone="dark" onClick={() => addBook("physical")}>
                <ShoppingCart size={15} /> Add to cart
              </OutlineButton>
              <OutlineButton tone="dark" onClick={() => nav("book")}>
                <BookOpen size={15} /> Read the chapters
              </OutlineButton>
            </div>
          </div>
        </div>
      </section>

      {ProofSection()}
        </>
      )}

      {route === "about" && (
        <>
      {/* ══ ABOUT (mist) ════════════════════════════════════════════════════ */}
      <section id="about" className="relative overflow-hidden bg-[var(--mist)] py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-[#D4AF37]/[.08] blur-[120px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">

            {/* portrait */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="relative">
                <span className="absolute -bottom-5 -left-5 hidden h-full w-full rounded-[1.75rem] border-2 border-[#D4AF37] sm:block" />
                <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0A1128] shadow-[0_30px_70px_-30px_rgba(10,17,40,.55)]">
                  <img src={PHOTO} alt="Paul Chege" className="aspect-[4/5] w-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(to_top,rgba(10,17,40,.96),transparent)]" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="font-display text-[1.3rem] font-extrabold text-white">Paul Chege</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
                      {PILLARS.map((p, i) => (
                        <React.Fragment key={p}>
                          {i > 0 && <span className="opacity-40">·</span>}
                          <span>{p}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pc-float absolute -right-3 top-8 z-10 hidden max-w-[13rem] rounded-2xl bg-[var(--paper)] p-4 shadow-[0_20px_45px_-20px_rgba(10,17,40,.4)] sm:block">
                <div className="flex items-start gap-2.5">
                  <Award size={18} className="mt-0.5 shrink-0 text-[var(--gold-ink)]" />
                  <div>
                    <div className="font-display text-[13px] font-extrabold leading-tight text-[var(--ink)]">
                      Foreword by the Deputy President
                    </div>
                    <div className="mt-1 text-[10.5px] leading-snug text-[var(--ink-4)]">
                      H.E. Rigathi Gachagua · The Anatomy of Smart Borrowing
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* bio */}
            <div>
              <h2 className="font-display text-[2rem] font-extrabold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-[2.7rem]">
                The broker who reads<br className="hidden sm:block" /> <span className="text-[var(--gold-ink)]">the small print out loud.</span>
              </h2>

              <div className="pc-dropcap mt-7 space-y-5 text-[15.5px] leading-relaxed text-[var(--ink-2)]">
                <p>
                  Paul Chege is a financial advisor, banking professional and financial literacy
                  advocate with extensive experience in Kenya's banking industry. He holds a
                  Bachelor's degree in Business Administration and is pursuing a Master of Arts
                  in Finance at <span className="font-semibold text-[var(--ink)]">KCA University</span>.
                </p>
                <p>
                  Drawing on his experience in one of Kenya's leading commercial banks, Paul has
                  helped individuals and businesses make informed financial decisions. Through his
                  financial education platforms — <span className="font-semibold text-[var(--ink)]">358.7K
                  followers on TikTok</span>, 183K on Facebook and 151 videos on YouTube — he is a
                  regular contributor on major media platforms discussing banking, borrowing and
                  personal finance.
                </p>
                <p>
                  Alongside the media work he places cover as a licensed broker in partnership with
                  <span className="font-semibold text-[var(--ink)]"> Bizsure</span>, coaches borrowers
                  through offer letters and restructures, and pursues declined claims to settlement.
                  In September 2026 he launched <span className="font-semibold text-[var(--ink)]">The
                  Anatomy of Smart Borrowing</span> at Safari Park Hotel, Nairobi — foreword by
                  H.E. Rigathi Gachagua, Deputy President of Kenya.
                </p>
              </div>

              {/* the four hats */}
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {HATS.map((h) => (
                  <div key={h.label} className="group flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--cream)] text-[var(--gold-ink)] transition-colors group-hover:bg-[#0A1128] group-hover:text-[#D4AF37]">
                      <h.icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-extrabold text-[var(--ink)]">{h.label}</span>
                      <span className="block text-[11.5px] text-[var(--ink-4)]">{h.note}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* pull quote */}
              <figure className="pc-pull mt-12 rounded-[1.25rem] border-l-4 border-[#D4AF37] bg-[var(--paper)] py-7 pl-11 pr-6 shadow-[0_18px_44px_-30px_rgba(10,17,40,.5)]">
                <blockquote className="font-display text-[1.15rem] font-bold leading-snug text-[var(--ink)] sm:text-[1.35rem]">
                  “Loans are neither good nor bad. They are tools. The difference is rarely the loan
                  itself — the difference is the decisions made before signing the agreement.”
                </blockquote>
                <figcaption className="mt-3 text-[11.5px] font-bold uppercase tracking-[0.16em] text-[var(--gold-ink)]">
                  The Anatomy of Smart Borrowing
                </figcaption>
              </figure>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <GoldButton onClick={() => openBooking(null, "free")}>
                  Book a Free Review <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </GoldButton>
                <OutlineButton tone="dark" onClick={() => go("#tvhub")}>
                  <PlayCircle size={16} /> Watch the guides
                </OutlineButton>
              </div>

              {/* where to follow him */}
              <div className="mt-10 border-t border-[var(--line)] pt-8">
                <h3 className="pc-rule text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[var(--gold-ink)]">
                  Follow the work
                </h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {SOCIAL.map((sn) => (
                    <a
                      key={sn.label} href={sn.href} target="_blank" rel="me noreferrer"
                      className="pc-spot group flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--sunken)] text-[var(--ink-3)] transition-colors group-hover:bg-[#0A1128] group-hover:text-[#D4AF37]">
                        <sn.icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[15px] font-extrabold leading-none text-[var(--ink)]">{sn.count}</span>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-5)]">{sn.label}</span>
                      </span>
                      <ArrowUpRight size={14} className="ml-auto shrink-0 text-[var(--ink-5)] transition-all group-hover:-translate-y-0.5 group-hover:text-[#D4AF37]" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* the four pillars */}
          <div className="mt-20">
            <div className="mb-8 flex items-center gap-4">
              <h3 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--gold-ink)]">
                Learn · Plan · Build · Prosper
              </h3>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PILLAR_DETAIL.map((p, i) => (
                <div key={p.title} data-reveal style={{ "--rd": i * 90 + "ms" }} className="pc-spot group relative overflow-hidden rounded-[1.25rem] bg-[var(--paper)] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_60px_-32px_rgba(10,17,40,.5)]">
                  <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 select-none font-display text-[2.6rem] font-extrabold leading-none tabular-nums text-[var(--ghost)] transition-colors duration-300 group-hover:text-[var(--ghost-hover)]">
                    0{i + 1}
                  </span>
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[#0A1128] text-[#D4AF37] transition-transform duration-300 group-hover:rotate-[-6deg]">
                    <p.icon size={21} />
                  </span>
                  <h4 className="relative mt-5 font-display text-[1.1rem] font-extrabold text-[var(--ink)]">{p.title}</h4>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-[var(--ink-3)]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

        </>
      )}

      {route === "services" && (
        <>
      {/* ══ SERVICES (light) ════════════════════════════════════════════════ */}
      <section id="services" className="relative bg-[var(--paper)] py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <OutlineButton tone="dark" onClick={() => openBooking(null, "free")} className="shrink-0 self-start lg:self-auto">
              Talk to Paul <ArrowRight size={15} />
            </OutlineButton>
          </div>

          {/* One column, deliberately. Three columns put the services side by
              side as equals; a stack lets each one land on its own and gives
              the scroll something to do — the cards deal over each other. */}
          <div className="pc-stack mx-auto mt-14 max-w-3xl">
            {SERVICES.map((s, i) => (
              <div
                key={s.title}
                id={s.id}
                data-reveal style={{ "--rd": i * 110 + "ms", "--i": i }}
                className="pc-card pc-spot pc-edge group relative scroll-mt-32 overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_34px_70px_-30px_rgba(10,17,40,.4)]"
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[linear-gradient(90deg,#A8842A,#D4AF37,#F3E5AB)] transition-transform duration-500 group-hover:scale-x-100" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-4 right-5 select-none font-display text-[4.5rem] font-extrabold leading-[0.78] tabular-nums text-[var(--ghost)] transition-colors duration-500 group-hover:text-[var(--ghost-hover)]">
                  0{i + 1}
                </span>

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0A1128] text-[#D4AF37] shadow-lg transition-all duration-300 group-hover:rotate-[-6deg] group-hover:bg-[linear-gradient(135deg,#D4AF37,#A8842A)] group-hover:text-[var(--ink)]">
                      <s.icon size={24} />
                    </span>
                    <span className="rounded-full bg-[var(--cream)] px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--gold-ink)]">
                      {s.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-[1.4rem] font-extrabold tracking-tight text-[var(--ink)]">{s.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-3)]">{s.body}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-[var(--line)] pt-6">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-[var(--ink-2)]">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#00A651]" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  {s.id === "brokerage" && (
                    <a
                      href="https://www.bizsure.co.ke" target="_blank" rel="noreferrer"
                      className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3 transition-colors hover:border-[#D4AF37]"
                    >
                      <span className="text-[9.5px] font-extrabold uppercase leading-tight tracking-[0.14em] text-[var(--ink-5)]">
                        Placed<br />through
                      </span>
                      <img src="/img/brands/bizsure.webp" alt="Bizsure Insurance Brokers" className="pc-logoplate h-8 w-auto object-contain" />
                      <ArrowUpRight size={14} className="ml-auto text-[var(--ink-5)]" />
                    </a>
                  )}

                  <button
                    onClick={() => openBooking("Enquiry: " + s.title, "free")}
                    className="pc-tap mt-7 inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--gold-ink)] transition-colors hover:text-[var(--ink)]"
                  >
                    Learn more
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--cream)] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#D4AF37]">
                      <ArrowRight size={13} />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES · HOW IT WORKS ═════════════════════════════════════════ */}
      <section className="bg-[var(--mist)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <Head center eyebrow="How it works" title="Four steps, no surprises" />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Tell us the situation", b: "A quote, an offer letter, a declined claim. Send it through the contact form or on WhatsApp.", icon: MessageCircle },
              { t: "We read the paperwork", b: "Line by line — the clauses, the pricing, the exclusions that decide your outcome.", icon: FileText },
              { t: "You get the numbers", b: "Options modelled side by side, in writing, with the cheapest route made obvious.", icon: Calculator },
              { t: "We place or push it", b: "Cover placed with the right underwriter, or the claim pursued to settlement.", icon: ShieldCheck },
            ].map((st, i) => (
              <div key={st.t} className="relative rounded-[1.25rem] bg-[var(--paper)] p-7">
                <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 select-none font-display text-[2.6rem] font-extrabold leading-none tabular-nums text-[var(--ghost)]">0{i + 1}</span>
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[#0A1128] text-[#D4AF37]"><st.icon size={20} /></span>
                <h3 className="relative mt-5 font-display text-[1.05rem] font-extrabold text-[var(--ink)]">{st.t}</h3>
                <p className="relative mt-2 text-[13.5px] leading-relaxed text-[var(--ink-3)]">{st.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

        </>
      )}

      {route === "calculator" && (
        <>
      {/* ══ CALCULATOR (navy showcase band) ═════════════════════════════════ */}
      <section id="calculator" className="pc-grain relative overflow-hidden bg-[#0A1128] py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_0%,#16336E_0%,#0A1128_62%)]" />
          <GoldArcs className="-left-60 top-1/2 h-[820px] w-[820px] -translate-y-1/2 opacity-40" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* inputs */}
            <div data-reveal="left" className="pc-spot pc-spot-dark rounded-[1.5rem] border border-[#20305C] bg-[#101B3C]/80 p-6 backdrop-blur sm:p-8">
              <div className="mb-8 grid grid-cols-2 gap-1.5 rounded-full border border-[#20305C] bg-[#0A1128] p-1.5">
                {[
                  { k: "topup", label: "Top-Up Loan", icon: Plus },
                  { k: "consolidate", label: "Consolidation", icon: Landmark },
                ].map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    className={
                      "flex items-center justify-center gap-2 rounded-full px-3 py-3 text-[11.5px] font-extrabold uppercase tracking-[0.1em] transition-all duration-300 " +
                      (mode === m.k
                        ? "bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] text-[var(--ink)] shadow-[0_10px_24px_-10px_rgba(212,175,55,.9)]"
                        : "text-[#8FA0C0] hover:text-[#F3E5AB]")
                    }
                  >
                    <m.icon size={14} /> {m.label}
                  </button>
                ))}
              </div>

              <div className="space-y-7">
                <Slider label="Requested Amount" value={amount} min={50000} max={5000000} step={10000}
                  onChange={setAmount} display={fmt(amount)} hint="New money you actually want in hand." />
                <Slider label="Interest Rate (p.a.)" value={rate} min={9} max={30} step={0.25}
                  onChange={setRate} display={rate.toFixed(2) + "%"}
                  hint={mode === "topup" ? "Top-ups price ~" + TOPUP_PREMIUM + "pp above this — priced in below." : "The market rate you have been quoted."} />
                <Slider label="Tenure" value={tenure} min={6} max={84} step={1}
                  onChange={setTenure} display={tenure + " months"} hint={(tenure / 12).toFixed(1) + " years to full settlement."} />

                <div className="rounded-2xl border border-[#20305C] bg-[#0A1128] p-5">
                  <div className="mb-5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8FA0C0]">
                    <CreditCard size={13} className="text-[#D4AF37]" /> Your existing facility
                  </div>
                  <div className="space-y-6">
                    <Slider label="Outstanding Balance" value={existing} min={0} max={8000000} step={10000}
                      onChange={setExisting} display={fmt(existing)} />
                    <div className="grid grid-cols-2 gap-5">
                      <Slider label="Current Rate" value={existingRate} min={8} max={26} step={0.25}
                        onChange={setExistingRate} display={existingRate.toFixed(2) + "%"} />
                      <Slider label="Months Left" value={monthsLeft} min={1} max={72} step={1}
                        onChange={setMonthsLeft} display={monthsLeft + " mo"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* outputs */}
            <div className="space-y-6">
              <div data-reveal="right" className="pc-spot pc-spot-dark overflow-hidden rounded-[1.5rem] border border-[#20305C] bg-[#101B3C]/80 backdrop-blur">
                <div className="flex items-center justify-between gap-3 border-b border-[#20305C] px-6 py-4">
                  <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white">
                    <Calculator size={15} className="text-[#D4AF37]" />
                    {mode === "topup" ? "Top-Up structure" : "Consolidation"}
                  </span>
                  <span className="rounded-full border border-[#20305C] bg-[#0A1128] px-3 py-1 text-[11px] font-bold text-[#8FA0C0]">
                    Effective <Ticker value={engine.active.rate} format={(v) => v.toFixed(2)} />% p.a.
                  </span>
                </div>

                <div className="grid gap-px bg-[#20305C] sm:grid-cols-3">
                  {[
                    { label: "Monthly Payment", n: engine.active.monthly, fmtFn: fmt, tone: "gold" },
                    { label: "Total Finance Cost", n: engine.active.cost, fmtFn: fmt, tone: "plain" },
                    { label: "Hidden Interest Surplus", n: Math.max(0, engine.delta),
                      fmtFn: (v) => (v > 0.5 ? "+" : "") + fmt(v), tone: engine.delta > 0 ? "warn" : "good" },
                  ].map((o) => (
                    <div key={o.label} className="bg-[#101B3C] px-5 py-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8FA0C0]">{o.label}</div>
                      <div className={
                        "mt-2.5 font-display text-[1.4rem] font-extrabold leading-tight tabular-nums " +
                        (o.tone === "gold" ? "text-[#F3E5AB]" : o.tone === "warn" ? "text-[#FF7A7A]" : o.tone === "good" ? "text-[#3DDC84]" : "text-white")
                      }>
                        <Ticker value={o.n} format={o.fmtFn} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-5 px-6 py-7">
                  {[
                    { k: "topup", label: "Top-Up (repriced, clock reset)", cost: engine.topCost, monthly: engine.topMonthly },
                    { k: "consolidate", label: "Consolidation (bought out, repriced)", cost: engine.conCost, monthly: engine.conMonthly },
                    { k: "keep", label: "Keep existing + borrow separately", cost: engine.keepCost, monthly: engine.keepMonthly },
                  ].map((row) => {
                    const worst = Math.max(engine.topCost, engine.conCost, engine.keepCost, 1);
                    const win = row.cost === engine.best;
                    const Row = row.k === "keep" ? "div" : "button";
                    return (
                      <Row key={row.k} onClick={row.k === "keep" ? undefined : () => setMode(row.k)} className="block w-full text-left">
                        <div className="mb-2 flex items-baseline justify-between gap-3 text-[12.5px]">
                          <span className={mode === row.k ? "font-bold text-white" : "text-[#8FA0C0]"}>{row.label}</span>
                          <span className={"font-bold tabular-nums " + (win ? "text-[#3DDC84]" : "text-[#FF7A7A]")}>
                            <Ticker value={row.cost} format={fmt} />
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#0A1128]">
                          <div
                            className={"h-full rounded-full transition-[width] duration-[700ms] ease-[cubic-bezier(.22,1.2,.36,1)] " + (win ? "bg-[linear-gradient(90deg,#00A651,#3DDC84)]" : "bg-[linear-gradient(90deg,#D4AF37,#FF7A7A)]")}
                            style={{ width: Math.max(6, (row.cost / worst) * 100) + "%" }}
                          />
                        </div>
                        <div className="mt-1.5 text-[11px] tabular-nums text-[#6E7FA3]">
                          <Ticker value={row.monthly} format={fmt} /> / month{row.k === "keep" ? " while both run" : ""}
                        </div>
                      </Row>
                    );
                  })}
                  <CostChart series={engine.curves} />
                </div>
              </div>

              {/* what the numbers actually mean */}
              <div className="rounded-[1.5rem] border border-[#20305C] bg-[#101B3C]/70 p-6 backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8FA0C0]">
                  <FileText size={13} className="text-[#D4AF37]" /> In plain words
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[#C7D3EA]">{plainRead}</p>
              </div>

              {engine.inefficient ? (
                <div className="pc-pop rounded-[1.5rem] border border-[#5B2230] bg-[linear-gradient(135deg,#2A1018,#101B3C)] p-6">
                  <div className="flex gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FF7A7A]/15 text-[#FF7A7A]">
                      <AlertTriangle size={21} />
                    </span>
                    <div>
                      <h4 className="font-display text-[15.5px] font-extrabold text-[#FFB4B4]">
                        Top-Up Alert: this structure adds {fmt(engine.surplus)} extra in interest.
                      </h4>
                      <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#A9BAD8]">
                        You are paying interest a second time on {fmt(existing)} you had already partly amortised,
                        at {(rate + TOPUP_PREMIUM).toFixed(2)}% instead of {rate.toFixed(2)}%, over a clock that just
                        reset to {tenure} months. Consider restructuring.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pc-pop rounded-[1.5rem] border border-[#12503A] bg-[linear-gradient(135deg,#06301E,#101B3C)] p-6">
                  <div className="flex gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#00A651]/15 text-[#3DDC84]">
                      <CheckCircle2 size={21} />
                    </span>
                    <div>
                      <h4 className="font-display text-[15.5px] font-extrabold text-[#8BF0BA]">
                        {engine.saving > 0
                          ? "Saves " + fmt(engine.saving) + " against a top-up on the same money."
                          : "This is the cheaper of the two at these inputs."}
                      </h4>
                      <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#A9BAD8]">
                        The old facility is settled (2% penalty priced in) and the whole book is repriced at {rate.toFixed(2)}%.
                        One instalment, one maturity date, no second round of interest.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <GoldButton
                onClick={() => {
                  setCalcSnapshot({
                    requested: amount, existing, tenure, rate,
                    mode: mode === "topup" ? "Top-up" : "Consolidation",
                    monthly: Math.round(engine.active.monthly),
                    financeCost: Math.round(engine.active.cost),
                    cheaperBy: Math.round(Math.max(0, engine.active.cost - engine.best)),
                  });
                  openBooking(
                    "Loan restructure — " + fmt(amount) + " of new money on top of " + fmt(existing) +
                    ", over " + tenure + " months at " + rate.toFixed(2) + "%. Modelled as a " +
                    (mode === "topup" ? "top-up" : "consolidation") + ": " + fmt(engine.active.monthly) +
                    " a month, " + fmt(engine.active.cost) + " total finance cost.", "paid");
                }}
                className="w-full !py-4"
              >
                Fix Your Loan Structure with Paul Chege
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </GoldButton>

              <p className="text-center text-[11px] leading-relaxed text-[#6E7FA3]">
                Indicative modelling — arrangement fee {(ARRANGEMENT_FEE * 100).toFixed(1)}%, top-up premium {TOPUP_PREMIUM}pp,
                early settlement penalty {(SETTLEMENT_PENALTY * 100).toFixed(0)}%. Your offer letter governs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {LeadMagnetBand()}
        </>
      )}

      {route === "book" && (
        <>
      {/* ══ BOOK (cream band) ═══════════════════════════════════════════════ */}
      <section id="book" className="relative overflow-hidden bg-[var(--cream)] py-14 sm:py-20">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#D4AF37]/[.12] blur-[120px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
            {/* cover + pricing */}
            <div>
              <div className="lg:sticky lg:top-28">
                <div data-tilt className="pc-tilt group relative mx-auto max-w-sm">
                  <div className="absolute -inset-3 rounded-[1.75rem] bg-[linear-gradient(135deg,#D4AF37,transparent_60%)] opacity-40 blur-xl" />
                  <div className="pc-tilt-face relative overflow-hidden rounded-[1.5rem] shadow-[0_34px_70px_-26px_rgba(10,17,40,.5)]">
                    <img src={BOOK_ART} alt="The Anatomy of Smart Borrowing" className="w-full" />
                  </div>
                </div>

                <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
                  {[
                    { k: "physical", label: "Physical copy", price: PRICES.physical, note: "Countrywide delivery" },
                    { k: "ebook", label: "eBook (PDF)", price: PRICES.ebook, note: "Instant download" },
                  ].map((e) => (
                    <button
                      key={e.k}
                      onClick={() => setEdition(e.k)}
                      className={
                        "rounded-2xl border-2 p-4 text-left transition-all duration-300 " +
                        (edition === e.k
                          ? "border-[#D4AF37] bg-[var(--paper)] shadow-[0_14px_34px_-18px_rgba(212,175,55,.9)]"
                          : "border-transparent bg-[var(--paper)]/70 hover:border-[#E4D5A8]")
                      }
                    >
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--gold-ink)]">{e.label}</div>
                      <div className="mt-1.5 font-display text-[1.4rem] font-extrabold text-[var(--ink)]">{fmt(e.price)}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--ink-4)]">{e.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* content */}
            <div>
              <h2 className="font-display text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-[var(--ink)] sm:text-[3rem]">
                The Anatomy of<br />
                <span className="bg-[linear-gradient(100deg,#A8842A,#D4AF37_50%,#A8842A)] bg-clip-text text-transparent">Smart Borrowing</span>
              </h2>
              <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--gold-ink)]">
                Understanding loans before you engage
              </p>
              <p className="mt-3 text-[13.5px] text-[var(--ink-3)]">
                Foreword by <span className="font-semibold text-[var(--ink)]">H.E. Rigathi Gachagua</span>, Deputy President of Kenya
              </p>

              <div className="mt-7 max-w-xl space-y-4 text-[15.5px] leading-relaxed text-[var(--ink-2)]">
                <p>
                  Loans are neither good nor bad. They are tools. In the hands of a wise borrower they
                  build businesses, educate families and create wealth. In the hands of an unprepared
                  borrower they become a burden for years.
                </p>
                <p>
                  Paul demystifies loan products, interest calculations, bank charges, check-off loans
                  and the principles of responsible borrowing — for a first loan, a business facility,
                  a property purchase, or simply better financial literacy.
                </p>
                <p className="font-semibold text-[var(--ink)]">
                  Before you sign a loan agreement, read this book.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-[var(--ink-3)]">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[var(--gold-ink)]" /> Launched at Safari Park Hotel, Nairobi</span>
                <span className="hidden h-4 w-px bg-[var(--line)] sm:block" />
                <span className="font-mono text-[12px]">ISBN {BOOK_ISBN}</span>
              </div>

              {/* chapters */}
              <div className="mt-10 overflow-hidden rounded-[1.25rem] bg-[var(--paper)] shadow-[0_20px_50px_-32px_rgba(10,17,40,.45)]">
                {CHAPTERS.map((c, i) => {
                  const open = chapter === i;
                  return (
                    <div key={c.n} className="border-b border-[var(--line)] last:border-0">
                      <button
                        onClick={() => setChapter(open ? -1 : i)}
                        className={"flex w-full items-center gap-4 px-6 py-5 text-left transition-colors " + (open ? "bg-[var(--cream)]" : "hover:bg-[var(--mist)]")}
                        aria-expanded={open}
                      >
                        <span className={"font-display text-[13px] font-extrabold tabular-nums " + (open ? "text-[var(--gold-ink)]" : "text-[var(--ink-5)]")}>{c.n}</span>
                        <span className={"flex-1 text-[14.5px] font-bold " + (open ? "text-[var(--gold-ink)]" : "text-[var(--ink)]")}>{c.title}</span>
                        <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 " + (open ? "rotate-45 bg-[#D4AF37] text-[var(--ink)]" : "bg-[var(--sunken)] text-[var(--ink-3)]")}>
                          <Plus size={15} />
                        </span>
                      </button>
                      {open && <p className="pc-pop px-6 pb-6 pl-[4.1rem] text-[13.5px] leading-relaxed text-[var(--ink-3)]">{c.body}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <MpesaButton onClick={() => openMpesa(edition)} className="flex-1">
                  <Smartphone size={17} />
                  Buy via M-Pesa · {fmt(edition === "ebook" ? PRICES.ebook : PRICES.physical)}
                </MpesaButton>
                <OutlineButton
                  tone="dark"
                  onClick={() => addBook(edition)}
                >
                  <ShoppingCart size={15} /> Add to cart
                </OutlineButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BOOK · THE LAUNCH ═══════════════════════════════════════════════ */}
      <section className="bg-[var(--paper)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <Head
            center
            eyebrow="The launch"
            title="Put in the right hands"
            sub="Launched on 25 September 2026 at Safari Park Hotel, Nairobi — with a foreword by the Deputy President and a chief guest who has spent his career on the economy."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1fr_1fr]">
            <figure data-reveal className="pc-card group overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_60px_-40px_rgba(10,17,40,.45)]">
              <div className="relative overflow-hidden">
                <img
                  src={NYORO_PHOTO}
                  alt="Paul Chege presenting The Anatomy of Smart Borrowing to Hon. Ndindi Nyoro"
                  className="pc-wipe w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute left-4 top-4 rounded-full bg-[#0A1128]/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#D4AF37] backdrop-blur">
                  Chief guest
                </span>
              </div>
              <figcaption className="p-6">
                <p className="text-[14.5px] font-bold leading-snug text-[var(--ink)]">
                  Presenting the book to Hon. Ndindi Nyoro, MP for Kiharu
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-3)]">
                  Chief guest at the launch, and Paul's counterpart in the podcast-style conversation
                  on the economy, borrowing and debt sustainability that opened the evening.
                </p>
              </figcaption>
            </figure>

            <div className="flex flex-col gap-6">
              <figure data-reveal className="pc-card overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_60px_-40px_rgba(10,17,40,.45)]">
                <img src={BOOK_LAUNCH} alt="Book launch poster — 25 September 2026, Safari Park Hotel" className="pc-wipe w-full" />
              </figure>

              <div className="rounded-[1.5rem] bg-[#0A1128] p-7">
                <div className="space-y-4">
                  {[
                    { icon: Calendar, k: "Launched", v: "25 September 2026" },
                    { icon: MapPin, k: "Venue", v: "Safari Park Hotel, Nairobi" },
                    { icon: Award, k: "Foreword", v: "H.E. Rigathi Gachagua, Deputy President of Kenya" },
                    { icon: FileText, k: "ISBN", v: BOOK_ISBN },
                  ].map((d) => (
                    <div key={d.k} className="flex items-start gap-3.5">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#101B3C] text-[#D4AF37]">
                        <d.icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8FA0C0]">{d.k}</span>
                        <span className="mt-0.5 block text-[13.5px] font-semibold leading-snug text-white">{d.v}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <MpesaButton onClick={() => openMpesa(edition)} className="mt-7 w-full">
                  <Smartphone size={17} /> Get your copy · {fmt(edition === "ebook" ? PRICES.ebook : PRICES.physical)}
                </MpesaButton>
                <button
                  onClick={() => addBook(edition)}
                  className="pc-tap-row mt-3 w-full rounded-full border border-white/20 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-white/80 transition-colors hover:border-[#D4AF37] hover:text-[#F3E5AB]"
                >
                  Add to cart instead
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

        </>
      )}

      {route === "booking" && (
        <>
      {/* ══ BOOKING HUB (white) ═════════════════════════════════════════════ */}
      <section id="booking" className="bg-[var(--paper)] py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">

          <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-[1.75rem] border border-[var(--line)] shadow-[0_30px_70px_-40px_rgba(10,17,40,.45)]">
            {/* tabs */}
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
              {[
                { k: "free", title: "30-Min Free Insurance Review", sub: "Bizsure lead review · no charge", price: "Free", icon: ShieldCheck },
                { k: "paid", title: "60-Min Smart Borrowing Coaching", sub: "Offer letters, restructures, exit plans", price: fmt(PRICES.coaching), icon: TrendingDown },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => { setTab(t.k); setSlot(null); setBooked(null); }}
                  className={"relative px-6 py-6 text-left transition-colors " + (tab === t.k ? "bg-[#0A1128]" : "bg-[var(--paper)] hover:bg-[var(--mist)]")}
                >
                  {tab === t.k && <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#A8842A,#D4AF37,#F3E5AB)]" />}
                  <div className="flex items-start gap-3.5">
                    <t.icon size={20} className={"mt-0.5 shrink-0 " + (tab === t.k ? "text-[#D4AF37]" : "text-[var(--ink-5)]")} />
                    <div className="min-w-0">
                      <div className={"text-[14px] font-extrabold " + (tab === t.k ? "text-white" : "text-[var(--ink)]")}>{t.title}</div>
                      <div className={"mt-1 text-[12px] " + (tab === t.k ? "text-[#8FA0C0]" : "text-[var(--ink-4)]")}>{t.sub}</div>
                    </div>
                    <span className={
                      "ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold " +
                      (t.k === "free" ? "bg-[#00A651]/12 text-[#00A651]" : tab === t.k ? "bg-[#D4AF37]/15 text-[#F3E5AB]" : "bg-[var(--cream)] text-[var(--gold-ink)]")
                    }>
                      {t.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {booked ? (
              <div className="pc-pop bg-[var(--paper)] p-10 text-center sm:p-14">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#00A651]/10 text-[#00A651]">
                  <CheckCircle2 size={34} />
                </div>
                <h3 className="mt-6 font-display text-[1.75rem] font-extrabold text-[var(--ink)]">Booking confirmed</h3>
                <p className="mt-2 text-[14.5px] text-[var(--ink-3)]">
                  {booked.name ? booked.name + ", your" : "Your"}{" "}
                  {booked.tab === "free" ? "30-minute insurance review" : "60-minute coaching session"} is locked in.
                </p>
                <div className="mx-auto mt-8 max-w-sm space-y-2.5 rounded-2xl bg-[var(--mist)] p-6 text-left text-[13px]">
                  {[
                    ["Reference", booked.ref],
                    booked.day
                      ? ["Date", booked.day.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })]
                      : ["Scheduled via", "Calendly"],
                    booked.slot
                      ? ["Time", prettyTime(booked.slot) + " EAT"]
                      : ["Time", "As shown in your Calendly confirmation"],
                    // Only ever promise what has actually happened. A Meet
                    // link is stated once it exists; until then the phone
                    // call is the certainty, because Paul has the number.
                    ["How", booked.meetLink
                      ? "Google Meet"
                      : booked.meetState === "pending"
                      ? "Setting up your Google Meet…"
                      : "Paul calls you on " + (client.phone || "the number above")],
                    ...(booked.receipt ? [["M-Pesa receipt", booked.receipt]] : []),
                    ...(booked.amount ? [["Paid", fmt(booked.amount)]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-[var(--ink-4)]">{k}</span>
                      <span className="text-right font-bold text-[var(--ink)]">{v}</span>
                    </div>
                  ))}
                </div>
                {booked.calc && (
                  <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5 text-left">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-5)]">
                      <Calculator size={12} className="text-[var(--gold-ink)]" /> Your figures are attached
                    </div>
                    <div className="mt-3 space-y-1.5 text-[12.5px]">
                      {[
                        ["Structure", booked.calc.mode],
                        ["New money", fmt(booked.calc.requested)],
                        ["Existing balance", fmt(booked.calc.existing)],
                        ["Monthly", fmt(booked.calc.monthly)],
                        ["Total finance cost", fmt(booked.calc.financeCost)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4">
                          <span className="text-[var(--ink-4)]">{k}</span>
                          <span className="font-bold tabular-nums text-[var(--ink)]">{v}</span>
                        </div>
                      ))}
                    </div>
                    {booked.calc.cheaperBy > 0 && (
                      <p className="mt-3 border-t border-[var(--line)] pt-3 text-[12px] text-[var(--gold-ink)]">
                        Paul will open this with {fmt(booked.calc.cheaperBy)} of headroom already identified.
                      </p>
                    )}
                  </div>
                )}

                {!booked.demo && booked.meetLink && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-[#1A73E8]/25 bg-[#1A73E8]/[0.06] p-6">
                    <div className="flex items-center justify-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#1A73E8]">
                      <Video size={13} /> Your meeting room
                    </div>
                    <a
                      href={booked.meetLink} target="_blank" rel="noreferrer"
                      className="pc-tap mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1A73E8] px-6 py-3.5 text-[13px] font-extrabold text-white shadow-lg shadow-[#1A73E8]/25 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <Video size={16} /> Join the Google Meet
                    </a>
                    <p className="mt-3 break-all text-center font-mono text-[11px] text-[var(--ink-4)]">
                      {booked.meetLink.replace(/^https?:\/\//, "")}
                    </p>
                    <p className="mt-3 text-center text-[11.5px] leading-relaxed text-[var(--ink-3)]">
                      {booked.emailedTo
                        ? <>Google has emailed the invite to <strong className="text-[var(--ink)]">{booked.emailedTo}</strong>. It is in Paul's diary too.</>
                        : <>The same link is on the calendar invite below, and in Paul's diary.</>}
                    </p>
                  </div>
                )}

                {!booked.demo && !booked.meetLink && booked.meetState === "pending" && (
                  <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-[var(--mist)] p-5 text-[12.5px] text-[var(--ink-3)]">
                    <Loader2 size={14} className="animate-spin" /> Setting up your Google Meet room…
                  </div>
                )}

                {!booked.demo && !booked.meetLink && booked.meetState === "unavailable" && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5 text-left">
                    <div className="flex items-start gap-2.5">
                      <Phone size={15} className="mt-0.5 shrink-0 text-[var(--gold-ink)]" />
                      <p className="text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                        <strong className="text-[var(--ink)]">Paul will call you on {client.phone || "the number you gave"}</strong> at
                        the time above. Your session is confirmed either way — if you would rather have a video link,
                        reply to your receipt or WhatsApp us and we will send one.
                      </p>
                    </div>
                  </div>
                )}

                {booked.receipt && (
                  <div className="mx-auto mt-5 max-w-sm rounded-2xl border-2 border-[#00A651]/25 bg-[#00A651]/[0.06] p-5 text-left">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#00A651]">
                      <ShieldCheck size={12} /> Keep this
                    </div>
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                      Your M-Pesa SMS and the reference <strong className="text-[var(--ink)]">{booked.ref}</strong> are
                      all you ever need. If Paul does not join within 10 minutes of{" "}
                      {booked.starts?.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })}, send that
                      reference to{" "}
                      <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-extrabold underline underline-offset-2">WhatsApp</a>{" "}
                      and you get every shilling back the same day. Rescheduling is free up to 24 hours before.
                    </p>
                    <p className="mt-3 border-t border-[#00A651]/20 pt-3 text-[11.5px] text-[var(--ink-4)]">
                      Questions before then?{" "}
                      <a href={"tel:" + OFFICE.phone.replace(/\s/g, "")} className="font-bold text-[var(--ink)] underline underline-offset-2">{OFFICE.phone}</a>{" "}
                      · {OFFICE.line1}, {OFFICE.line2}
                    </p>
                  </div>
                )}

                {booked.demo && (
                  <p className="mx-auto mt-5 max-w-sm rounded-xl bg-[var(--cream)] px-4 py-2.5 text-[11.5px] leading-relaxed text-[#8A6D1F]">
                    Demo mode — this booking was not saved anywhere. Configure <code className="font-mono">BOOKING_SINK</code> to go live.
                  </p>
                )}
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  {booked.icsUrl ? (
                    <GoldButton as="a" href={booked.icsUrl}>
                      <Calendar size={15} /> Add to calendar
                    </GoldButton>
                  ) : booked.starts ? (
                    <GoldButton onClick={downloadIcs}>
                      <Calendar size={15} /> Add to calendar
                    </GoldButton>
                  ) : null}
                  <OutlineButton tone="dark" onClick={() => { setBooked(null); setSlot(null); setDay(null); setBookError(null); setHeld(null); setPay(null); setHoldErr(null); }}>
                    Book another session
                  </OutlineButton>
                </div>
              </div>
            ) : (
              calendlyOn() && calendlyUrlFor(tab) ? (
                <div className="bg-[var(--paper)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-3.5">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                      <Calendar size={13} className="text-[var(--gold-ink)]" /> Live availability from Paul's diary
                    </span>
                    <a
                      href={calendlyUrlFor(tab)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--gold-ink)] hover:text-[var(--ink)]"
                    >
                      Open in a new tab <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <CalendlyEmbed
                    key={tab}
                    url={calendlyUrlFor(tab)}
                    prefill={{ name: client.name, email: client.email }}
                  />
                </div>
              ) : (
              <div className="grid gap-px bg-[var(--line)] lg:grid-cols-[1.15fr_1fr]">
                <div className="bg-[var(--paper)] p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    <Calendar size={14} className="text-[var(--gold-ink)]" /> Step 1 — choose a date
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                    {days.map((d) => {
                      const on = day && d.toDateString() === day.toDateString();
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => { setDay(d); setSlot(null); }}
                          className={
                            "rounded-2xl border-2 px-2 py-3 text-center transition-all duration-200 " +
                            (on
                              ? "border-[#0A1128] bg-[#0A1128] text-white shadow-lg"
                              : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:-translate-y-0.5 hover:border-[#D4AF37]")
                          }
                        >
                          <div className={"text-[9.5px] font-bold uppercase tracking-wider " + (on ? "text-[#D4AF37]" : "text-[var(--ink-5)]")}>
                            {d.toLocaleDateString("en-KE", { weekday: "short" })}
                          </div>
                          <div className="font-display text-[1.15rem] font-extrabold leading-tight">{d.getDate()}</div>
                          <div className={"text-[9.5px] " + (on ? "text-[#8FA0C0]" : "text-[var(--ink-5)]")}>
                            {d.toLocaleDateString("en-KE", { month: "short" })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mb-5 mt-9 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    <Clock size={14} className="text-[var(--gold-ink)]" /> Step 2 — choose a time (EAT)
                  </div>
                  {day ? (
                    <>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {(dayAvailability
                        ? dayAvailability.slots.map((x) => ({ value: x.time, label: prettyTime(x.time), free: x.available }))
                        : slots.map((x) => ({ value: x, label: x, free: true }))
                      ).map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={!s.free}
                          onClick={() => { setSlot(s.value); setHeld(null); setPay(null); setHoldErr(null); }}
                          title={s.free ? undefined : "Already taken"}
                          className={
                            "rounded-full border-2 px-3 py-3 text-[13px] font-bold transition-all duration-200 " +
                            (!s.free
                              ? "cursor-not-allowed border-[var(--line)] text-[var(--ink-5)] line-through opacity-55"
                              : slot === s.value
                              ? "border-[#00A651] bg-[#00A651] text-white shadow-[0_10px_24px_-12px_rgba(0,166,81,.9)]"
                              : "border-[var(--line)] text-[var(--ink-2)] hover:border-[#00A651] hover:text-[#00A651]")
                          }
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {dayAvailability && !dayAvailability.open && (
                      <p className="mt-3 text-center text-[12px] text-[var(--ink-4)]">
                        That day is full. Try another — the diary below is live.
                      </p>
                    )}
                    {dayAvailability && (
                      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-5)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                        Live from Paul's diary — struck-out times are already taken.
                      </p>
                    )}
                    </>
                  ) : (
                    <p className="rounded-2xl border-2 border-dashed border-[var(--line)] px-4 py-7 text-center text-[13px] text-[var(--ink-5)]">
                      Pick a date to see open slots.
                    </p>
                  )}
                </div>

                <form onSubmit={startBooking} className="bg-[var(--mist)] p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    <Users size={14} className="text-[var(--gold-ink)]" /> Step 3 — your details
                  </div>
                  <div className="space-y-4">
                    <Field label="Full name" required placeholder="Jane Wanjiku" value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })} />
                    <Field label="Email" type="email" required placeholder="jane@example.com" value={client.email}
                      onChange={(e) => setClient({ ...client, email: e.target.value })} />
                    <Field label="Phone (M-Pesa)" required placeholder="07XX XXX XXX" value={client.phone}
                      onChange={(e) => setClient({ ...client, phone: e.target.value })} />
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)]">What should Paul prepare?</span>
                      <textarea
                        rows={3} value={client.note}
                        onChange={(e) => setClient({ ...client, note: e.target.value })}
                        placeholder="e.g. I have a top-up offer from my bank I want reviewed."
                        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder-[#9AA6BF] outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
                      />
                    </label>
                  </div>

                  <div className="mt-6 space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4 text-[12.5px]">
                    <div className="flex justify-between text-[var(--ink-4)]">
                      <span>Session</span><span className="font-medium text-[var(--ink)]">{tab === "free" ? "30 min · review" : "60 min · coaching"}</span>
                    </div>
                    <div className="flex justify-between text-[var(--ink-4)]">
                      <span>Slot</span>
                      <span className="font-medium text-[var(--ink)]">
                        {day && slot ? day.toLocaleDateString("en-KE", { day: "numeric", month: "short" }) + " · " + slot : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--line)] pt-2 font-extrabold text-[var(--gold-ink)]">
                      <span>Due</span><span>{tab === "free" ? "Free" : fmt(PRICES.coaching)}</span>
                    </div>
                  </div>

                  {bookError && (
                    <div className="pc-pop mt-5 flex items-start gap-3 rounded-2xl border border-[#F6C9C9] bg-[#FEF2F2] p-4" role="alert">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#DC2626]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#991B1B]">Booking not saved</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-[#B45252]">{bookError}</p>
                        <p className="mt-1.5 text-[12px] text-[#B45252]">
                          Your slot is still free — try again, or{" "}
                          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-extrabold underline underline-offset-2">WhatsApp us</a>{" "}
                          and we will hold it for you.
                        </p>
                      </div>
                    </div>
                  )}

                  {holdErr && (
                    <div role="alert" className="pc-pop mt-5 flex items-start gap-3 rounded-2xl border border-[#F6C9C9] bg-[#FEF2F2] p-4">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#DC2626]" />
                      <p className="text-[12.5px] leading-relaxed text-[#991B1B]">{holdErr}</p>
                    </div>
                  )}

                  {/* ── the seat is not yet held ── */}
                  {!held && (
                    <>
                      <GoldButton type="submit" disabled={!day || !slot || holding || booking} className="mt-5 w-full">
                        {holding || booking
                          ? (<><Loader2 size={15} className="animate-spin" /> {tab === "free" ? "Confirming…" : "Holding your slot…"}</>)
                          : tab === "free"
                          ? (<>Confirm — no charge <ArrowRight size={14} /></>)
                          : (<>Hold this slot for me <ArrowRight size={14} /></>)}
                      </GoldButton>
                      {(!day || !slot)
                        ? <p className="mt-2.5 text-center text-[11px] text-[var(--ink-5)]">Choose a date and time to continue.</p>
                        : tab === "paid" && (
                          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-[var(--ink-5)]">
                            We take the slot off the diary first and show you who you are paying.
                            <strong className="text-[var(--ink-4)]"> No money is asked for at this step.</strong>
                          </p>
                        )}
                      {day && slot && !paymentsLive() && (
                        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#B08D2E]">
                          <AlertTriangle size={12} /> Demo mode — bookings are not saved yet.
                        </p>
                      )}
                    </>
                  )}

                  {/* ── held: who you are paying, then the prompt ── */}
                  {held && (
                    <div className="pc-pop mt-5">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#00A651] bg-[#00A651]/[0.07] px-5 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#00A651]">
                            <CheckCircle2 size={13} /> Your slot is held
                          </div>
                          <p className="mt-1 text-[12.5px] text-[var(--ink-3)]">
                            {day.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })} · {prettyTime(held.time)} EAT
                            <span className="block text-[11.5px] text-[var(--ink-5)]">Reference {held.ref}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-display text-[1.35rem] font-extrabold tabular-nums leading-none text-[var(--ink)]">{mmss(holdLeft)}</div>
                          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-5)]">held for you</div>
                        </div>
                      </div>

                      {pay?.status !== "paid" && (
                        <div className="mt-4">
                          <PayeeAssurance payee={payee} amount={held.amount} compact />
                        </div>
                      )}

                      {pay?.error && (
                        <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#F6C9C9] bg-[#FEF2F2] px-4 py-3.5 text-[12.5px] text-[#991B1B]">
                          <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{pay.error}</span>
                        </div>
                      )}

                      {/* waiting on the handset */}
                      {pay?.status === "pending" ? (
                        <div className="mt-4 rounded-2xl border-2 border-[#00A651]/30 bg-[var(--paper)] p-6 text-center">
                          <div className="relative mx-auto grid h-14 w-14 place-items-center">
                            <span className="absolute inset-0 animate-ping rounded-full bg-[#00A651]/20" />
                            <Smartphone size={24} className="relative text-[#00A651]" />
                          </div>
                          <p className="mt-4 text-[14px] font-extrabold text-[var(--ink)]">Check your phone</p>
                          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                            Enter your M-Pesa PIN to pay {fmt(held.amount)}. Your slot stays held while you do.
                          </p>
                          <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-bold text-[#00A651]">
                            <Loader2 size={14} className="animate-spin" /> Waiting for Safaricom…
                          </div>
                        </div>
                      ) : pay?.status && pay.status !== "paid" && pay.status !== "demo" ? (
                        <div className="mt-4 rounded-2xl bg-[var(--paper)] p-5 text-center">
                          <p className="text-[13px] font-extrabold text-[var(--ink)]">
                            {pay.status === "cancelled" ? "You cancelled the prompt" : "That payment did not go through"}
                          </p>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                            {pay.message} Nothing was deducted, and your slot is still held.
                          </p>
                          <MpesaButton type="button" onClick={() => { setPay(null); payForSeat(); }} className="mt-4 w-full">
                            Try the prompt again
                          </MpesaButton>
                        </div>
                      ) : pay?.status === "demo" ? (
                        <p className="mt-4 rounded-2xl bg-[var(--paper)] p-4 text-center text-[12px] text-[#B08D2E]">
                          Demo mode — no prompt was sent and nothing was charged.
                        </p>
                      ) : (
                        <MpesaButton type="button" onClick={payForSeat} disabled={pay?.loading} className="mt-4 w-full">
                          {pay?.loading
                            ? (<><Loader2 size={16} className="animate-spin" /> Sending the prompt…</>)
                            : (<><Smartphone size={17} /> Send the M-Pesa prompt · {fmt(held.amount)}</>)}
                        </MpesaButton>
                      )}

                      {pay?.status !== "pending" && pay?.status !== "paid" && (
                        <button type="button"
                          onClick={() => { setHeld(null); setPay(null); }}
                          className="mt-3 w-full text-center text-[11.5px] font-bold text-[var(--ink-4)] underline underline-offset-4 hover:text-[var(--ink)]">
                          Release this slot and pick another time
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </div>
              )
            )}
          </div>
        </div>
      </section>

        </>
      )}

      {route === "tv-hub" && (
        <>
      {/* ══ TV HUB (mist) ═══════════════════════════════════════════════════ */}
      <section id="tvhub" className="bg-[var(--mist)] py-14 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[15px] leading-relaxed text-[var(--ink-3)]">
                The <span className="font-semibold text-[var(--ink)]">Financial Literacy</span> podcast and
                the guides — banking, borrowing, investing and cover, in English and in Kikuyu.
                Episodes play right here.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a href={YT_PODCASTS} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0A1128] px-5 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#14203F] md:py-2.5">
                  <Youtube size={14} className="text-[#D4AF37]" /> The podcast <ArrowUpRight size={13} />
                </a>
                <a href={SOCIAL[0].href} target="_blank" rel="me noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink-2)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)] md:py-2.5">
                  <Music2 size={14} /> TikTok · {SOCIAL[0].count} <ArrowUpRight size={13} />
                </a>
                <a href={YT_CHANNEL} target="_blank" rel="me noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink-2)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)] md:py-2.5">
                  Full channel · 151 videos <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-5)]" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guides, e.g. “top-up”"
                className="w-full rounded-full border border-[var(--line)] bg-[var(--paper)] py-3.5 pl-11 pr-11 text-sm text-[var(--ink)] placeholder-[#9AA6BF] shadow-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-5)] hover:text-[var(--ink)]" aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-9 flex flex-wrap gap-2.5">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              const count = f.key === "all" ? VIDEOS.length : VIDEOS.filter((v) => v.cat === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] transition-all duration-300 md:py-2.5 " +
                    (on
                      ? "border-transparent bg-[#0A1128] text-white shadow-[0_12px_26px_-14px_rgba(10,17,40,.9)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)]")
                  }
                >
                  {f.emoji ? <span className="text-[13px]">{f.emoji}</span> : <f.icon size={14} className={on ? "text-[#D4AF37]" : ""} />}
                  {f.label}
                  <span className={"rounded-full px-1.5 text-[10.5px] " + (on ? "bg-[var(--paper)]/15 text-[#D4AF37]" : "bg-[var(--sunken)] text-[var(--ink-5)]")}>{count}</span>
                </button>
              );
            })}
          </div>

          {videos.length === 0 ? (
            <div className="mt-12 rounded-[1.5rem] border-2 border-dashed border-[var(--line)] bg-[var(--paper)] py-20 text-center">
              <Search size={26} className="mx-auto text-[var(--ink-5)]" />
              <p className="mt-4 text-[14.5px] text-[var(--ink-3)]">Nothing matches “{query}”.</p>
              <button onClick={() => { setQuery(""); setFilter("all"); }} className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--gold-ink)] hover:text-[var(--ink)]">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <article key={v.id} data-reveal data-tilt style={{ "--rd": (i % 3) * 110 + "ms" }} className="pc-ep pc-tilt pc-spot group overflow-hidden rounded-[1.25rem] bg-[var(--paper)] shadow-[0_14px_40px_-28px_rgba(10,17,40,.5)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_34px_70px_-30px_rgba(10,17,40,.45)]">
                  <div className="pc-tilt-face relative aspect-video overflow-hidden bg-[#0A1128]">
                    <Img
                      src={ytThumb(v.id)}
                      wrapClass="absolute inset-0 h-full w-full"
                      className="pc-ep-art h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,17,40,.75),rgba(10,17,40,0)_55%)]" />
                    <button
                      onClick={() => setPlayer(v)}
                      className="absolute inset-0 grid place-items-center"
                      aria-label={"Play " + v.title}
                    >
                      <span className="pc-ep-play grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-[var(--paper)]/10 text-white backdrop-blur-md transition-colors duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[var(--ink)]">
                        <Play size={22} className="ml-1 fill-current" />
                      </span>
                    </button>
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur">{v.len}</span>
                    <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink)]">
                      {FILTERS.find((f) => f.key === v.cat)?.label}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 lang={v.cat === "kikuyu" ? "ki" : undefined}
                      className="text-[14.5px] font-extrabold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--gold-ink)]">{v.title}</h3>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--ink-5)]">
                      <span className="flex items-center gap-1.5"><Youtube size={13} /> {v.views} views</span>
                      <span>{v.age}</span>
                      <a href={ytWatch(v.id)} target="_blank" rel="noreferrer"
                        className="pc-tap ml-auto flex items-center gap-1 font-bold text-[var(--gold-ink)] hover:text-[var(--ink)]">
                        YouTube <ArrowUpRight size={12} />
                      </a>
                    </div>
                    <button
                      onClick={() => setPlayer(v)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] py-3.5 md:py-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink-2)] transition-all hover:border-[#D4AF37] hover:text-[var(--gold-ink)]"
                    >
                      <Play size={13} className="fill-current" /> Play episode
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

        </>
      )}

      {route === "faq" && (
        <>
      {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--paper)] py-14 sm:py-20">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10">

          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-5)]" />
            <input
              value={faqQ}
              onChange={(e) => { setFaqQ(e.target.value); setFaqOpen(-1); }}
              placeholder="Search the questions…"
              aria-label="Search the questions"
              className="w-full rounded-full border border-[var(--line)] bg-[var(--paper)] py-4 pl-11 pr-11 text-[15px] text-[var(--ink)] placeholder-[var(--ink-5)] shadow-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
            />
            {faqQ && (
              <button onClick={() => setFaqQ("")} aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-5)] hover:text-[var(--ink)]">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {[{ key: "all", label: "Everything", emoji: "✳️" }, ...FAQ_GROUPS].map((g) => {
              const on = faqGroup === g.key;
              const n = g.key === "all" ? FAQS.length : FAQS.filter((f) => f.g === g.key).length;
              return (
                <button
                  key={g.key}
                  onClick={() => { setFaqGroup(g.key); setFaqOpen(0); }}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] transition-all duration-300 md:py-2.5 " +
                    (on ? "border-transparent bg-[#0A1128] text-white shadow-[0_12px_26px_-14px_rgba(10,17,40,.9)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[var(--gold-ink)]")
                  }
                >
                  <span className="text-[13px]">{g.emoji}</span>{g.label}
                  <span className={"rounded-full px-1.5 text-[10.5px] " + (on ? "bg-white/15 text-[#D4AF37]" : "bg-[var(--sunken)] text-[var(--ink-5)]")}>{n}</span>
                </button>
              );
            })}
          </div>

          {faqs.length === 0 ? (
            <div className="mt-10 rounded-[1.5rem] border-2 border-dashed border-[var(--line)] py-16 text-center">
              <Search size={26} className="mx-auto text-[var(--ink-5)]" />
              <p className="mt-4 text-[14.5px] text-[var(--ink-3)]">Nothing matches “{faqQ}”.</p>
              <button onClick={() => { setFaqQ(""); setFaqGroup("all"); }}
                className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--gold-ink)] hover:text-[var(--ink)]">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-10 overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
              {faqs.map((f, i) => {
                const open = faqOpen === i;
                return (
                  <div key={f.q} className="border-b border-[var(--line)] last:border-0">
                    <h3>
                      <button
                        onClick={() => setFaqOpen(open ? -1 : i)}
                        aria-expanded={open}
                        className={"flex w-full items-start gap-4 px-5 py-5 text-left transition-colors sm:px-6 " + (open ? "bg-[var(--cream)]" : "bg-[var(--paper)] hover:bg-[var(--mist)]")}
                      >
                        <span className="mt-0.5 shrink-0 text-[15px]">{FAQ_GROUPS.find((g) => g.key === f.g)?.emoji}</span>
                        <span className={"flex-1 text-[15px] font-bold leading-snug " + (open ? "text-[var(--gold-ink)]" : "text-[var(--ink)]")}>{f.q}</span>
                        <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 " + (open ? "rotate-45 bg-[#D4AF37] text-[#0A1128]" : "bg-[var(--sunken)] text-[var(--ink-3)]")}>
                          <Plus size={15} />
                        </span>
                      </button>
                    </h3>
                    {open && (
                      <div className="pc-pop bg-[var(--cream)] px-5 pb-6 pl-[3.4rem] pr-6 sm:px-6 sm:pl-[3.8rem]">
                        <p className="text-[14.5px] leading-relaxed text-[var(--ink-3)]">{f.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 rounded-[1.25rem] bg-[#0A1128] p-7 text-center sm:flex-row sm:text-left">
            <MessageCircle size={22} className="shrink-0 text-[#D4AF37]" />
            <p className="flex-1 text-[14.5px] leading-relaxed text-[#9FB0D0]">
              Question not here? Ask it directly — a person answers, usually the same working day.
            </p>
            <GoldButton onClick={() => nav("contact")} className="shrink-0">Ask the desk</GoldButton>
          </div>
        </div>
      </section>

      {LeadMagnetBand()}
        </>
      )}

      {route === "privacy" && <LegalDoc sections={PRIVACY} updated={LEGAL_UPDATED} />}
      {route === "terms" && <LegalDoc sections={TERMS} updated={LEGAL_UPDATED} />}

      {route === "404" && (
        <>
      <section className="bg-[var(--paper)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <Head center eyebrow="Try one of these" title="Where would you like to go?" />
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { to: "", label: "Home", hint: "Start here", icon: ArrowRight },
              { to: "services", label: "Services", hint: "Brokerage, coaching, claims", icon: ShieldCheck },
              { to: "calculator", label: "Smart Calculator", hint: "Top-up vs consolidation", icon: Calculator },
              { to: "book", label: "The Book", hint: "Smart Borrowing", icon: BookOpen },
              { to: "tv-hub", label: "TV Hub", hint: "Episodes and guides", icon: PlayCircle },
              { to: "contact", label: "Contact", hint: "Reach the desk", icon: Mail },
            ].map((l) => (
              <button
                key={l.label}
                onClick={() => nav(l.to)}
                className="pc-spot group flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--sunken)] text-[var(--ink-3)] transition-colors group-hover:bg-[#0A1128] group-hover:text-[#D4AF37]">
                  <l.icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold text-[var(--ink)]">{l.label}</span>
                  <span className="block text-[12px] text-[var(--ink-4)]">{l.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
        </>
      )}

      {/* ══ CHECKOUT ════════════════════════════════════════════════════════
          A page, not a modal. Three states on one URL: your details, the
          prompt on your phone, and the outcome.
          ═══════════════════════════════════════════════════════════════════ */}
      {route === "checkout" && (
        <section className="bg-[var(--mist)] py-12 sm:py-16">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">

              {/* ── the working column ── */}
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_60px_-42px_rgba(10,17,40,.5)] sm:p-9">

                {/* progress */}
                <ol className="mb-8 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                  {["Your details", "Your phone", "Done"].map((label, i) => {
                    const n = i + 1;
                    const at = mpesa?.step || 1;
                    return (
                      <li key={label} className="flex flex-1 items-center gap-2">
                        <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] " +
                          (n < at ? "bg-[#00A651] text-white" : n === at ? "bg-[#0A1128] text-white" : "bg-[var(--sunken)] text-[var(--ink-5)]")}>
                          {n < at ? <CheckCircle2 size={13} /> : n}
                        </span>
                        <span className={"hidden sm:block " + (n === at ? "text-[var(--ink)]" : "text-[var(--ink-5)]")}>{label}</span>
                        {n < 3 && <span className={"h-px flex-1 " + (n < at ? "bg-[#00A651]" : "bg-[var(--line)]")} />}
                      </li>
                    );
                  })}
                </ol>

                {/* ── step 1 · details ── */}
                {(!mpesa || mpesa.step === 1) && (
                  <form onSubmit={submitMpesa}>
                    <h2 className="font-display text-[1.45rem] font-extrabold text-[var(--ink)]">Where should it go?</h2>
                    <p className="mt-1.5 text-[13.5px] text-[var(--ink-4)]">
                      No account needed. We ask for the least we can and still get the book to you.
                    </p>

                    {!mpesa?.cart && (
                      <div className="mt-6 flex gap-1.5 rounded-full bg-[var(--sunken)] p-1.5">
                        {[
                          { k: "physical", label: "Physical · " + fmt(PRICES.physical) },
                          { k: "ebook", label: "eBook · " + fmt(PRICES.ebook) },
                        ].map((o) => (
                          <button key={o.k} type="button"
                            onClick={() => { setEdition(o.k); setMpesa((m) => ({ ...(m || { step: 1 }), variant: o.k })); }}
                            className={"flex-1 rounded-full px-3 py-2.5 text-[12px] font-extrabold transition-all duration-300 " +
                              ((mpesa?.variant || edition) === o.k ? "bg-[#00A651] text-white shadow" : "text-[var(--ink-3)] hover:text-[var(--ink)]")}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" required placeholder="Jane Wanjiku" value={mpesaForm.name}
                        onChange={(e) => setMpesaForm({ ...mpesaForm, name: e.target.value })} />
                      <Field label="M-Pesa phone number" required placeholder="0712 345 678" value={mpesaForm.phone}
                        onChange={(e) => setMpesaForm({ ...mpesaForm, phone: e.target.value })} />
                      <Field label={checkoutDigital ? "Town (for records)" : "Delivery town"}
                        required={!checkoutDigital} placeholder="Nairobi" value={mpesaForm.town}
                        onChange={(e) => setMpesaForm({ ...mpesaForm, town: e.target.value })} />
                      <Field label="Email — receipt and download link" type="email" required={checkoutDigital}
                        placeholder="jane@example.com" value={mpesaForm.email}
                        onChange={(e) => setMpesaForm({ ...mpesaForm, email: e.target.value })} />
                    </div>

                    {mpesa?.error && (
                      <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-[12.5px] leading-relaxed text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{mpesa.error}</span>
                      </div>
                    )}

                    <MpesaButton type="submit" disabled={mpesa?.loading} className="mt-7 w-full">
                      {mpesa?.loading
                        ? (<><Loader2 size={17} className="animate-spin" /> Sending the prompt…</>)
                        : (<><Smartphone size={17} /> Pay {fmt(mpesaPrice)} via M-Pesa</>)}
                    </MpesaButton>
                    <button type="button" onClick={() => nav("book")}
                      className="mt-3.5 w-full text-center text-[12px] font-bold text-[var(--ink-4)] underline underline-offset-4 hover:text-[var(--ink)]">
                      Back to the book
                    </button>
                  </form>
                )}

                {/* ── step 2 · the phone is ringing ── */}
                {mpesa?.step === 2 && (
                  <div className="py-4 text-center">
                    <div className="relative mx-auto grid h-24 w-24 place-items-center">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#00A651]/20" />
                      <span className="absolute inset-3 rounded-full bg-[#00A651]/10" />
                      <Smartphone size={36} className="relative text-[#00A651]" />
                    </div>
                    <h2 className="mt-7 font-display text-[1.6rem] font-extrabold text-[var(--ink)]">Check your phone</h2>
                    <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[var(--ink-3)]">
                      Safaricom has sent a prompt to <strong className="text-[var(--ink)]">{mpesaForm.phone}</strong> for{" "}
                      <strong className="text-[var(--ink)]">{fmt(mpesa.amount || mpesaPrice)}</strong>. Enter your M-Pesa PIN to confirm.
                    </p>
                    <ol className="mx-auto mt-7 max-w-xs space-y-2.5 text-left text-[12.5px] text-[var(--ink-4)]">
                      {["Unlock your phone", "Enter your M-Pesa PIN on the prompt", "Stay here — this page updates by itself"].map((t, i) => (
                        <li key={t} className="flex gap-3">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--sunken)] text-[10px] font-extrabold tabular-nums text-[var(--ink-3)]">{i + 1}</span>
                          {t}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-7 flex items-center justify-center gap-2 text-[12.5px] font-bold text-[#00A651]">
                      <Loader2 size={15} className="animate-spin" /> Waiting for Safaricom…
                    </div>
                    <p className="mx-auto mt-4 max-w-sm text-[11.5px] leading-relaxed text-[var(--ink-5)]">
                      No prompt after a minute? Dial <strong>*334#</strong> and check, or start again — you will not be charged twice.
                    </p>
                  </div>
                )}

                {/* ── step 3 · the outcome ── */}
                {mpesa?.step === 3 && (() => {
                  const paid = mpesa.status === "paid";
                  const cancelled = mpesa.status === "cancelled";
                  const tone = paid ? "#00A651" : cancelled ? "#94A3B8" : "#DC2626";
                  const Icon = paid ? CheckCircle2 : cancelled ? XCircle : AlertCircle;
                  return (
                    <div className="pc-pop py-4 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl" style={{ background: tone + "1A", color: tone }}>
                        <Icon size={32} />
                      </div>
                      <h2 className="mt-6 font-display text-[1.6rem] font-extrabold leading-tight text-[var(--ink)]">
                        {paid ? "Payment received"
                          : cancelled ? "You cancelled the prompt"
                          : mpesa.status === "timeout" ? "The prompt timed out"
                          : "That payment did not go through"}
                      </h2>
                      <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[var(--ink-3)]">
                        {paid
                          ? fmt(mpesa.amount || mpesaPrice) + " from " + (mpesaForm.phone || "your number") + ". Thank you, " + (mpesaForm.name || "friend") + "."
                          : (mpesa.message || "No money left your account.")}
                      </p>

                      {paid && mpesa.downloadUrl && (
                        <div className="mt-7 rounded-2xl border-2 border-[#00A651]/25 bg-[#00A651]/[0.06] p-6">
                          <div className="flex items-center justify-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#00A651]">
                            {mpesa.autoDownloaded ? (<><Download size={14} /> Downloading now</>) : (<><FileText size={14} /> Your eBook is ready</>)}
                          </div>
                          <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                            {mpesa.autoDownloaded
                              ? "Look in your Downloads folder — on a phone, pull down the notification shade and tap the file."
                              : "Your browser blocked the automatic download. Tap below to get it."}
                          </p>
                          <a href={mpesa.downloadUrl} download={mpesa.filename || true}
                            className="pc-tap mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00A651] px-6 py-3.5 text-[13px] font-extrabold text-white shadow-lg shadow-[#00A651]/25">
                            <Download size={16} /> {mpesa.autoDownloaded ? "Download again" : "Download the PDF"}
                          </a>
                        </div>
                      )}

                      {paid && mpesa.orderId && (
                        <p className="mt-5 text-[12.5px] text-[var(--ink-4)]">
                          Keep this reference:{" "}
                          <button onClick={() => nav("order", { param: mpesa.orderId })}
                            className="font-mono font-bold text-[var(--gold-ink)] underline underline-offset-2">
                            {mpesa.orderId}
                          </button>
                        </p>
                      )}

                      {!paid && (
                        <div className="mt-6 rounded-2xl bg-[var(--mist)] p-5 text-left text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                          Nothing was deducted. Try again, or pay on <strong className="text-[var(--ink)]">{USSD}</strong> and send the
                          M-Pesa SMS to <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">WhatsApp</a>.
                        </div>
                      )}

                      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                        {paid ? (
                          <>
                            <OutlineButton tone="dark" onClick={() => nav("")} className="flex-1">Done</OutlineButton>
                            <GoldButton onClick={() => { setMpesa(null); openBooking("Just bought the book.", "free"); }} className="flex-1">
                              Book a free review
                            </GoldButton>
                          </>
                        ) : (
                          <>
                            <OutlineButton tone="dark" onClick={() => nav("book")} className="flex-1">Back to the book</OutlineButton>
                            <MpesaButton onClick={() => setMpesa((m) => ({ ...m, step: 1, status: null, error: null, orderId: null, loading: false }))} className="flex-1">
                              Try again
                            </MpesaButton>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── the summary column ── */}
              <div className="space-y-5 lg:sticky lg:top-28">
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-6">
                  <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-4)]">Your order</h3>
                  <div className="mt-4 space-y-3">
                    {checkoutLines.map((l) => (
                      <div key={l.label} className="flex items-start justify-between gap-4 text-[13px]">
                        <span className="text-[var(--ink-2)]">{l.label}{l.qty > 1 ? " × " + l.qty : ""}</span>
                        <span className="shrink-0 font-bold tabular-nums text-[var(--ink)]">{fmt(l.price * l.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-[var(--line)] pt-4">
                    <span className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-4)]">Total</span>
                    <span className="font-display text-[1.5rem] font-extrabold tabular-nums text-[var(--ink)]">{fmt(mpesaPrice)}</span>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--ink-5)]">
                    {checkoutDigital
                      ? "Delivered as a PDF the moment payment clears — no waiting for an email."
                      : "Delivered countrywide in 2–3 working days."}
                  </p>
                </div>

                <PayeeAssurance payee={payHealthState?.payee} amount={mpesaPrice} compact />

                {payHealthState && !payHealthState.live && (
                  <div className="rounded-2xl border border-[#D4AF37]/40 bg-[var(--cream)] p-5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--gold-ink)]" />
                      <p className="text-[12px] leading-relaxed text-[#8A6D1F]">
                        {payHealthState.reachable
                          ? "The payment server is running but has no Safaricom credentials, so this is a rehearsal — no prompt will be sent and nothing will be charged."
                          : "No payment server is reachable, so this is a rehearsal — no prompt will be sent and nothing will be charged."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ ORDER STATUS ════════════════════════════════════════════════════ */}
      {route === "order" && <OrderPage reference={routeParam} onHome={() => nav("")} />}

      {route === "contact" && (
        <>
      {/* ══ CONTACT (white) ═════════════════════════════════════════════════ */}
      <section id="contact" className="relative overflow-hidden bg-[var(--paper)] py-14 sm:py-20">
        <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#00A651]/[.06] blur-[130px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">

          <div className="mt-14 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">

            {/* channels */}
            <div className="space-y-4">
              {[
                { icon: Phone, label: "Call the desk", value: "+254 796 882 372", note: "Mon–Fri, 8:30am–5:30pm EAT", href: "tel:+254796882372", tone: "gold" },
                { icon: MessageCircle, label: "WhatsApp", value: "Chat with the team", note: "Fastest for quick questions", href: WHATSAPP, tone: "mpesa" },
                { icon: Smartphone, label: "Bizsure USSD", value: USSD, note: "Instant quotes on any handset", href: "tel:" + USSD, tone: "gold" },
                { icon: Mail, label: "Email", value: OFFICE.email, note: "Documents & offer letters", href: "mailto:" + OFFICE.email, tone: "navy" },
                { icon: Phone, label: OFFICE.org, value: OFFICE.phone, note: "The brokerage desk", href: "tel:+254710890994", tone: "navy" },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                  data-reveal="left"
                  className="pc-spot group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_54px_-30px_rgba(10,17,40,.45)]"
                >
                  <span className={
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-105 " +
                    (c.tone === "mpesa" ? "bg-[#00A651]/10 text-[#00A651] group-hover:bg-[#00A651] group-hover:text-white"
                      : c.tone === "navy" ? "bg-[var(--sunken)] text-[var(--ink-2)] group-hover:bg-[#0A1128] group-hover:text-white"
                      : "bg-[var(--cream)] text-[var(--gold-ink)] group-hover:bg-[#D4AF37] group-hover:text-[var(--ink)]")
                  }>
                    <c.icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-5)]">{c.label}</span>
                    <span className="mt-1 block text-[14.5px] font-extrabold text-[var(--ink)]">{c.value}</span>
                    <span className="mt-0.5 block text-[12px] text-[var(--ink-4)]">{c.note}</span>
                  </span>
                  <ArrowUpRight size={16} className="mt-1 shrink-0 text-[var(--ink-5)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D4AF37]" />
                </a>
              ))}

              <div className="rounded-2xl bg-[#0A1128] p-6">
                <div className="flex items-center gap-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#D4AF37]">
                  <MapPin size={14} /> The office
                </div>
                <address className="mt-3 not-italic">
                  <span className="block text-[14.5px] font-extrabold text-white">{OFFICE.org}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-[#A9BAD8]">
                    {OFFICE.line1}<br />{OFFICE.line2}
                  </span>
                </address>
                <div className="mt-3 flex items-center gap-2 text-[12.5px] text-[#8FA0C0]">
                  <Clock size={13} className="text-[#00A651]" /> {OFFICE.hours}
                </div>
                <a
                  href={OFFICE.maps} target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#20305C] px-4 py-3 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[#D4AF37] md:py-2 transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[var(--ink)]"
                >
                  <Navigation size={13} /> Get directions
                </a>
                <p className="mt-4 border-t border-[#1A2749] pt-4 text-[12px] leading-relaxed text-[#6E7FA3]">
                  Coaching sessions run on Google Meet, or in person here by appointment.
                </p>
                <div className="mt-5 flex gap-2.5">
                  {SOCIAL.map((sn) => (
                    <a key={sn.label} href={sn.href} target="_blank" rel="me noreferrer" aria-label={sn.label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-[#20305C] text-[#8FA0C0] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                      <sn.icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* form */}
            <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--mist)] shadow-[0_30px_70px_-42px_rgba(10,17,40,.5)]">
              {sent ? (
                <div className="pc-pop p-10 text-center sm:p-14">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#00A651]/10 text-[#00A651]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="mt-6 font-display text-[1.6rem] font-extrabold text-[var(--ink)]">Message sent</h3>
                  <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--ink-3)]">
                    Thank you{sent.name ? ", " + sent.name.split(" ")[0] : ""}. Your enquiry about{" "}
                    <span className="font-semibold text-[var(--ink)]">{sent.topic.toLowerCase()}</span> is with the desk.
                    Expect a reply within one working day — sooner on WhatsApp.
                  </p>
                  <div className="mx-auto mt-7 inline-flex items-center gap-2.5 rounded-full bg-[var(--paper)] px-5 py-2.5 text-[12.5px]">
                    <span className="text-[var(--ink-4)]">Reference</span>
                    <span className="font-display font-extrabold text-[var(--ink)]">{sent.ref}</span>
                  </div>
                  {sent.demo && (
                    <p className="mx-auto mt-4 max-w-sm rounded-xl bg-[var(--cream)] px-4 py-2.5 text-[11.5px] leading-relaxed text-[#8A6D1F]">
                      Demo mode — nothing was actually sent. Configure <code className="font-mono">CONTACT_ENDPOINT</code> to go live.
                    </p>
                  )}
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <OutlineButton tone="dark" onClick={() => { setSent(null); setContact({ name: "", email: "", phone: "", topic: "Insurance quote", message: "", consent: false, botcheck: false }); }}>
                      Send another
                    </OutlineButton>
                    <GoldButton onClick={() => openBooking(null, "free")}>
                      Book a free review <ArrowRight size={14} />
                    </GoldButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={sendContact} className="p-7 sm:p-10">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cream)] text-[var(--gold-ink)]"><Send size={20} /></span>
                    <div>
                      <h3 className="font-display text-[1.25rem] font-extrabold text-[var(--ink)]">Send a message</h3>
                      <p className="text-[12.5px] text-[var(--ink-4)]">No obligation — and no sales script.</p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required placeholder="Jane Wanjiku" value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                    <Field label="Email" type="email" required placeholder="jane@example.com" value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                    <Field label="Phone" required placeholder="07XX XXX XXX" value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)]">What is it about?</span>
                      <div className="relative">
                        <select
                          value={contact.topic}
                          onChange={(e) => setContact({ ...contact, topic: e.target.value })}
                          className="w-full appearance-none rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 pr-10 text-sm text-[var(--ink)] outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
                        >
                          {["Insurance quote", "Loan / offer letter review", "Declined claim", "Corporate & SME training", "Media or speaking request", "Share my experience", "Something else"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-5)]" />
                      </div>
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)]">Your message</span>
                    <textarea
                      rows={5} required value={contact.message}
                      onChange={(e) => setContact({ ...contact, message: e.target.value })}
                      placeholder="Tell us the situation — the loan, the policy, the claim. The more detail, the better the first answer."
                      className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-relaxed text-[var(--ink)] placeholder-[#9AA6BF] outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/12"
                    />
                  </label>

                  {/* honeypot — hidden from people, harvested by bots; Web3Forms rejects it */}
                  <label className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                    Leave this field empty
                    <input
                      type="checkbox" tabIndex={-1} autoComplete="off" checked={contact.botcheck}
                      onChange={(e) => setContact({ ...contact, botcheck: e.target.checked })}
                    />
                  </label>

                  <label className="mt-5 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox" required checked={contact.consent}
                      onChange={(e) => setContact({ ...contact, consent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#D4AF37]"
                    />
                    <span className="text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                      I agree that Paul Chege Consultancy may contact me about this enquiry, and I have read the{" "}
                      <button type="button" onClick={(e) => { e.preventDefault(); nav("privacy"); }}
                        className="font-bold text-[var(--gold-ink)] underline underline-offset-2">
                        privacy notice
                      </button>. No marketing lists, no sharing with third parties.
                    </span>
                  </label>

                  {sendError && (
                    <div className="pc-pop mt-6 flex items-start gap-3 rounded-2xl border border-[#F6C9C9] bg-[#FEF2F2] p-4" role="alert">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#DC2626]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#991B1B]">Message not sent</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-[#B45252]">{sendError}</p>
                        <a
                          href={"mailto:" + CONTACT_ENDPOINT.to + "?subject=" + encodeURIComponent(contact.topic) + "&body=" + encodeURIComponent(contact.message)}
                          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#991B1B] underline underline-offset-2"
                        >
                          <Mail size={13} /> Email it instead
                        </a>
                      </div>
                    </div>
                  )}

                  <GoldButton type="submit" disabled={sending} className="mt-7 w-full !py-4">
                    {sending ? (<><Loader2 size={16} className="animate-spin" /> Sending…</>) : (<><Send size={15} /> Send Message</>)}
                  </GoldButton>

                  {!isLive() && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#B08D2E]">
                      <AlertTriangle size={12} /> Demo mode — no endpoint configured yet.
                    </p>
                  )}

                  <div className="mt-5 flex flex-col items-center justify-center gap-2 text-[11.5px] text-[var(--ink-5)] sm:flex-row sm:gap-4">
                    <span className="flex items-center gap-1.5"><Clock size={13} /> Replies within one working day</span>
                    <span className="hidden h-3 w-px bg-[var(--line)] sm:block" />
                    <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Your details stay with the desk</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

        </>
      )}

        </div>
      </main>

      {/* ══ CTA BAND (gold) ═════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#F3E5AB,#D4AF37_45%,#C09B2B)] py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-[var(--paper)]/25 blur-[90px]" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-center gap-8 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:px-10 lg:text-left">
          <div>
            <h2 className="font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-[2.5rem]">
              Your financial freedom is my mission.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3212]">
              One conversation is usually enough to see where the money is leaking. Book the free
              review, or dial the Bizsure USSD line and get a quote in under two minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              onClick={() => openBooking(null, "free")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1128] px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_16px_34px_-16px_rgba(10,17,40,.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14203F]"
            >
              Book a Free Review <ArrowRight size={15} />
            </button>
            <a
              href={"tel:" + USSD}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0A1128]/25 px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0A1128]"
            >
              <Phone size={15} /> Dial {USSD}
            </a>
          </div>
        </div>
      </section>

      {/* ══ BRANDS (home only, above the footer) ════════════════════════════ */}
      {route === "" && (
        <section className="border-t border-[var(--line)] bg-[var(--paper)] py-16 sm:py-20">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--gold-ink)]">
                <span className="h-px w-7 bg-current opacity-60" /> Trusted by
                <span className="h-px w-7 bg-current opacity-60" />
              </div>
              <h2 className="font-display text-[1.9rem] font-extrabold tracking-tight text-[var(--ink)] sm:text-[2.3rem]">Brands</h2>
              <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-3)]">
                Businesses Paul works with, features and recommends across the shows.
              </p>
            </div>

            <div className="pc-marquee-wrap relative mt-12">
              <div className="pc-fade-x overflow-hidden py-2">
                <div className="pc-marquee gap-5">
                  {[...BRANDS, ...BRANDS].map((b, i) => (
                    <div key={b.name + i} className="w-[260px] shrink-0" aria-hidden={i >= BRANDS.length}>
                      <BrandCard brand={b} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[12.5px] text-[var(--ink-5)]">
              Work with Paul?{" "}
              <button onClick={() => nav("contact")} className="font-bold text-[var(--gold-ink)] underline underline-offset-2 hover:text-[var(--ink)]">
                Talk about a partnership
              </button>
            </p>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="pc-grain relative overflow-hidden bg-[#0A1128] pb-28 pt-0 md:pb-0">
        {/* gold hairline + ambient light */}
        <div className="h-px w-full bg-[linear-gradient(90deg,transparent,#D4AF37,transparent)]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/[.07] blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[#00A651]/[.05] blur-[120px]" />
        </div>

        {/* the oversized wordmark watermark */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 left-1/2 hidden w-full -translate-x-1/2 select-none text-center font-display text-[12vw] font-extrabold leading-none text-white/[.025] lg:block"
        >
          Paul Chege
        </span>

        <div className="relative mx-auto max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10">

          {/* ── the USSD strip ── */}
          <div className="mb-14 grid gap-4 rounded-[1.5rem] border border-[#1E2B4E] bg-[#0D1733]/70 p-6 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37] text-[#0A1128]">
                <Smartphone size={21} />
              </span>
              <div>
                <p className="font-display text-[1.15rem] font-extrabold text-white">
                  Need cover in the next two minutes?
                </p>
                <p className="mt-1 text-[13.5px] text-[#9FB0D0]">
                  Dial the Bizsure USSD line from any handset — no app, no data.
                </p>
              </div>
            </div>
            <a
              href={"tel:" + USSD}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] px-7 py-4 font-display text-[1.05rem] font-extrabold tracking-tight text-[#0A1128] shadow-[0_14px_34px_-14px_rgba(212,175,55,.9)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Phone size={17} /> {USSD}
            </a>
          </div>

          {/* ── the columns ── */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-12">

            {/* brand */}
            <div className="col-span-2 lg:col-span-4">
              <img src={LOGO} alt="Paul Chege Consultancy TV" className="h-16 w-auto object-contain" />
              <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-[#9FB0D0]">
                Demystifying insurance and smart leverage for Kenyan households and businesses.
              </p>

              <a
                href="https://www.bizsure.co.ke" target="_blank" rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 rounded-xl border border-[#1E2B4E] bg-[#0D1733] px-4 py-3 transition-colors hover:border-[#D4AF37]"
              >
                <span className="text-[9px] font-extrabold uppercase leading-tight tracking-[0.16em] text-[#6E7FA3]">
                  In partnership<br />with
                </span>
                <img src="/img/brands/bizsure.webp" alt="Bizsure Insurance Brokers" className="pc-logoplate h-7 w-auto object-contain" />
              </a>
            </div>

            {/* services */}
            <div className="lg:col-span-2">
              <h4 className="pc-rule flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]">
                Services <span className="h-px flex-1 bg-[#1E2B4E]" />
              </h4>
              <ul className="mt-5 space-y-1 md:space-y-3">
                {[
                  { label: "Insurance Brokerage", to: "services", hash: "brokerage" },
                  { label: "Debt Coaching", to: "services", hash: "coaching" },
                  { label: "Claims Advocacy", to: "services", hash: "claims" },
                  { label: "Book a Session", to: "booking" },
                ].map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => nav(l.to, { hash: l.hash })}
                      className="pc-tap-row group flex items-center gap-1.5 text-left text-[13.5px] text-[#9FB0D0] transition-colors hover:text-white"
                    >
                      <span className="h-px w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-3" />
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* explore */}
            <div className="lg:col-span-2">
              <h4 className="pc-rule flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]">
                Explore <span className="h-px flex-1 bg-[#1E2B4E]" />
              </h4>
              <ul className="mt-5 space-y-1 md:space-y-3">
                {[
                  { label: "About Paul", to: "about" },
                  { label: "Smart Calculator", to: "calculator" },
                  { label: "The Book", to: "book" },
                  { label: "TV Hub", to: "tv-hub" },
                  { label: "Kikuyu Guides", to: "tv-hub", filter: "kikuyu" },
                  { label: "Questions & Answers", to: "faq" },
                  { label: "The Podcast", href: YT_PODCASTS },
                ].map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a href={l.href} target="_blank" rel="noreferrer"
                        className="pc-tap-row group flex items-center gap-1.5 text-[13.5px] text-[#9FB0D0] transition-colors hover:text-white">
                        <span className="h-px w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-3" />
                        {l.label}
                        <ArrowUpRight size={12} className="opacity-50" />
                      </a>
                    ) : (
                      <button
                        onClick={() => nav(l.to, { filter: l.filter })}
                        className="pc-tap-row group flex items-center gap-1.5 text-left text-[13.5px] text-[#9FB0D0] transition-colors hover:text-white"
                      >
                        <span className="h-px w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-3" />
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* contact */}
            <div className="col-span-2 lg:col-span-4">
              <h4 className="pc-rule flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]">
                Reach the desk <span className="h-px flex-1 bg-[#1E2B4E]" />
              </h4>

              <ul className="mt-5 space-y-3.5">
                {[
                  { icon: Phone, label: "Call", value: OFFICE.phone, href: "tel:+254710890994" },
                  { icon: Mail, label: "Email", value: OFFICE.email, href: "mailto:" + OFFICE.email },
                  { icon: MessageCircle, label: "WhatsApp", value: "Chat with the team", href: WHATSAPP },
                ].map((c) => (
                  <li key={c.label}>
                    <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                      className="pc-tap-row group flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#1E2B4E] bg-[#0D1733] text-[#D4AF37] transition-colors group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#0A1128]">
                        <c.icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[#6E7FA3]">{c.label}</span>
                        <span className="block truncate text-[13.5px] text-[#C7D3EA] transition-colors group-hover:text-white">{c.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <address className="mt-5 flex items-start gap-3 not-italic">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#1E2B4E] bg-[#0D1733] text-[#00A651]">
                  <MapPin size={15} />
                </span>
                <span className="text-[13px] leading-relaxed text-[#9FB0D0]">
                  {OFFICE.line1}<br />{OFFICE.line2}
                  <a href={OFFICE.maps} target="_blank" rel="noreferrer"
                    className="pc-tap ml-1 inline-flex items-center gap-1 font-bold text-[#D4AF37] hover:text-[#F3E5AB]">
                    Directions <ArrowUpRight size={11} />
                  </a>
                </span>
              </address>

              <div className="mt-4 flex items-center gap-2 text-[12.5px] text-[#6E7FA3]">
                <Clock size={13} /> {OFFICE.hours}
              </div>
            </div>
          </div>

          {/* ── follow row ── */}
          <div className="mt-14 grid gap-4 border-t border-[#1A2749] pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {SOCIAL.map((sn) => (
              <a
                key={sn.label} href={sn.href} target="_blank" rel="me noreferrer"
                className="group flex items-center gap-3.5 rounded-2xl border border-[#1E2B4E] bg-[#0D1733]/60 px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0A1128] text-[#8FA0C0] transition-colors group-hover:text-[#D4AF37]">
                  <sn.icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-extrabold leading-none text-white">{sn.count}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-[#6E7FA3]">{sn.label}</span>
                </span>
                <ArrowUpRight size={14} className="ml-auto shrink-0 text-[#34446E] transition-all group-hover:-translate-y-0.5 group-hover:text-[#D4AF37]" />
              </a>
            ))}
          </div>

          {/* ── bottom bar ── */}
          <div className="mt-12 flex flex-col gap-5 border-t border-[#1A2749] py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 text-[12px] leading-relaxed text-[#6E7FA3]">
              <p>
                © {new Date().getFullYear()} Paul Chege Consultancy TV ·{" "}
                <span className="text-[#8FA0C0]">Learn · Plan · Build · Prosper</span>
              </p>
              <p>Prototype — figures are indicative and not a financial offer.</p>
            </div>

            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button onClick={() => nav("privacy")}
                className="pc-tap-row text-[12px] text-[#8FA0C0] transition-colors hover:text-white">
                Privacy notice
              </button>
              <button onClick={() => nav("terms")}
                className="pc-tap-row text-[12px] text-[#8FA0C0] transition-colors hover:text-white">
                Terms of use
              </button>
            </nav>

            <div className="flex items-center gap-5">
              <span className="hidden max-w-[22rem] text-right text-[11.5px] leading-relaxed text-[#6E7FA3] lg:inline">
                Insurance arranged through Bizsure Insurance Brokers, regulated by the
                Insurance Regulatory Authority of Kenya · Licence {ENTITY.ira}
              </span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
                className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#1E2B4E] text-[#8FA0C0] transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <ArrowUp size={17} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ══ DESKTOP CONVERSION BAR ══════════════════════════════════════════ */}
      {showBar && route !== "booking" && (
        <div className="pc-pop fixed inset-x-0 bottom-0 z-[58] hidden justify-center px-6 pb-6 md:flex">
          <div className="pointer-events-auto flex items-center gap-5 rounded-full border border-[var(--line)] bg-[var(--paper)]/95 py-2.5 pl-6 pr-2.5 shadow-[0_22px_50px_-20px_rgba(10,17,40,.5)] backdrop-blur-xl">
            <span className="hidden items-center gap-2.5 text-[13px] text-[var(--ink-3)] lg:flex">
              <span className="pc-beat h-2 w-2 rounded-full bg-[#00A651]" />
              Not sure if your loan is priced fairly?
            </span>
            <button
              onClick={() => nav("calculator")}
              className="rounded-full px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink-2)] transition-colors hover:text-[var(--gold-ink)]"
            >
              Model your loan
            </button>
            <GoldButton onClick={() => openBooking(null, "free")} className="!px-6 !py-3">
              Book a free review
            </GoldButton>
            <button
              onClick={() => setShowBar(false)}
              aria-label="Dismiss"
              className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-5)] transition-colors hover:bg-[var(--sunken)] hover:text-[var(--ink)]"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ══ COMMAND PALETTE ═════════════════════════════════════════════════ */}
      {paletteOpen && (
        <div className="fixed inset-0 z-[98] flex items-start justify-center p-4 pt-[12vh]">
          <div className="absolute inset-0 bg-[#04070F]/70 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
          <div
            ref={paletteRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Search"
            className="pc-card pc-pop relative z-10 w-full max-w-xl overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_40px_90px_-24px_rgba(4,7,15,.7)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-5">
              <Search size={17} className="shrink-0 text-[var(--ink-5)]" />
              <input
                autoFocus
                value={paletteQ}
                onChange={(e) => { setPaletteQ(e.target.value); setPaletteIdx(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setPaletteIdx((i) => Math.min(i + 1, paletteHits.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setPaletteIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const hit = paletteHits[paletteIdx];
                    if (hit) { setPaletteOpen(false); hit.go(); }
                  }
                }}
                placeholder="Search pages, episodes, chapters…"
                className="w-full bg-transparent py-4 text-[15px] text-[var(--ink)] placeholder-[var(--ink-5)] outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-5)] sm:block">esc</kbd>
            </div>

            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {paletteHits.length === 0 && (
                <li className="px-4 py-8 text-center text-[13.5px] text-[var(--ink-4)]">
                  Nothing matches “{paletteQ}”.
                </li>
              )}
              {paletteHits.map((hit, i) => (
                <li key={hit.kind + hit.label}>
                  <button
                    onMouseEnter={() => setPaletteIdx(i)}
                    onClick={() => { setPaletteOpen(false); hit.go(); }}
                    className={
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " +
                      (i === paletteIdx ? "bg-[var(--sunken)]" : "")
                    }
                  >
                    <span className={
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg " +
                      (i === paletteIdx ? "bg-[#0A1128] text-[#D4AF37]" : "bg-[var(--sunken)] text-[var(--ink-4)]")
                    }>
                      <hit.icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-[var(--ink)]">{hit.label}</span>
                      {hit.hint && <span className="block truncate text-[11.5px] text-[var(--ink-4)]">{hit.hint}</span>}
                    </span>
                    <span className="shrink-0 rounded-full bg-[var(--sunken)] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink-5)]">
                      {hit.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-2.5 text-[11px] text-[var(--ink-5)]">
              <span className="flex items-center gap-1.5"><kbd className="rounded border border-[var(--line)] px-1 font-mono">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="rounded border border-[var(--line)] px-1 font-mono">↵</kbd> open</span>
              <span className="ml-auto flex items-center gap-1.5"><kbd className="rounded border border-[var(--line)] px-1 font-mono">⌘K</kbd> anytime</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ BOOK PAGE NUDGE (once ever) ═════════════════════════════════════ */}
      {bookPrompt && (
        <div className="pc-pop fixed bottom-6 left-6 z-[59] hidden w-[19rem] rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_28px_60px_-22px_rgba(10,17,40,.55)] md:block">
          <button
            onClick={() => setBookPrompt(false)} aria-label="Dismiss"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[var(--ink-5)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <img src={BOOK_ART} alt="" className="h-16 w-auto rounded-lg object-contain" />
            <div className="min-w-0 pr-4">
              <p className="text-[13px] font-extrabold leading-snug text-[var(--ink)]">
                Reading the chapters?
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
                Get the whole thing for {fmt(PRICES.physical)} — delivered countrywide.
              </p>
            </div>
          </div>
          <MpesaButton onClick={() => { setBookPrompt(false); openMpesa("physical"); }} className="mt-4 w-full !py-3 !text-[11.5px]">
            <Smartphone size={15} /> Buy via M-Pesa
          </MpesaButton>
        </div>
      )}

      {/* ══ MOBILE STICKY QUICK ACTIONS (<768px) ════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--line)] bg-[var(--paper)]/97 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-3 shadow-[0_-8px_30px_-12px_rgba(10,17,40,.3)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-[1fr_1.15fr_1fr] gap-2">
          <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#00A651] text-white">
            <MessageCircle size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.06em]">WhatsApp</span>
          </a>
          <button onClick={() => nav("booking")} aria-label="Book a session"
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] text-[var(--ink)] shadow-[0_10px_24px_-12px_rgba(212,175,55,.95)]">
            <Calendar size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.06em]">Book a session</span>
          </button>
          <a href={"tel:" + USSD} aria-label={"Dial " + USSD}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl border border-[var(--line)] bg-[var(--mist)] text-[var(--ink-2)]">
            <Phone size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.06em]">{USSD}</span>
          </a>
        </div>
      </div>

      <a href={WHATSAPP} target="_blank" rel="noreferrer"
        className="pc-ring fixed bottom-8 right-8 z-[60] hidden h-14 w-14 place-items-center rounded-full bg-[#00A651] text-white shadow-2xl transition-transform duration-300 hover:scale-110 md:grid"
        aria-label="WhatsApp chat">
        <MessageCircle size={24} />
      </a>

      {/* ══ CART DRAWER ═════════════════════════════════════════════════════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-[#060B1A]/60 backdrop-blur-[3px]" onClick={() => setCartOpen(false)} />
          <aside ref={cartRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Cart" className="pc-slide absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[var(--paper)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
              <h3 className="flex items-center gap-2.5 font-display text-[1.1rem] font-extrabold text-[var(--ink)]">
                <ShoppingCart size={18} className="text-[var(--gold-ink)]" /> Your cart
                {cartCount > 0 && <span className="rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--gold-ink)]">{cartCount}</span>}
              </h3>
              <button onClick={() => setCartOpen(false)} className="rounded-full p-2 text-[var(--ink-3)] transition-colors hover:bg-[var(--sunken)] hover:text-[var(--ink)]" aria-label="Close cart">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cart.length === 0 ? (
                <div className="py-20 text-center">
                  <ShoppingCart size={32} className="mx-auto text-[#DDE3EF]" />
                  <p className="mt-4 text-[14px] text-[var(--ink-4)]">Nothing here yet.</p>
                  <OutlineButton tone="dark" onClick={() => { setCartOpen(false); go("#book"); }} className="mt-6">
                    <BookOpen size={15} /> Browse the book
                  </OutlineButton>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map((i) => (
                    <li key={i.id} className="rounded-2xl border border-[var(--line)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold leading-snug text-[var(--ink)]">{i.name}</div>
                          <div className="mt-1 text-[12px] text-[var(--ink-4)]">{fmt(i.price)} each</div>
                        </div>
                        <button onClick={() => removeFromCart(i.id)} className="shrink-0 rounded-lg p-1.5 text-[var(--ink-5)] transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]" aria-label="Remove">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full border border-[var(--line)] p-1">
                          <button onClick={() => bumpQty(i.id, -1)} disabled={i.qty <= 1} className="rounded-full p-1.5 text-[var(--ink-3)] transition-colors hover:bg-[var(--sunken)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent" aria-label="Less"><Minus size={13} /></button>
                          <span className="w-7 text-center text-[13px] font-bold tabular-nums">{i.qty}</span>
                          <button onClick={() => bumpQty(i.id, 1)} className="rounded-full p-1.5 text-[var(--ink-3)] hover:bg-[var(--sunken)]" aria-label="More"><Plus size={13} /></button>
                        </div>
                        <span className="font-display text-[15px] font-extrabold tabular-nums text-[var(--ink)]">{fmt(i.price * i.qty)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[var(--line)] bg-[var(--mist)] px-6 py-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-3)]">Total</span>
                  <span className="font-display text-[1.6rem] font-extrabold tabular-nums text-[var(--ink)]">{fmt(cartTotal)}</span>
                </div>
                <MpesaButton onClick={() => { setCartOpen(false); openMpesa(edition, true); }} className="mt-5 w-full">
                  <Smartphone size={17} /> Checkout · {fmt(cartTotal)}
                </MpesaButton>
                <p className="mt-3 text-center text-[11px] text-[var(--ink-5)]">You will receive an STK push on your phone.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* The M-Pesa modal that used to live here is now the /checkout page.
          A purchase deserves a URL you can return to, a back button that
          means something, and room to show who is being paid. */}

      {/* ══ BOOKING PREFILL MODAL ═══════════════════════════════════════════ */}
      <Modal open={!!bookingModal} onClose={() => setBookingModal(null)} label="Start a booking">
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cream)] text-[var(--gold-ink)]"><Calendar size={21} /></span>
            <div>
              <h3 className="font-display text-[1.2rem] font-extrabold text-[var(--ink)]">Start your booking</h3>
              <p className="text-[12.5px] text-[var(--ink-4)]">We have carried your details into the diary below.</p>
            </div>
          </div>

          {bookingModal?.note && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-5)]">Pre-filled brief</div>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-2)]">{bookingModal.note}</p>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { k: "free", t: "30-Min Free Review", s: "Insurance · Bizsure" },
              { k: "paid", t: "60-Min Coaching", s: fmt(PRICES.coaching) + " · borrowing" },
            ].map((o) => (
              <button key={o.k} onClick={() => setTab(o.k)}
                className={"rounded-2xl border-2 p-5 text-left transition-all duration-300 " +
                  (tab === o.k ? "border-[#D4AF37] bg-[var(--cream)]" : "border-[var(--line)] hover:border-[#D4AF37]/50")}>
                <div className="text-[13.5px] font-extrabold text-[var(--ink)]">{o.t}</div>
                <div className="mt-1 text-[11.5px] text-[var(--ink-4)]">{o.s}</div>
              </button>
            ))}
          </div>

          <GoldButton
            onClick={() => {
              if (bookingModal?.note) setClient((c) => ({ ...c, note: bookingModal.note }));
              setBookingModal(null);
              setTimeout(() => go("#booking"), 30);
            }}
            className="mt-6 w-full"
          >
            Choose a slot <ArrowRight size={14} />
          </GoldButton>
        </div>
      </Modal>

      {/* ══ VIDEO LIGHTBOX ══════════════════════════════════════════════════ */}
      {player && (
        <div className="fixed inset-0 z-[97] flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={player.title}>
          <div className="absolute inset-0 bg-[#04070F]/90 backdrop-blur-sm" onClick={() => setPlayer(null)} />
          <div className="pc-pop relative z-10 w-full max-w-4xl">
            <div className="flex items-start justify-between gap-4 px-4 pb-3 sm:px-0">
              <div className="min-w-0">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]">
                  {FILTERS.find((f) => f.key === player.cat)?.label} · {player.len}
                </p>
                <h3 className="mt-1 truncate font-display text-[15px] font-extrabold text-white sm:text-[17px]">{player.title}</h3>
              </div>
              <button
                onClick={() => setPlayer(null)} aria-label="Close player"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-2xl">
              <iframe
                key={player.id}
                src={"https://www.youtube-nocookie.com/embed/" + player.id + "?autoplay=1&rel=0&modestbranding=1"}
                title={player.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 px-4 pt-3 text-[12px] text-[#8FA0C0] sm:px-0">
              <span>{player.views} views · {player.age}</span>
              <a href={ytWatch(player.id)} target="_blank" rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 font-extrabold uppercase tracking-[0.1em] text-[#D4AF37] hover:text-[#F3E5AB]">
                Open on YouTube <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOAST ═══════════════════════════════════════════════════════════ */}
      {toast && (
        <div className="pc-pop fixed left-1/2 top-24 z-[99] w-[min(92vw,27rem)] -translate-x-1/2">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_22px_50px_-20px_rgba(10,17,40,.5)]">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#00A651]" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-snug text-[var(--ink)]">{toast.text}</p>
              {/* An "added to cart" that does not offer the cart is a dead
                  end — this is the step that was missing. */}
              {toast.action && (
                <button
                  onClick={() => { setToast(null); setCartOpen(true); }}
                  className="mt-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--gold-ink)] underline underline-offset-4 hover:text-[var(--ink)]"
                >
                  {toast.action} →
                </button>
              )}
            </div>
            <button onClick={() => setToast(null)} className="shrink-0 text-[var(--ink-5)] hover:text-[var(--ink)]" aria-label="Dismiss"><X size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A single thrown error should not blank the site. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Paul Chege Consultancy TV — render failed:", error, info);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-[#0A1128] px-6 text-center">
        <div className="max-w-md">
          <img src={LOGO} alt="Paul Chege Consultancy TV" className="mx-auto h-16 w-auto object-contain" />
          <h1 className="mt-8 font-display text-[1.75rem] font-extrabold text-white">
            Something broke on our side
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#A9BAD8]">
            Not your fault. Reload the page, or reach the desk directly — we are on
            WhatsApp and the phone during office hours.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[linear-gradient(135deg,#F3E5AB,#D4AF37)] px-7 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#0A1128]"
            >
              Reload the page
            </button>
            <a
              href={WHATSAPP} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00A651] px-7 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em] text-white"
            >
              WhatsApp us
            </a>
          </div>
          <p className="mt-6 text-[12.5px] text-[#6E7FA3]">
            {OFFICE.phone} · {OFFICE.email}
          </p>
        </div>
      </div>
    );
  }
}

export default function PaulChegeConsultancyTV() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
