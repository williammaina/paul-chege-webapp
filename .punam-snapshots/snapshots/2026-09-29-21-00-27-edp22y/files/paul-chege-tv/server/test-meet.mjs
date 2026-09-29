/**
 * Google Meet provisioning.
 *
 * The property under test: **a Google failure never costs a paid booking.**
 * Everything here is about what happens after the money is already in.
 *
 *   node server/mock-daraja.mjs &
 *   node server/mock-google.mjs &
 *   GOOGLE_CLIENT_ID=x GOOGLE_CLIENT_SECRET=y GOOGLE_REFRESH_TOKEN=z \
 *   GOOGLE_OAUTH_BASE=http://localhost:4500 \
 *   GOOGLE_CALENDAR_BASE=http://localhost:4500/calendar/v3 \
 *   ... node server/index.mjs &
 *   node server/test-meet.mjs
 */
const API = process.env.API || "http://localhost:4300";
const MOCK = process.env.MOCK || "http://localhost:4400";
const G = process.env.GOOGLE_MOCK || "http://localhost:4500";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n); } else { fail++; console.log("  \x1b[31m✗\x1b[0m " + n + (d ? "  → " + d : "")); } };
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const get = (u) => fetch(u, { cache: "no-store" }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})), res: r }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ring = async () => (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
const mode = (m, failures) => post(G + "/_control", { mode: m, failures });

async function settle(id, t = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    const { body } = await get(API + "/api/order/" + id);
    if (body.status && body.status !== "pending") return body;
    await sleep(400);
  }
  return { status: "gave-up" };
}
/* Each buyer needs their own number: the per-phone limiter is real, and
   reusing one number across a suite is the test hitting a protection that
   exists precisely to stop that. */
let phoneSeq = 0;
const freshPhone = () => "07" + String(10000000 + (phoneSeq++) + Date.now() % 1000).slice(0, 8);

/** Buys a session and returns the confirmed booking. */
async function buy(email = "client@example.com") {
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type: "paid", date: day.date, time: s.time });
  const co = await post(API + "/api/checkout", { bookingRef: h.body.booking.ref, phone: freshPhone(), name: "Grace Muthoni", email, note: "Top-up offer to review" });
  const live = await ring();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  await settle(co.body.orderId);
  return h.body.booking.ref;
}
/** Waits for the link, exactly as the client's page does. */
async function waitMeet(ref, t = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    const b = (await get(API + "/api/booking/" + ref)).body.booking;
    if (b.meetLink || b.meetState !== "pending") return b;
    await sleep(400);
  }
  return (await get(API + "/api/booking/" + ref)).body.booking;
}

console.log("\n\x1b[1mGoogle Meet provisioning\x1b[0m\n");

await fetch(G + "/_reset");
ok("the server reports Google as connected", (await get(API + "/api/health")).body.meet === true);

/* ── 1 · the happy path ── */
console.log("\n\x1b[1m1 · a paid session gets a real Meet room\x1b[0m");
{
  const ref = await buy("grace@example.com");
  const b = await waitMeet(ref);
  ok("a Meet link is attached", /^https:\/\/meet\.google\.com\//.test(b.meetLink || ""), b.meetLink + " / " + b.meetState);
  ok("the state says ready", b.meetState === "ready", b.meetState);
  ok("the client is told where the invite went", b.emailedTo === "grace@example.com", String(b.emailedTo));

  const ev = (await get(G + "/_events")).body;
  const mine = ev.find((e) => e.extendedProperties?.private?.bookingRef === ref);
  ok("an event exists on the calendar", !!mine);
  ok("…at the booked time", mine.start.dateTime === new Date(b.startsAt).toISOString(), mine.start.dateTime);
  ok("…in Nairobi time", mine.start.timeZone === "Africa/Nairobi");
  ok("…with the client invited, so Google emails them", mine.attendees?.[0]?.email === "grace@example.com");
  ok("…carrying the booking reference", mine.description.includes(ref));
  ok("…and the M-Pesa receipt, for disputes", /M-Pesa S/.test(mine.description), mine.description.slice(0, 120));
  ok("…and the client's brief, so Paul is prepared", mine.description.includes("Top-up offer to review"));

  const ics = await fetch(API + "/api/booking/" + ref + "/ics").then((r) => r.text());
  ok("the calendar invite carries the join link", ics.includes(b.meetLink));
  ok("…as the location, so phones show a Join button", ics.includes("LOCATION:" + b.meetLink));
  ok("…and as X-GOOGLE-CONFERENCE", ics.includes("X-GOOGLE-CONFERENCE:" + b.meetLink));
}

/* ── 2 · Google is down when the money lands ── */
console.log("\n\x1b[1m2 · Google is down at the moment of payment\x1b[0m");
{
  await mode("flaky", 99);
  const ref = await buy();
  const b = (await get(API + "/api/booking/" + ref)).body.booking;
  ok("the session is STILL confirmed", b.status === "confirmed", b.status);
  ok("the client still has their reference", !!b.ref);
  ok("the calendar invite still works", (await fetch(API + "/api/booking/" + ref + "/ics")).status === 200);
  ok("no Meet link is invented", !b.meetLink);
  globalThis.__flakyRef = ref;
}

/* ── 3 · …and it comes back ── */
console.log("\n\x1b[1m3 · Google recovers — the retry upgrades the booking\x1b[0m");
{
  await mode("ok");
  // The sweep runs every 60s; nudge it the way the sweep would.
  const ref = globalThis.__flakyRef;
  const t0 = Date.now();
  let b = (await get(API + "/api/booking/" + ref)).body.booking;
  while (!b.meetLink && Date.now() - t0 < 75000) {
    await sleep(2000);
    b = (await get(API + "/api/booking/" + ref)).body.booking;
  }
  ok("the link arrives without anyone intervening", !!b.meetLink, b.meetState + " / " + Math.round((Date.now() - t0) / 1000) + "s");
  ok("…on the booking that was already confirmed", b.status === "confirmed");
}

/* ── 4 · the refresh token has been revoked ── */
console.log("\n\x1b[1m4 · a revoked refresh token\x1b[0m");
{
  await mode("revoked");
  // The server caches its access token, so revocation only bites at the next
  // refresh — exactly as in production. The emulator issues short-lived
  // tokens so that moment arrives inside a test rather than in an hour.
  await sleep(2200);
  const ref = await buy();
  const b = await waitMeet(ref);
  ok("the session is confirmed anyway", b.status === "confirmed", b.status);
  ok("it gives up rather than retrying forever", b.meetState === "unavailable", b.meetState);
  ok("…so the page shows the phone fallback instead of a spinner", b.meetLink === null);
}

/* ── 5 · Google creates the event but no conference ── */
console.log("\n\x1b[1m5 · an account that cannot mint Meet links\x1b[0m");
{
  await mode("noconference");
  const ref = await buy();
  const b = await waitMeet(ref);
  ok("the session is confirmed", b.status === "confirmed");
  ok("no link is claimed", !b.meetLink);
  ok("it is marked unavailable, not pending", b.meetState === "unavailable", b.meetState);
}

/* ── 6 · a retry must not mint a second room ── */
console.log("\n\x1b[1m6 · idempotency\x1b[0m");
{
  await mode("ok");
  await fetch(G + "/_reset");
  const ref = await buy();
  const b = await waitMeet(ref);
  const before = (await get(G + "/_events")).body.length;
  // Ask again, exactly as a duplicate Safaricom callback would.
  await post(API + "/api/mpesa/callback", {
    Body: { stkCallback: { CheckoutRequestID: (await get(MOCK + "/prompts")).body.pop().checkoutRequestId,
      ResultCode: 0, ResultDesc: "ok",
      CallbackMetadata: { Item: [{ Name: "Amount", Value: 5000 }, { Name: "MpesaReceiptNumber", Value: "SDUP12345" }] } } },
  });
  await sleep(1200);
  const after = (await get(G + "/_events")).body.length;
  ok("a duplicate callback creates no second event", after === before, before + " → " + after);
  const b2 = (await get(API + "/api/booking/" + ref)).body.booking;
  ok("…and the link is unchanged", b2.meetLink === b.meetLink);
}

/* ── 7 · the free session gets one too ── */
console.log("\n\x1b[1m7 · the free review\x1b[0m");
{
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type: "free", date: day.date, time: s.time });
  await post(API + "/api/booking/confirm", { bookingRef: h.body.booking.ref, name: "Mary Njeri", phone: freshPhone(), email: "mary@example.com" });
  const b = await waitMeet(h.body.booking.ref);
  ok("a free session also gets a Meet room", !!b.meetLink, b.meetState);
  ok("…and no payment was involved", b.amount === 0);
}

console.log("\n" + "─".repeat(58));
console.log(pass + " passed · " + fail + " failed\n");
process.exit(fail ? 1 : 0);
