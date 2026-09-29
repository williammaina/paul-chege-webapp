/**
 * The diary.
 *
 * Two things matter here and nothing else does:
 *
 *   1. A slot that has been taken must never be sold twice. The old site
 *      showed a pretty diary that knew nothing — two people could pay for the
 *      same 10:00 on Wednesday, and one of them was going to be told later
 *      that actually, no.
 *
 *   2. Money and the seat must move together. A client pays KES 5,000 to a
 *      phone number they have never dealt with. The seat is therefore held
 *      BEFORE the prompt goes out, and confirmed the instant Safaricom says
 *      the money moved. There is no window in which someone has paid and
 *      holds nothing.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const FILE = resolve(process.env.BOOKING_STORE || new URL("./data/bookings.json", import.meta.url).pathname);

/** EAT. Safaricom, the client and Paul are all in +03:00; the server may not be. */
const TZ_OFFSET = 3;
const SLOT_TIMES = (process.env.SLOT_TIMES || "10:00,11:30,14:00,15:30").split(",").map((s) => s.trim());
const HOLD_MINUTES = Number(process.env.HOLD_MINUTES || 10);
const LEAD_HOURS = Number(process.env.BOOKING_LEAD_HOURS || 12);   // no same-hour bookings
const DAYS_AHEAD = Number(process.env.BOOKING_DAYS || 12);

export const SESSIONS = {
  free: { key: "free", label: "30-minute insurance review", minutes: 30, price: 0,
          blurb: "A look at what you are covered for and what you are not." },
  paid: { key: "paid", label: "60-minute smart borrowing coaching", minutes: 60, price: 5000,
          blurb: "Your offer letter, your restructure, your exit plan." },
};

let db = load();
let writing = Promise.resolve();

function load() {
  try { return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) || {}) : {}; }
  catch (e) { console.error("[bookings] unreadable, starting empty:", e.message); return {}; }
}
function persist() {
  writing = writing.then(() => {
    try {
      mkdirSync(dirname(FILE), { recursive: true });
      const tmp = FILE + "." + process.pid + ".tmp";
      writeFileSync(tmp, JSON.stringify(db, null, 2));
      renameSync(tmp, FILE);
    } catch (e) { console.error("[bookings] could not persist:", e.message); }
  });
  return writing;
}

/** "2026-10-01" + "10:00" → a real instant, read as East Africa Time. */
export function instantOf(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - TZ_OFFSET, mm, 0));
}

const ymd = (dt) => {
  const eat = new Date(dt.getTime() + TZ_OFFSET * 3600 * 1000);
  return eat.toISOString().slice(0, 10);
};

/** A held-but-unpaid seat blocks the slot only while the hold is alive. */
const holdAlive = (b) => b.status === "held" && Date.now() < (b.holdExpires || 0);
const occupies = (b) => b.status === "confirmed" || holdAlive(b);

export function isTaken(date, time, exceptRef) {
  return Object.values(db).some(
    (b) => b.date === date && b.time === time && b.ref !== exceptRef && occupies(b)
  );
}

/**
 * The real diary: weekdays only, honouring the lead time, with anything
 * already taken marked as such. The client sees the truth, which is the whole
 * point — a diary that always says yes is a diary nobody believes.
 */
export function availability(days = DAYS_AHEAD) {
  const out = [];
  const cursor = new Date();
  const earliest = Date.now() + LEAD_HOURS * 3600 * 1000;

  while (out.length < days) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const eat = new Date(cursor.getTime() + TZ_OFFSET * 3600 * 1000);
    const wd = eat.getUTCDay();
    if (wd === 0 || wd === 6) continue;          // Mon–Fri, as the office runs
    const date = ymd(cursor);
    const slots = SLOT_TIMES.map((time) => {
      const at = instantOf(date, time);
      return {
        time,
        available: at.getTime() >= earliest && !isTaken(date, time),
        past: at.getTime() < earliest,
      };
    });
    out.push({ date, weekday: eat.toUTCString().slice(0, 3), slots, open: slots.some((s) => s.available) });
  }
  return out;
}

const makeRef = () => "PCS" + randomBytes(3).toString("hex").toUpperCase();

/**
 * Takes the seat off the board before any money is asked for. If the hold
 * lapses unpaid, the seat comes back by itself — nothing has to clean up.
 */
export function hold({ type, date, time }) {
  const session = SESSIONS[type];
  if (!session) return { error: "That is not a session we offer." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !SLOT_TIMES.includes(time)) {
    return { error: "That is not a slot in the diary." };
  }

  const at = instantOf(date, time);
  if (!Number.isFinite(at.getTime())) return { error: "That is not a real date." };
  if (at.getTime() < Date.now() + LEAD_HOURS * 3600 * 1000) {
    return { error: "That time is too soon. Please pick a slot at least " + LEAD_HOURS + " hours out." };
  }
  const wd = new Date(at.getTime() + TZ_OFFSET * 3600 * 1000).getUTCDay();
  if (wd === 0 || wd === 6) return { error: "Paul takes sessions Monday to Friday." };
  if (isTaken(date, time)) return { error: "Someone took that slot a moment ago. Please pick another." };

  const ref = makeRef();
  db[ref] = {
    ref, type, date, time,
    startsAt: at.toISOString(),
    minutes: session.minutes,
    session: session.label,
    amount: session.price,
    status: "held",
    holdExpires: Date.now() + HOLD_MINUTES * 60_000,
    createdAt: new Date().toISOString(),
  };
  persist();
  return { booking: db[ref] };
}

export function get(ref) {
  const b = db[ref];
  if (!b) return null;
  // A lapsed hold is reported as lapsed rather than quietly looking alive.
  if (b.status === "held" && !holdAlive(b)) return { ...b, status: "lapsed" };
  return b;
}

export function attachClient(ref, client) {
  if (!db[ref]) return null;
  db[ref] = { ...db[ref], ...client };
  persist();
  return db[ref];
}

/** Extends a hold while the client is actually at the M-Pesa prompt. */
export function extendHold(ref, minutes = 5) {
  const b = db[ref];
  if (!b || b.status !== "held") return null;
  b.holdExpires = Math.max(b.holdExpires, Date.now() + minutes * 60_000);
  persist();
  return b;
}

/** The seat is theirs. Called for a free booking, or on a paid callback. */
export function confirm(ref, payment = {}) {
  const b = db[ref];
  if (!b) return null;
  if (b.status === "confirmed") return b;            // idempotent: callbacks retry
  db[ref] = {
    ...b, ...payment,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    holdExpires: null,
  };
  persist();
  return db[ref];
}

/**
 * A payment that failed is not an abandoned seat.
 *
 * The client is standing there with their phone, having just been told their
 * slot is held — they mistyped a PIN, or cancelled by accident, and they are
 * about to try again. Snatching the seat away at that moment, while still
 * showing them a countdown, is the precise thing that makes an honest
 * business feel like a scam.
 *
 * So a live hold survives a failed payment and can be retried. The hold's own
 * deadline is what frees the seat, which it does by itself: `occupies()` stops
 * counting a lapsed hold, so no cleanup job is needed and no seat is squatted
 * for longer than the client was promised.
 */
export function release(ref, reason) {
  const b = db[ref];
  if (!b || b.status === "confirmed") return null;
  if (holdAlive(b)) {
    db[ref] = { ...b, lastFailure: reason, failedAt: new Date().toISOString() };
    persist();
    return db[ref];                       // still held, and still theirs
  }
  db[ref] = { ...b, status: "released", reason, releasedAt: new Date().toISOString() };
  persist();
  return db[ref];
}

export function cancel(ref, reason) {
  const b = db[ref];
  if (!b) return null;
  db[ref] = { ...b, status: "cancelled", reason, cancelledAt: new Date().toISOString(), holdExpires: null };
  persist();
  return db[ref];
}

/** Records the outcome of trying to create the Meet link. */
export function attachMeeting(ref, patch) {
  if (!db[ref]) return null;
  db[ref] = { ...db[ref], ...patch };
  persist();
  return db[ref];
}

/** Confirmed sessions still owed a Meet link — the retry queue's input. */
export function awaitingMeeting() {
  return Object.values(db).filter(
    (b) => b.status === "confirmed" && !b.meetLink && (b.meetAttempts || 0) < 6 && b.meetState !== "unavailable"
  );
}

/**
 * Sessions due a reminder.
 *
 * Idempotency lives in the stored flag, not in the schedule: a restart, a
 * second worker, or a tick that runs twice must never send the same reminder
 * again. `lateBy` bounds how far back we look, so a server that was down over
 * a window does not fire a "starts in an hour" for a session that ended
 * yesterday.
 */
export function dueForReminder(kind, { leadMs, windowMs = 20 * 60_000, now = Date.now() }) {
  const flag = kind === "24h" ? "remind24At" : "remind1At";
  return Object.values(db).filter((b) => {
    if (b.status !== "confirmed" || !b.email || b[flag]) return false;
    const until = new Date(b.startsAt).getTime() - now;
    return until <= leadMs && until > leadMs - windowMs && until > 0;
  });
}

export function markReminded(ref, kind, info) {
  const flag = kind === "24h" ? "remind24At" : "remind1At";
  if (!db[ref]) return null;
  db[ref] = { ...db[ref], [flag]: new Date().toISOString(), [flag + "Info"]: info || null };
  persist();
  return db[ref];
}

export function all() { return Object.values(db); }

/**
 * The calendar invite. It is the first tangible thing a client holds after
 * paying, so it carries the reference, the money, and the phone number to
 * ring — everything they would need if they later thought they had been had.
 */
export function ics(b, { org, phone, email, location }) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(new Date(b.startsAt).getTime() + b.minutes * 60_000);
  const esc = (t) => String(t || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

  const description = [
    b.session + " with Paul Chege.",
    "",
    ...(b.meetLink ? ["Join here: " + b.meetLink, ""] : []),
    "Booking reference: " + b.ref,
    b.amount ? "Paid: KES " + b.amount.toLocaleString("en-KE") + (b.receipt ? " · M-Pesa " + b.receipt : "") : "No charge.",
    "",
    "If anything is wrong, call " + phone + " and quote " + b.ref + ".",
    b.note ? "\nYour brief: " + b.note : "",
  ].join("\n");

  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Paul Chege Consultancy TV//Booking//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + b.ref + "@paulchege.co.ke",
    "DTSTAMP:" + stamp(Date.now()),
    "DTSTART:" + stamp(b.startsAt),
    "DTEND:" + stamp(end),
    "SUMMARY:" + esc(b.session + " — Paul Chege"),
    "DESCRIPTION:" + esc(description),
    "LOCATION:" + esc(b.meetLink || location),
    ...(b.meetLink ? ["URL:" + b.meetLink, "X-GOOGLE-CONFERENCE:" + b.meetLink] : []),
    "ORGANIZER;CN=" + esc(org) + ":mailto:" + email,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY",
    "DESCRIPTION:" + esc(b.session + " with Paul Chege in one hour"),
    "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
