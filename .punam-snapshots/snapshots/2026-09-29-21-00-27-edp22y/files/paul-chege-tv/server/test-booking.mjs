/**
 * End-to-end proof of the paid booking flow.
 *
 * The property being tested throughout: a client is never paid-up and
 * seatless, and a seat is never sold twice.
 *
 * Run the server with a short hold so section 5 does not take ten minutes:
 *
 *   HOLD_MINUTES=0.5 node server/index.mjs
 *   node server/test-booking.mjs
 *
 * Each section takes a fresh hold, so 30 seconds is ample for the rest.
 */
const HOLD_WAIT_MS = Number(process.env.HOLD_WAIT_MS || 33000);

/* Each buyer needs their own number: the per-phone limiter is real, and
   reusing one across a suite is the test tripping a protection that exists
   precisely to stop that. */
let phoneSeq = 0;
const freshPhone = () => "07" + String(20000000 + (phoneSeq++) + Date.now() % 1000).slice(0, 8);
const API = process.env.API || "http://localhost:4300";
const MOCK = process.env.MOCK || "http://localhost:4400";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n); } else { fail++; console.log("  \x1b[31m✗\x1b[0m " + n + (d ? "  → " + d : "")); } };
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const get = (u) => fetch(u, { cache: "no-store" }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})), res: r }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ring = async () => (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
async function settle(id, t = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    const { body } = await get(API + "/api/order/" + id);
    if (body.status && body.status !== "pending") return body;
    await sleep(400);
  }
  return { status: "gave-up" };
}

console.log("\n\x1b[1mPaid booking end-to-end\x1b[0m\n");

const slots = (await get(API + "/api/slots")).body;
const openDay = slots.days.find((d) => d.open);
const freeSlot = openDay.slots.find((s) => s.available);

/* ── 1 · the diary tells the truth ── */
console.log("\x1b[1m1 · the diary\x1b[0m");
{
  ok("it offers weekdays only", slots.days.every((d) => !["Sat", "Sun"].includes(d.weekday)),
     slots.days.map((d) => d.weekday).join(","));
  ok("nothing is offered inside the lead time", slots.days[0].slots.every((s) => !s.past || !s.available));
  ok("it names who the client will be paying", !!slots.payee?.name, JSON.stringify(slots.payee));
}

/* ── 2 · the seat is taken BEFORE any money is asked for ── */
console.log("\n\x1b[1m2 · hold first, pay second\x1b[0m");
{
  const h = await post(API + "/api/booking/hold", { type: "paid", date: openDay.date, time: freeSlot.time });
  ok("the slot is held", h.body.booking?.status === "held", JSON.stringify(h.body).slice(0, 120));
  ok("the hold has a visible deadline", h.body.booking.holdExpires > Date.now());
  ok("the price comes from the server", h.body.booking.amount === 5000, String(h.body.booking.amount));
  ok("the payee is named before payment", !!h.body.payee?.name);

  const after = (await get(API + "/api/slots")).body.days.find((d) => d.date === openDay.date);
  ok("the held slot disappears from the diary for everyone else",
     after.slots.find((s) => s.time === freeSlot.time)?.available === false);

  const clash = await post(API + "/api/booking/hold", { type: "paid", date: openDay.date, time: freeSlot.time });
  ok("a second person cannot hold the same slot", clash.status === 409, clash.status + " " + JSON.stringify(clash.body));

  globalThis.__held = h.body.booking;
}

/* ── 3 · paying confirms the seat, atomically ── */
console.log("\n\x1b[1m3 · money and seat move together\x1b[0m");
{
  const b = globalThis.__held;
  const co = await post(API + "/api/checkout", { bookingRef: b.ref, phone: freshPhone(), name: "Grace Muthoni", email: "g@example.com", note: "Top-up offer to review" });
  ok("checkout is accepted against the hold", co.status === 200, JSON.stringify(co.body).slice(0, 140));
  ok("it charges the session price, not the client's", co.body.amount === 5000, String(co.body.amount));

  const mid = (await get(API + "/api/booking/" + b.ref)).body.booking;
  ok("before the PIN the seat is still only held, not confirmed", mid.status === "held", mid.status);

  const live = await ring();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(co.body.orderId);
  ok("the payment lands", done.status === "paid", done.status);
  ok("the booking is confirmed in the same breath", done.booking?.status === "confirmed", JSON.stringify(done.booking));
  ok("the client is given a reference", /^PCS[0-9A-F]{6}$/.test(done.booking.ref), done.booking.ref);
  ok("…and the M-Pesa receipt", !!done.receipt, done.receipt);
  ok("…and a calendar invite", !!done.booking.icsUrl);

  const ics = await fetch(done.booking.icsUrl);
  const text = await ics.text();
  ok("the invite downloads", ics.status === 200);
  ok("…as a calendar file", /text\/calendar/.test(ics.headers.get("content-type") || ""));
  ok("…as an attachment", /^attachment/.test(ics.headers.get("content-disposition") || ""));
  ok("…and is valid iCalendar", text.startsWith("BEGIN:VCALENDAR") && text.trim().endsWith("END:VCALENDAR"));
  ok("…carrying the reference so it can be quoted later", text.includes(done.booking.ref));
  ok("…and a phone number to ring", /call \+?254/i.test(text), text.split("\r\n").find((l) => l.startsWith("DESCRIPTION")));
  ok("…at the right time", text.includes("DTSTART:" + new Date(done.booking.startsAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")));

  const board = (await get(API + "/api/slots")).body.days.find((d) => d.date === openDay.date);
  ok("the seat stays off the board permanently", board.slots.find((s) => s.time === done.booking.time)?.available === false);
  globalThis.__confirmed = done.booking;
}

/* ── 4 · a failed payment gives the seat straight back ── */
console.log("\n\x1b[1m4 · a failed payment must not squat on a slot\x1b[0m");
{
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type: "paid", date: day.date, time: s.time });
  const co = await post(API + "/api/checkout", { bookingRef: h.body.booking.ref, phone: freshPhone(), name: "Peter Otieno", email: "p@example.com" });
  const live = await ring();
  await post(MOCK + "/pin/cancel", { checkoutRequestId: live.checkoutRequestId });
  await settle(co.body.orderId);
  await sleep(500);

  const b = (await get(API + "/api/booking/" + h.body.booking.ref)).body.booking;
  // The client is still standing there about to retry, so the seat stays
  // theirs for the rest of the hold — but only for the rest of the hold.
  ok("a live hold survives a cancelled payment, so the client can retry", b.status === "held", b.status);
  ok("…and is not confirmed", b.status !== "confirmed");

  const retry = await post(API + "/api/checkout", { bookingRef: h.body.booking.ref, phone: freshPhone(), name: "Peter Otieno", email: "p@example.com" });
  ok("retrying the prompt works", retry.status === 200, retry.status + " " + JSON.stringify(retry.body));
  const live2 = await ring();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live2.checkoutRequestId });
  const done2 = await settle(retry.body.orderId);
  ok("…and the second attempt confirms the same seat", done2.booking?.ref === h.body.booking.ref && done2.booking.status === "confirmed",
     JSON.stringify(done2.booking));
}

/* ── 5 · a lapsed hold frees the seat by itself ── */
console.log("\n\x1b[1m5 · an abandoned hold\x1b[0m");
{
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type: "paid", date: day.date, time: s.time });
  ok("held", h.body.booking.status === "held");
  // HOLD_MINUTES is set to a fraction of a minute for this run.
  console.log("     (waiting " + Math.round(HOLD_WAIT_MS / 1000) + "s for the hold to lapse)");
  await sleep(HOLD_WAIT_MS);
  const b = (await get(API + "/api/booking/" + h.body.booking.ref)).body.booking;
  ok("an abandoned hold reports itself lapsed", b.status === "lapsed", b.status);
  const day2 = (await get(API + "/api/slots")).body.days.find((d) => d.date === day.date);
  ok("…and the seat is bookable again with no cleanup job", day2.slots.find((x) => x.time === s.time)?.available === true);

  const late = await post(API + "/api/checkout", { bookingRef: h.body.booking.ref, phone: freshPhone(), name: "Late Larry", email: "l@e.com" });
  ok("paying against a lapsed hold is refused, not charged", late.status === 410, late.status + " " + JSON.stringify(late.body));
  ok("…and the refusal says no money was taken", /not been charged/i.test(late.body.error || ""), late.body.error);
}

/* ── 6 · the free session needs no money ── */
console.log("\n\x1b[1m6 · the free review\x1b[0m");
{
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type: "free", date: day.date, time: s.time });
  ok("a free slot holds at zero", h.body.booking.amount === 0);
  const c = await post(API + "/api/booking/confirm", { bookingRef: h.body.booking.ref, name: "Mary Njeri", phone: "0733222111", email: "m@e.com" });
  ok("it confirms with no payment at all", c.body.booking?.status === "confirmed", JSON.stringify(c.body).slice(0, 120));
  ok("…and still produces a calendar invite", !!c.body.booking.icsUrl);
}

/* ── 7 · abuse ── */
console.log("\n\x1b[1m7 · abuse\x1b[0m");
{
  const weekend = await post(API + "/api/booking/hold", { type: "paid", date: "2026-10-03", time: "10:00" });
  ok("a Saturday is refused", weekend.status === 409, weekend.status);

  const past = await post(API + "/api/booking/hold", { type: "paid", date: "2020-01-01", time: "10:00" });
  ok("a date in the past is refused", past.status === 409, past.status);

  const odd = await post(API + "/api/booking/hold", { type: "paid", date: (await get(API + "/api/slots")).body.days[3].date, time: "03:00" });
  ok("a time outside the diary is refused", odd.status === 409, odd.status);

  const fakeType = await post(API + "/api/booking/hold", { type: "freebie", date: (await get(API + "/api/slots")).body.days[3].date, time: "10:00" });
  ok("an invented session type is refused", fakeType.status === 409, fakeType.status);

  const paidAsFree = await post(API + "/api/booking/hold", { type: "paid", date: (await get(API + "/api/slots")).body.days[4].date, time: "10:00" });
  const cheat = await post(API + "/api/booking/confirm", { bookingRef: paidAsFree.body.booking.ref, name: "Cheeky Charlie", phone: "0711000111" });
  ok("a paid session cannot be confirmed through the free route", cheat.status === 402, cheat.status + " " + JSON.stringify(cheat.body));

  const twice = await post(API + "/api/checkout", { bookingRef: globalThis.__confirmed.ref, phone: freshPhone(), name: "Double Dave", email: "d@e.com" });
  ok("an already-paid session cannot be charged twice", twice.status === 409, twice.status + " " + JSON.stringify(twice.body));

  const ghost = await post(API + "/api/checkout", { bookingRef: "PCSZZZZZZ", phone: freshPhone(), name: "Ghost", email: "g@e.com" });
  ok("a made-up reference is refused", ghost.status === 404, ghost.status);

  const noIcs = await fetch(API + "/api/booking/PCSZZZZZZ/ics");
  ok("no invite for a booking that does not exist", noIcs.status === 404, noIcs.status);
}

console.log("\n" + "─".repeat(58));
console.log(pass + " passed · " + fail + " failed\n");
process.exit(fail ? 1 : 0);
