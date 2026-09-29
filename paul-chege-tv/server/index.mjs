/**
 * Paul Chege Consultancy TV — payment and delivery server.
 *
 *   browser ──POST /api/checkout──▶ us ──STK push──▶ Safaricom ──▶ handset
 *   handset ──PIN──▶ Safaricom ──POST /api/mpesa/callback──▶ us  (money moved)
 *   browser ──GET /api/order/:id (polling)──▶ us  ──▶ { downloadUrl }
 *   browser ──GET /api/download/:token──▶ us ──▶ the PDF, as an attachment
 *
 * No dependencies: Node 18+ only. Start it with `npm run server`.
 */
import { createServer } from "node:http";
import { createReadStream, statSync, existsSync, realpathSync } from "node:fs";
import { resolve, basename, join, extname, normalize } from "node:path";
import { loadEnv } from "./env.mjs";
import * as store from "./store.mjs";
import * as daraja from "./daraja.mjs";
import * as diary from "./bookings.mjs";
import * as google from "./google.mjs";
import * as email from "./email.mjs";
import * as youtube from "./youtube.mjs";
import * as tpl from "./templates.mjs";

loadEnv();

const PORT = Number(process.env.PORT || 4300);
const PUBLIC_URL = (process.env.PUBLIC_URL || "http://localhost:" + PORT).replace(/\/+$/, "");
const ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:4180,http://localhost:4190,http://localhost:5173")
  .split(",").map((s) => s.trim()).filter(Boolean);

/**
 * Prices live here and only here. The browser sends what the buyer *chose*,
 * never what it costs — otherwise anyone with devtools buys the book for one
 * shilling.
 */
const CATALOGUE = {
  physical: { price: 1999, label: "The Anatomy of Smart Borrowing — physical", digital: false },
  ebook:    { price: 999,  label: "The Anatomy of Smart Borrowing — eBook",    digital: true  },
  coaching: { price: 5000, label: "60-minute Smart Borrowing coaching",        digital: false },
};

/** Who the client is actually paying. Shown to them BEFORE the prompt so the
 *  name on their handset is one they were told to expect — the single most
 *  useful thing you can give a Kenyan buyer to tell a real business from a
 *  scam. */
const PAYEE = {
  name: process.env.PAYEE_NAME || "Bizsure Insurance Brokers",
  shortcode: process.env.MPESA_SHORTCODE || null,
  type: (process.env.MPESA_TX_TYPE || "CustomerPayBillOnline") === "CustomerBuyGoodsOnline" ? "till" : "paybill",
  phone: process.env.OFFICE_PHONE || "+254 710 890 994",
  email: process.env.RECEIPT_REPLY_TO || "info@bizsure.co.ke",
  location: process.env.OFFICE_ADDRESS || "Ciata City Mall, Block A, 2nd Floor, Ridgeways, Kiambu Road, Nairobi",
  licence: process.env.IRA_LICENCE || null,
};

const EBOOK = resolve(process.env.EBOOK_PATH || new URL("./assets/anatomy-of-smart-borrowing.pdf", import.meta.url).pathname);
const EBOOK_NAME = process.env.EBOOK_FILENAME || "The Anatomy of Smart Borrowing — Paul Chege.pdf";

/** Identity block every email signs off with. */
const SITE_ID = () => ({
  org: PAYEE.name, address: PAYEE.location, phone: PAYEE.phone,
  email: PAYEE.email, licence: PAYEE.licence,
});

/* ── tiny helpers ─────────────────────────────────────────────────────── */

const json = (res, status, body, extra = {}) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    ...extra,
  });
  res.end(payload);
};

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ORIGINS.includes(origin) || ORIGINS.includes("*"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function readJson(req, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "That request was too large.");
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "That request was not valid JSON."); }
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Fixed-window limiter. Enough to stop someone using Paul's shortcode to
 *  spam STK prompts at a stranger's handset, which is both abuse and a cost. */
const hits = new Map();
function limit(key, max, windowMs) {
  const now = Date.now();
  const slot = hits.get(key);
  if (!slot || now > slot.reset) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  if (slot.n >= max) return false;
  slot.n += 1;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 60_000).unref();

/* Kenyan mobile traffic sits behind carrier-grade NAT, so one IP can be
   thousands of unrelated buyers. The per-IP cap therefore only has to stop a
   script; the meaningful limit is per phone number, because that is what an
   STK push actually costs and abuses. Setting the IP cap tight enough to be
   interesting would block a whole Safaricom subnet. */
const IP_MAX = Number(process.env.RATE_IP_MAX || 240);
const PHONE_MAX = Number(process.env.RATE_PHONE_MAX || 5);
const RATE_WINDOW = Number(process.env.RATE_WINDOW_MS || 10 * 60_000);

const clientIp = (req) =>
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.socket.remoteAddress || "unknown";

/* ── routes ───────────────────────────────────────────────────────────── */

/** What the front end asks on load so it knows whether to run live or demo. */
function health(res) {
  json(res, 200, {
    ok: true,
    live: daraja.configured(),
    ebookReady: existsSync(EBOOK),
    shortcode: process.env.MPESA_SHORTCODE || null,
    payee: PAYEE,
    sessions: diary.SESSIONS,
    // The price list, so a front end never hard-codes a figure it might
    // charge differently. The server is the only place a price lives.
    catalogue: Object.fromEntries(
      Object.entries(CATALOGUE).map(([sku, v]) => [sku, { price: v.price, label: v.label, digital: v.digital }])
    ),
    meet: google.configured(),
    youtube: youtube.configured(),
    environment: /api\.safaricom\.co\.ke/.test(process.env.MPESA_BASE || "") ? "production"
      : /sandbox/.test(process.env.MPESA_BASE || "sandbox") ? "sandbox" : "emulator",
  });
}

async function checkout(req, res) {
  const ip = clientIp(req);
  if (!limit("ip:" + ip, IP_MAX, RATE_WINDOW)) throw new HttpError(429, "Too many attempts from this connection. Please wait a few minutes.");

  const body = await readJson(req);

  // A booking pays for a seat that is already held in this client's name.
  // The price comes from the held booking, not from anything they sent.
  let booking = null;
  if (body.bookingRef) {
    booking = diary.get(String(body.bookingRef).slice(0, 16));
    if (!booking) throw new HttpError(404, "We cannot find that held slot.");
    if (booking.status === "confirmed") throw new HttpError(409, "That session is already paid for.");
    if (booking.status !== "held") {
      throw new HttpError(410, "That slot was only held for a few minutes and the hold has lapsed. Please pick a time again — you have not been charged.");
    }
    if (diary.isTaken(booking.date, booking.time, booking.ref)) {
      throw new HttpError(409, "Someone confirmed that slot first. Please pick another — you have not been charged.");
    }
  }

  const items = booking
    ? [{ sku: "session:" + booking.type, qty: 1, price: booking.amount, label: booking.session, digital: false }]
    : normaliseItems(body);
  if (!items.length) throw new HttpError(400, "There was nothing to pay for.");

  const phone = daraja.msisdn(body.phone);
  if (!phone) throw new HttpError(400, "That does not look like a Kenyan mobile number. Use 07XX XXX XXX.");
  if (!limit("phone:" + phone, PHONE_MAX, RATE_WINDOW)) {
    throw new HttpError(429, "That number has had several prompts already. Please wait ten minutes.");
  }

  const name = String(body.name || "").trim().slice(0, 80);
  if (name.length < 2) throw new HttpError(400, "Please give us a name for the receipt.");
  const email = String(body.email || "").trim().slice(0, 160);
  const town = String(body.town || "").trim().slice(0, 80);

  const amount = items.reduce((t, i) => t + i.price * i.qty, 0);
  if (amount < 1) throw new HttpError(400, "That total cannot be charged.");
  const digital = items.some((i) => i.digital);
  const physical = !booking && items.some((i) => !i.digital);
  if (physical && !town) throw new HttpError(400, "We need a delivery town for a physical copy.");

  const order = store.create({
    items, amount, phone, name, email, town, digital, physical,
    bookingRef: booking?.ref || null,
    ip, userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
  });

  if (booking) {
    // Keep the seat alive while they are at the prompt, and put their name on
    // it now so a half-finished booking is still traceable to a person.
    diary.attachClient(booking.ref, { name, email, phone, note: String(body.note || "").slice(0, 600), orderId: order.id });
    diary.extendHold(booking.ref, 6);
  }

  // Demo mode: no credentials, so nothing is charged and nothing is claimed.
  if (!daraja.configured()) {
    store.update(order.id, { status: "demo" });
    return json(res, 200, {
      orderId: order.id, amount, digital, demo: true, payee: PAYEE,
      bookingRef: booking?.ref || null,
      message: "Demo mode — no M-Pesa credentials are configured, so no prompt was sent and no money moved.",
    });
  }

  try {
    const push = await daraja.stkPush({
      phone,
      amount,
      reference: order.id,
      description: digital && !physical ? "eBook" : "Book order",
      callbackUrl: PUBLIC_URL + "/api/mpesa/callback",
    });
    store.update(order.id, {
      checkoutRequestId: push.checkoutRequestId,
      merchantRequestId: push.merchantRequestId,
      pushedAt: new Date().toISOString(),
    });
    console.log("[checkout]", order.id, "KES", amount, "→", phone, "·", push.checkoutRequestId);
    return json(res, 200, {
      orderId: order.id, amount, digital, demo: false, payee: PAYEE,
      bookingRef: booking?.ref || null,
      message: push.customerMessage || "Check your phone and enter your M-Pesa PIN.",
    });
  } catch (err) {
    store.update(order.id, { status: "failed", error: err.message });
    throw new HttpError(err.status === 500 ? 500 : 502, err.message);
  }
}

function normaliseItems(body) {
  const raw = Array.isArray(body.items) && body.items.length
    ? body.items
    : [{ sku: body.variant, qty: 1 }];
  const out = [];
  for (const it of raw.slice(0, 10)) {
    const entry = CATALOGUE[String(it.sku || "").trim()];
    if (!entry) continue;
    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 20);
    out.push({ sku: it.sku, qty, price: entry.price, label: entry.label, digital: entry.digital });
  }
  return out;
}

/**
 * Safaricom's callback. It is unauthenticated by design, so this endpoint
 * trusts exactly one thing from the body — the CheckoutRequestID, which it
 * uses only to *look up* an order we ourselves created. The amount and the
 * receipt are read from Safaricom's own metadata, never from the client, and
 * the amount is checked against what we asked for.
 */
async function callback(req, res) {
  const body = await readJson(req, 64 * 1024);
  // Always 200: a non-200 makes Safaricom retry for hours.
  json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });

  const cb = body?.Body?.stkCallback;
  if (!cb) return console.warn("[callback] unrecognised payload", JSON.stringify(body).slice(0, 400));

  const order = store.byCheckoutId(cb.CheckoutRequestID);
  if (!order) return console.warn("[callback] no order for", cb.CheckoutRequestID);

  const { state, message } = daraja.readResult(cb.ResultCode, cb.ResultDesc);

  // Safaricom retries callbacks, so this has to be idempotent. But the
  // callback is also the authority on whether money moved: a genuine "paid"
  // is allowed to overturn a verdict we reached earlier without one. The
  // failure we must never have is a buyer who was debited and got nothing.
  if (order.status === "paid") return;
  if (order.status !== "pending" && state !== "paid") return;
  if (order.status !== "pending" && state === "paid") {
    console.warn("[callback]", order.id, "was marked", order.status, "— the callback says PAID, correcting");
  }

  if (state !== "paid") {
    store.update(order.id, { status: state, message, resultCode: cb.ResultCode });
    // Give the seat back immediately rather than making the next client wait
    // out a hold for a payment that already failed.
    if (order.bookingRef) diary.release(order.bookingRef, "payment " + state);
    return console.log("[callback]", order.id, state, "·", cb.ResultDesc);
  }

  const meta = Object.fromEntries(
    (cb.CallbackMetadata?.Item || []).map((i) => [i.Name, i.Value])
  );
  const paid = Number(meta.Amount || 0);
  if (Math.round(paid) !== Math.round(order.amount)) {
    store.update(order.id, {
      status: "underpaid", paidAmount: paid, receipt: meta.MpesaReceiptNumber || null,
      message: "We received KES " + paid + " against KES " + order.amount + ". We will call you.",
    });
    return console.error("[callback] AMOUNT MISMATCH", order.id, paid, "vs", order.amount);
  }

  store.update(order.id, {
    status: "paid",
    receipt: meta.MpesaReceiptNumber || null,
    paidAmount: paid,
    paidPhone: String(meta.PhoneNumber || order.phone),
    paidAt: new Date().toISOString(),
    message: "Payment received.",
  });
  if (order.digital) store.grantDownload(order.id);

  // Money and seat move together. This is the promise the whole booking flow
  // rests on: nobody is ever paid-up and seatless.
  if (order.bookingRef) {
    const b = diary.confirm(order.bookingRef, {
      receipt: meta.MpesaReceiptNumber || null,
      paidAmount: paid,
      orderId: order.id,
    });
    console.log("[booking]", order.bookingRef, "CONFIRMED", b?.date, b?.time);
    provisionMeeting(order.bookingRef).catch((e) => console.error("[meet]", e.message));
  }
  console.log("[callback]", order.id, "PAID", meta.MpesaReceiptNumber);

  sendPurchaseReceipt(store.get(order.id));
}

/** The browser polls this while the buyer is holding their phone. */
async function orderStatus(req, res, id) {
  const order = store.get(id);
  if (!order) throw new HttpError(404, "We cannot find that order.");

  // If the callback has not landed and the push is a few seconds old, ask
  // Safaricom directly rather than leaving the buyer watching a spinner.
  if (order.status === "pending" && order.checkoutRequestId &&
      Date.now() - new Date(order.pushedAt || order.createdAt).getTime() > 8000) {
    await reconcile(order).catch(() => {});
  }

  const o = store.get(id);
  json(res, 200, {
    orderId: o.id,
    status: o.status,
    message: o.message || null,
    receipt: o.receipt || null,
    amount: o.amount,
    digital: !!o.digital,
    physical: !!o.physical,
    town: o.town || null,
    downloadUrl: o.downloadToken ? PUBLIC_URL + "/api/download/" + o.downloadToken : null,
    filename: o.downloadToken ? EBOOK_NAME : null,
    booking: o.bookingRef ? publicBooking(diary.get(o.bookingRef)) : null,
  });
}

/** Asks Safaricom about one pending order and writes down the answer. */
async function reconcile(order) {
  const q = await daraja.stkQuery(order.checkoutRequestId);
  if (!q.ok || q.code === undefined || q.code === null) return;  // still ringing
  const { state, message } = daraja.readResult(q.code, q.desc);
  if (state === "paid") {
    // The query confirms payment but carries no receipt number; the callback
    // fills that in if it ever arrives.
    store.update(order.id, { status: "paid", message, paidAt: new Date().toISOString(), viaQuery: true });
    if (order.digital && !order.downloadToken) store.grantDownload(order.id);
    if (order.bookingRef) {
      diary.confirm(order.bookingRef, { orderId: order.id, paidAmount: order.amount });
      provisionMeeting(order.bookingRef).catch((e) => console.error("[meet]", e.message));
    }
    sendPurchaseReceipt(store.get(order.id));
  } else if (state !== "pending") {
    store.update(order.id, { status: state, message, resultCode: q.code });
    if (order.bookingRef) diary.release(order.bookingRef, "payment " + state);
  }
}

/**
 * Hands over the file. `Content-Disposition: attachment` is what makes the
 * browser drop it straight into the Downloads folder — on a laptop and on a
 * phone — rather than opening it in a tab.
 */
function download(res, token) {
  const check = store.redeem(token);
  if (!check.ok) throw new HttpError(403, check.reason);
  if (!existsSync(EBOOK)) {
    console.error("[download] EBOOK_PATH does not exist:", EBOOK);
    throw new HttpError(503, "The file is not available right now. Reply to your receipt and we will send it.");
  }

  const size = statSync(EBOOK).size;
  // RFC 5987 so the em dash and apostrophe in the title survive.
  const ascii = EBOOK_NAME.replace(/[^\x20-\x7e]/g, "-").replace(/"/g, "");
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Length": size,
    "Content-Disposition":
      'attachment; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(EBOOK_NAME),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  console.log("[download]", check.order.id, "copy", check.order.downloads + 1, "of", basename(EBOOK));
  createReadStream(EBOOK).pipe(res);
}

/* ── email ────────────────────────────────────────────────────────────── */

/**
 * Sends and never throws into a caller.
 *
 * Every message here goes out after money has already moved, so a bounced
 * receipt must not turn into a failed order. Failures are logged and that is
 * all — the client already has the same information on screen.
 */
async function mail(to, message, label) {
  if (!email.configured()) return { ok: false, skipped: "not configured" };
  try {
    const r = await email.send({ to, ...message });
    if (r.ok) console.log("[mail]", label, "→", to, r.id ? "(" + r.id + ")" : "");
    else console.log("[mail]", label, "skipped:", r.skipped);
    return r;
  } catch (err) {
    console.error("[mail]", label, "FAILED →", to, ":", err.message);
    return { ok: false, error: err.message };
  }
}

/** Receipt for a book or eBook. */
function sendPurchaseReceipt(order) {
  if (!order.email) return;
  // A session is not a product. Its confirmation already carries the amount,
  // the M-Pesa receipt and the invite — sending a second "your order" email
  // for the same payment is just noise in the client's inbox.
  if (order.bookingRef) return;
  const downloadUrl = order.downloadToken ? PUBLIC_URL + "/api/download/" + order.downloadToken : null;
  mail(order.email, tpl.purchaseReceipt(order, { downloadUrl, site: SITE_ID() }), "receipt " + order.id);
}

/**
 * Booking confirmation, with the invite attached.
 *
 * Deliberately sent even when Google has already emailed its own invite: this
 * one carries the M-Pesa receipt and the refund promise, which Google's does
 * not, and it is the thing a client keeps if they later feel uneasy.
 */
function sendBookingEmails(ref) {
  const b = diary.get(ref);
  if (!b || b.status !== "confirmed") return;
  // Once only. The Meet retry sweep calls back through here, and Safaricom
  // retries callbacks, so the guard is the stored flag rather than the path.
  if (b.confirmEmailAt) return;
  diary.attachMeeting(ref, { confirmEmailAt: new Date().toISOString() });
  const icsUrl = PUBLIC_URL + "/api/booking/" + b.ref + "/ics";
  const ics = diary.ics(b, { org: PAYEE.name, phone: PAYEE.phone, email: PAYEE.email, location: PAYEE.location });
  const attachments = [{ filename: "paul-chege-" + b.ref + ".ics", content: ics, contentType: "text/calendar" }];

  if (b.email) {
    mail(b.email, { ...tpl.bookingConfirmation(b, { site: SITE_ID(), icsUrl }), attachments }, "booking " + b.ref);
  }
  const desk = process.env.DESK_EMAIL;
  if (desk) mail(desk, { ...tpl.deskNotice(b, { site: SITE_ID() }), attachments }, "desk " + b.ref);
}

/* ── the diary ────────────────────────────────────────────────────────── */

/**
 * Gets a Meet link onto a confirmed booking.
 *
 * This runs *after* the money is already in, which dictates everything about
 * it: it can never throw into the payment path, it can never leave a booking
 * unconfirmed, and a Google outage must degrade to "Paul calls you" rather
 * than to a client who paid and was told nothing. Failures are recorded and
 * retried by the sweep; the client's page picks the link up whenever it
 * lands, because it is already polling.
 */
async function provisionMeeting(ref) {
  const b = diary.get(ref);
  if (!b || b.status !== "confirmed" || b.meetLink) return;

  if (!google.configured()) {
    diary.attachMeeting(ref, { meetState: "unavailable", meetReason: "Google Calendar is not connected" });
    sendBookingEmails(ref);
    return;
  }

  const attempts = (b.meetAttempts || 0) + 1;
  diary.attachMeeting(ref, { meetAttempts: attempts, meetState: "pending" });
  try {
    const m = await google.createMeeting(b, {
      organiserEmail: PAYEE.email, location: PAYEE.location, phone: PAYEE.phone,
    });
    diary.attachMeeting(ref, {
      meetLink: m.meetLink || null,
      meetEventId: m.eventId,
      meetEventLink: m.eventLink,
      meetDialIn: m.phone,
      meetState: m.meetLink ? "ready" : "unavailable",
      meetReason: m.meetLink ? null : "Google created the event but attached no conference",
    });
    console.log("[meet]", ref, m.meetLink || "(event created, no link)");
    sendBookingEmails(ref);
  } catch (err) {
    const fatal = err.status === 401 || err.status === 403 || /invalid_grant/.test(String(err.detail?.error || ""));
    diary.attachMeeting(ref, {
      meetState: fatal || attempts >= 6 ? "unavailable" : "pending",
      meetReason: err.message,
    });
    console.error("[meet]", ref, "attempt", attempts, "failed:", err.message);
    // A link may still arrive on a later sweep, but the client should not
    // wait on Google to hear from us. Send now; the reminder carries the
    // link if one turns up in the meantime.
    if (attempts >= 2 || diary.get(ref)?.meetState === "unavailable") sendBookingEmails(ref);
  }
}

/** What a client is allowed to see about their own booking. */
function publicBooking(b) {
  if (!b) return null;
  return {
    ref: b.ref, type: b.type, session: b.session, minutes: b.minutes,
    date: b.date, time: b.time, startsAt: b.startsAt,
    amount: b.amount, status: b.status,
    receipt: b.receipt || null,
    holdExpires: b.status === "held" ? b.holdExpires : null,
    icsUrl: b.status === "confirmed" ? PUBLIC_URL + "/api/booking/" + b.ref + "/ics" : null,
    meetLink: b.meetLink || null,
    // "pending" tells the page to keep waiting; "unavailable" tells it to
    // stop and show the phone fallback instead of a spinner forever.
    meetState: b.status === "confirmed" ? (b.meetState || "pending") : null,
    emailedTo: b.meetLink && b.email ? b.email : null,
  };
}

/** Takes a seat off the board for a few minutes, before any money is asked
 *  for. The client sees a countdown, which is both honest and the clearest
 *  possible signal that something real is happening on the other end. */
async function holdSlot(req, res) {
  if (!limit("hold:" + clientIp(req), IP_MAX, RATE_WINDOW)) {
    throw new HttpError(429, "Too many attempts. Please wait a few minutes.");
  }
  const body = await readJson(req);
  const { booking, error } = diary.hold({
    type: String(body.type || "free"),
    date: String(body.date || ""),
    time: String(body.time || ""),
  });
  if (error) throw new HttpError(409, error);
  console.log("[hold]", booking.ref, booking.type, booking.date, booking.time);
  json(res, 200, { booking: publicBooking(booking), payee: PAYEE, holdMinutes: Math.round((booking.holdExpires - Date.now()) / 60000) });
}

/** Free sessions cost nothing, so they confirm straight away. */
async function confirmFree(req, res) {
  const body = await readJson(req);
  const ref = String(body.bookingRef || "").slice(0, 16);
  const b = diary.get(ref);
  if (!b) throw new HttpError(404, "We cannot find that held slot.");
  if (b.status === "confirmed") return json(res, 200, { booking: publicBooking(b) });
  if (b.status !== "held") throw new HttpError(410, "That hold has lapsed. Please pick a time again.");
  if (b.amount > 0) throw new HttpError(402, "That session has to be paid for first.");

  const name = String(body.name || "").trim().slice(0, 80);
  if (name.length < 2) throw new HttpError(400, "Please give us a name.");
  const phone = daraja.msisdn(body.phone);
  if (!phone) throw new HttpError(400, "That does not look like a Kenyan mobile number.");

  diary.attachClient(ref, { name, phone, email: String(body.email || "").slice(0, 160), note: String(body.note || "").slice(0, 600) });
  const done = diary.confirm(ref);
  console.log("[booking]", ref, "CONFIRMED (free)", done.date, done.time);
  provisionMeeting(ref).catch((e) => console.error("[meet]", e.message));
  json(res, 200, { booking: publicBooking(diary.get(ref)) });
}

/** The calendar invite — the first thing a client holds after paying. */
function bookingIcs(res, ref) {
  const b = diary.get(ref);
  if (!b || b.status !== "confirmed") throw new HttpError(404, "No confirmed booking with that reference.");
  const body = diary.ics(b, { org: PAYEE.name, phone: PAYEE.phone, email: PAYEE.email, location: PAYEE.location });
  res.writeHead(200, {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Content-Disposition": 'attachment; filename="paul-chege-' + b.ref + '.ics"',
    "Cache-Control": "no-store",
  });
  res.end(body);
}

/* ── episodes ─────────────────────────────────────────────────────────────
   The channel's own episodes. Titles and categories are editorial and live
   here; the numbers come from YouTube, so nothing on the page can drift out
   of date the way a hardcoded "19K views" does.
   ──────────────────────────────────────────────────────────────────────── */
const EPISODES = [
  { id: "xApF-msZJ6M", cat: "investing", title: "Why Promitto Is Selling Shares (Bank + Mortgage Plan): Smart or Risky?", len: "13:56", views: "19K", age: "11mo ago" },
  { id: "atqQnaseJ3c", cat: "business",  title: "Married 11 times, auctioned 5 times, and 10 failed businesses", len: "55:31", views: "4.4K", age: "8mo ago" },
  { id: "rFvz1p1AhBI", cat: "investing", title: "Kenya Pipeline Company IPO: What to know before investing", len: "38:22", views: "3.5K", age: "8mo ago" },
  { id: "Kl-BNPd2Ksg", cat: "business",  title: "CEO Podcast · Episode 1: From hawker to millionaire entrepreneur", len: "51:51", views: "2.3K", age: "10mo ago" },
  { id: "Daq2pcruXZg", cat: "kikuyu",    title: "EP01 · Ndukagure lorii ya FRR na ũrimũ nĩũgũtahwo", len: "28:05", views: "1.9K", age: "1y ago" },
  { id: "7FFJKnwpEpo", cat: "investing", title: "NCBA Shares Are Skyrocketing — The Truth Behind the Hype", len: "10:59", views: "1.7K", age: "11mo ago" },
  { id: "gJXa44cpn_o", cat: "banking",   title: "Mobile Banking Nightmare: Is Your Money Safe?", len: "40:27", views: "1K", age: "4mo ago" },
  { id: "JlPbNG8olcM", cat: "banking",   title: "Grace Period or Debt Trap? The Hidden Cost That Can Sink You", len: "23:00", views: "698", age: "8mo ago" },
  { id: "5koeXz9-R8I", cat: "insurance", title: "The health cover that pays YOU the cash instead of the hospital", len: "45:15", views: "418", age: "10mo ago" },
];

/**
 * Episodes with live numbers where YouTube answers, and the last known
 * numbers where it does not.
 *
 * A dead API must never blank the section: the titles are ours, and a stale
 * view count is worth far more to a reader than an empty card. So failure
 * here is logged and the baked figures are served instead.
 */
async function episodes(res, sort) {
  let live = {}, source = "baked", error = null;
  if (youtube.configured()) {
    try {
      live = await youtube.stats(EPISODES.map((e) => e.id));
      source = "youtube";
    } catch (err) {
      error = err.message;
      console.error("[youtube]", err.message);
    }
  }

  const items = EPISODES.map((e) => {
    const s = live[e.id];
    return {
      ...e,
      views: s?.views ?? e.views,
      len: s?.len ?? e.len,
      age: s?.age ?? e.age,
      viewCount: s?.viewCount ?? null,
      live: !!s,
    };
  });

  // Most-watched first when YouTube gave us real numbers to sort by.
  if (sort !== "editorial" && items.some((i) => i.viewCount !== null)) {
    items.sort((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1));
  }

  json(res, 200, {
    items, source, error,
    cacheAgeSeconds: youtube.cacheAge(),
    channel: process.env.YOUTUBE_CHANNEL_URL || "https://www.youtube.com/@paulchege91",
  });
}

/* ── the site itself ──────────────────────────────────────────────────────
   Serving the built site from the same process is what makes the payment
   API same-origin. That removes the whole class of "it says demo mode"
   confusion: one command serves the pages and the API together, there is no
   URL to configure, and no CORS to get wrong.
   ──────────────────────────────────────────────────────────────────────── */

const SITE_DIR = resolve(process.env.SITE_DIR || new URL("../dist", import.meta.url).pathname);
const SERVE_SITE = process.env.SERVE_SITE !== "0" && existsSync(SITE_DIR);

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ico": "image/x-icon",
  ".pdf": "application/pdf", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".webmanifest": "application/manifest+json",
};

/** Resolves a URL path to a file inside SITE_DIR, or null. */
function resolveStatic(urlPath) {
  // normalize() collapses ".." before we ever touch the filesystem; the
  // realpath check below is the belt to that braces.
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = extname(clean)
    ? [join(SITE_DIR, clean)]
    : [join(SITE_DIR, clean, "index.html"), join(SITE_DIR, clean + ".html")];

  for (const c of candidates) {
    try {
      if (!existsSync(c) || !statSync(c).isFile()) continue;
      // Never serve anything that resolves outside the site directory.
      if (!realpathSync(c).startsWith(realpathSync(SITE_DIR))) continue;
      return c;
    } catch { /* unreadable — try the next candidate */ }
  }
  return null;
}

function serveStatic(req, res, urlPath) {
  const exact = resolveStatic(urlPath);

  // Prerendered folders win when they exist — they carry the right title,
  // canonical and content. Otherwise any extensionless path is a client
  // route and gets the app shell, so the site works before (and without) a
  // prerender pass. A path with an extension that is missing is a genuine
  // 404 for a file, not a route.
  const looksLikeRoute = !extname(urlPath);
  const file = exact || (looksLikeRoute ? resolveStatic("/index.html") : null) || resolveStatic("/404.html");
  if (!file) return false;

  const ext = extname(file).toLowerCase();
  const stat = statSync(file);

  /* Only a content-hashed filename may be cached hard. Anything else
     revalidates — cheap, because the answer is almost always a 304. Caching
     an unhashed bundle by age serves new HTML against old JavaScript for as
     long as the age lasts, which is exactly the kind of bug that looks like
     the code never changed. */
  const hashed = /-[0-9a-zA-Z_-]{8,}\.(js|css|woff2?|png|jpe?g|webp|svg)$/i.test(basename(file));
  const lastModified = stat.mtime.toUTCString();

  const since = req.headers["if-modified-since"];
  if (!hashed && since && Date.parse(since) >= Math.floor(stat.mtimeMs / 1000) * 1000) {
    res.writeHead(304, { "Cache-Control": "no-cache", "Last-Modified": lastModified });
    return res.end(), true;
  }

  res.writeHead(exact || looksLikeRoute ? 200 : 404, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    "Last-Modified": lastModified,
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") return res.end(), true;
  createReadStream(file).pipe(res);
  return true;
}

/* ── wiring ───────────────────────────────────────────────────────────── */

const server = createServer(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, "http://x");
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    // `/` is the website. It only falls through to health when there is no
    // built site to serve — otherwise the homepage returns JSON.
    if (req.method === "GET" && path === "/api/health") return health(res);
    if (req.method === "GET" && path === "/" && !SERVE_SITE) return health(res);
    if (req.method === "POST" && path === "/api/checkout") return await checkout(req, res);
    if (req.method === "POST" && path === "/api/mpesa/callback") return await callback(req, res);

    const order = path.match(/^\/api\/order\/([A-Za-z0-9]{1,32})$/);
    if (req.method === "GET" && order) return await orderStatus(req, res, order[1]);

    if (req.method === "GET" && path === "/api/episodes") {
      return await episodes(res, url.searchParams.get("sort"));
    }

    if (req.method === "GET" && path === "/api/slots") {
      return json(res, 200, { days: diary.availability(), sessions: diary.SESSIONS, payee: PAYEE });
    }
    // Reminders normally fire on a five-minute tick. This lets a test drive
    // that clock directly; it is refused unless explicitly enabled.
    if (req.method === "POST" && path === "/api/_reminders/run") {
      if (process.env.ALLOW_TEST_HOOKS !== "1") throw new HttpError(404, "No such endpoint.");
      const body = await readJson(req);
      const sent = await runReminders(body.now ? Number(body.now) : Date.now());
      return json(res, 200, { sent });
    }

    if (req.method === "POST" && path === "/api/booking/hold") return await holdSlot(req, res);
    if (req.method === "POST" && path === "/api/booking/confirm") return await confirmFree(req, res);

    const bIcs = path.match(/^\/api\/booking\/([A-Za-z0-9]{1,16})\/ics$/);
    if (req.method === "GET" && bIcs) return bookingIcs(res, bIcs[1]);

    const bRef = path.match(/^\/api\/booking\/([A-Za-z0-9]{1,16})$/);
    if (req.method === "GET" && bRef) {
      const b = publicBooking(diary.get(bRef[1]));
      if (!b) throw new HttpError(404, "We cannot find that booking.");
      return json(res, 200, { booking: b });
    }

    const dl = path.match(/^\/api\/download\/([A-Za-z0-9_-]{1,128})$/);
    if (req.method === "GET" && dl) return download(res, dl[1]);

    // Anything that is not an API call is the website.
    if (SERVE_SITE && (req.method === "GET" || req.method === "HEAD") && !path.startsWith("/api/")) {
      if (serveStatic(req, res, url.pathname)) return;
    }

    throw new HttpError(404, "No such endpoint.");
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[error]", req.method, path, err);
    if (!res.headersSent) json(res, status, { error: err.message || "Something went wrong." });
  }
});

/** Sweep: catches orders whose callback never arrived at all. */
setInterval(async () => {
  if (!daraja.configured()) return;
  for (const o of store.stale(45_000).slice(0, 20)) {
    // Give up on anything older than 10 minutes — Safaricom has by then too.
    if (Date.now() - new Date(o.createdAt).getTime() > 10 * 60_000) {
      store.update(o.id, { status: "timeout", message: "The prompt expired without a response." });
      continue;
    }
    await reconcile(o).catch((e) => console.error("[sweep]", o.id, e.message));
  }
}, 30_000).unref();

/**
 * Reminders — 24 hours out, then an hour before.
 *
 * The tick is every five minutes against a twenty-minute window, so a
 * restart or a missed tick still catches the session; the stored flag is
 * what stops a second send. Nothing fires for a session already under way,
 * because a "starts in an hour" arriving afterwards reads as incompetence.
 */
const REMINDERS = [
  { kind: "24h", leadMs: 24 * 3600_000 },
  { kind: "1h", leadMs: 3600_000 },
];

async function runReminders(now = Date.now()) {
  if (!email.configured()) return 0;
  let sent = 0;
  for (const { kind, leadMs } of REMINDERS) {
    for (const b of diary.dueForReminder(kind, { leadMs, now }).slice(0, 25)) {
      // Claim it before sending: if the send is slow and another tick lands,
      // the flag is already down and the client gets one email, not two.
      diary.markReminded(b.ref, kind, "sending");
      const r = await mail(b.email, tpl.reminder(b, { site: SITE_ID(), kind }), kind + " reminder " + b.ref);
      diary.markReminded(b.ref, kind, r.ok ? (r.id || "sent") : "failed: " + (r.error || r.skipped));
      if (r.ok) sent += 1;
    }
  }
  return sent;
}

setInterval(() => { runReminders().catch((e) => console.error("[reminders]", e.message)); }, 5 * 60_000).unref();

/* Meet links that did not come through first time. A paid client is already
   confirmed either way; this only upgrades them from a phone call to a link. */
setInterval(async () => {
  if (!google.configured()) return;
  for (const b of diary.awaitingMeeting().slice(0, 5)) {
    await provisionMeeting(b.ref).catch(() => {});
  }
}, 60_000).unref();

server.listen(PORT, () => {
  const live = daraja.configured();
  console.log("┌─ Paul Chege payments · :" + PORT);
  console.log("│  mode      " + (live ? "LIVE — " + (process.env.MPESA_BASE || "sandbox.safaricom.co.ke") : "DEMO (no credentials; nothing is charged)"));
  console.log("│  callback  " + PUBLIC_URL + "/api/mpesa/callback");
  console.log("│  ebook     " + (existsSync(EBOOK) ? EBOOK : "MISSING → " + EBOOK));
  console.log("│  site      " + (SERVE_SITE ? "http://localhost:" + PORT + "  (same origin — no config needed)" : "not served; run `npm run build` first"));
  console.log("└─ origins   " + ORIGINS.join(", "));
});

export { server };
