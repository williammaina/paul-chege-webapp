/**
 * Receipts and reminders.
 *
 * Two properties under test:
 *   1. Nothing here can break a payment. A bounced receipt is a bounced
 *      receipt, not a failed order.
 *   2. Nobody is emailed the same thing twice, whatever the schedule does.
 */
const API = process.env.API || "http://localhost:4300";
const MOCK = process.env.MOCK || "http://localhost:4400";
const MAIL = process.env.MAIL_MOCK || "http://localhost:4600";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n); } else { fail++; console.log("  \x1b[31m✗\x1b[0m " + n + (d ? "  → " + d : "")); } };
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const get = (u) => fetch(u, { cache: "no-store" }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ring = async () => (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
const inbox = async () => (await get(MAIL + "/_inbox")).body;
const to = async (addr) => (await inbox()).filter((m) => m.to === addr);

let seq = 0;
const freshPhone = () => "07" + String(30000000 + (seq++) + Date.now() % 1000).slice(0, 8);

async function settle(id, t = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    const { body } = await get(API + "/api/order/" + id);
    if (body.status && body.status !== "pending") return body;
    await sleep(400);
  }
  return { status: "gave-up" };
}
async function waitMail(addr, n = 1, t = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    const m = await to(addr);
    if (m.length >= n) return m;
    await sleep(300);
  }
  return to(addr);
}
/** Books and pays for a session. */
async function book(email, { type = "paid" } = {}) {
  const day = (await get(API + "/api/slots")).body.days.find((d) => d.open);
  const s = day.slots.find((x) => x.available);
  const h = await post(API + "/api/booking/hold", { type, date: day.date, time: s.time });
  if (type === "free") {
    await post(API + "/api/booking/confirm", { bookingRef: h.body.booking.ref, name: "Mary Njeri", phone: freshPhone(), email });
    return h.body.booking.ref;
  }
  const co = await post(API + "/api/checkout", { bookingRef: h.body.booking.ref, phone: freshPhone(), name: "Grace Muthoni", email, note: "Equity top-up offer" });
  const live = await ring();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  await settle(co.body.orderId);
  return h.body.booking.ref;
}

console.log("\n\x1b[1mReceipts and reminders\x1b[0m\n");
await fetch(MAIL + "/_reset", { method: "POST" });

/* ── 1 · the eBook receipt ── */
console.log("\x1b[1m1 · the eBook receipt\x1b[0m");
{
  const addr = "reader@example.com";
  const co = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: freshPhone(), name: "Jane Wanjiku", email: addr });
  const live = await ring();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(co.body.orderId);
  const [m] = await waitMail(addr);
  ok("a receipt is emailed to the BUYER, not the desk", !!m && m.to === addr, JSON.stringify((await inbox()).map((x) => x.to)));
  ok("…naming the order", m.text.includes(done.orderId));
  ok("…and the M-Pesa receipt, for disputes", m.text.includes(done.receipt), done.receipt);
  ok("…carrying the download link", m.html.includes(done.downloadUrl), done.downloadUrl);
  ok("…with a plain-text part as well", !!m.text && m.text.length > 80);
  ok("…and no unrendered template holes", !/\bundefined\b|\[object|NaN/.test(m.html + m.text));
  ok("the subject names the order", m.subject.includes(done.orderId), m.subject);
}

/* ── 2 · the booking confirmation ── */
console.log("\n\x1b[1m2 · the booking confirmation\x1b[0m");
{
  const addr = "grace@example.com";
  const ref = await book(addr);
  const all = await waitMail(addr);
  const b = (await get(API + "/api/booking/" + ref)).body.booking;
  const m = all.find((x) => x.text.includes(ref)) || all[0];

  ok("the client is emailed", !!m, JSON.stringify((await inbox()).map((x) => x.to)));
  ok("…exactly once — a booking is not also a product order", all.length === 1,
     all.map((x) => x.subject).join(" | "));
  ok("…with the reference", m.text.includes(ref));
  ok("…the amount paid", m.text.includes("5,000"));
  ok("…the M-Pesa receipt", m.text.includes(b.receipt), b.receipt);
  ok("…the Meet link", !!b.meetLink && m.html.includes(b.meetLink), String(b.meetLink));
  ok("…the refund promise, which Google's own invite does not carry", /every shilling back/i.test(m.text));
  ok("…and the calendar invite attached", m.attachments.some((a) => a.filename.endsWith(".ics")));
  ok("the attachment is valid iCalendar", m.attachments[0].content.startsWith("BEGIN:VCALENDAR"));
  ok("…for the right session", m.attachments[0].content.includes(ref));
  ok("times are East Africa Time, not the server's", /EAT/.test(m.text), m.text.slice(0, 200));
  ok("no template holes", !/\bundefined\b|\[object|NaN|Invalid Date/.test(m.html + m.text));
  globalThis.__ref = ref;
}

/* ── 3 · the desk gets its own copy ── */
console.log("\n\x1b[1m3 · the desk copy\x1b[0m");
{
  const desk = await to(process.env.DESK_EMAIL || "desk@paulchege.co.ke");
  ok("the desk is notified", desk.length >= 1, String(desk.length));
  ok("…with the client's phone, readable enough to dial", /\+254 \d{3} \d{3} \d{3}/.test(desk[0]?.text || ""),
     (desk[0]?.text || "").split("\n").slice(0, 4).join(" / "));
  ok("…and their brief", /Equity top-up offer/.test(desk[0]?.text || ""));
}

/* ── 4 · reminders ── */
console.log("\n\x1b[1m4 · reminders\x1b[0m");
{
  const ref = globalThis.__ref;
  const b = (await get(API + "/api/booking/" + ref)).body.booking;
  const start = new Date(b.startsAt).getTime();
  const before = (await to("grace@example.com")).length;

  // Too early: nothing should go out.
  await post(API + "/api/_reminders/run", { now: start - 40 * 3600_000 });
  ok("nothing fires two days out", (await to("grace@example.com")).length === before);

  // 24 hours out.
  const r24 = await post(API + "/api/_reminders/run", { now: start - 24 * 3600_000 + 60_000 });
  ok("the 24-hour reminder fires", r24.body.sent === 1, JSON.stringify(r24.body));
  const m24 = (await to("grace@example.com")).slice(-1)[0];
  ok("…saying tomorrow", /tomorrow/i.test(m24.subject + m24.text), m24.subject);
  ok("…with the Meet link", m24.html.includes(b.meetLink));
  ok("…and what to have ready", /offer letter/i.test(m24.text));

  // Running again must not resend.
  const again = await post(API + "/api/_reminders/run", { now: start - 24 * 3600_000 + 120_000 });
  ok("a second tick does not resend it", again.body.sent === 0, JSON.stringify(again.body));

  // One hour out.
  const r1 = await post(API + "/api/_reminders/run", { now: start - 3600_000 + 60_000 });
  ok("the 1-hour reminder fires", r1.body.sent === 1, JSON.stringify(r1.body));
  const m1 = (await to("grace@example.com")).slice(-1)[0];
  ok("…saying it starts shortly", /1 hour|in an hour/i.test(m1.subject + m1.text), m1.subject);
  ok("…with a join button", m1.html.includes(b.meetLink));

  const r1b = await post(API + "/api/_reminders/run", { now: start - 3600_000 + 120_000 });
  ok("and that one does not resend either", r1b.body.sent === 0);

  // After the start time, nothing.
  const late = await post(API + "/api/_reminders/run", { now: start + 600_000 });
  ok("nothing fires once the session has started", late.body.sent === 0, JSON.stringify(late.body));
}

/* ── 5 · a provider outage must not cost anything ── */
console.log("\n\x1b[1m5 · the email provider is down\x1b[0m");
{
  await post(MAIL + "/_control", { mode: "fail" });
  const addr = "bounced@example.com";
  const ref = await book(addr);
  // The Meet link is provisioned just after payment, so wait for it the way
  // the client's page does rather than reading once and racing it.
  let b = (await get(API + "/api/booking/" + ref)).body.booking;
  for (let i = 0; i < 30 && !b.meetLink && b.meetState === "pending"; i++) {
    await sleep(400);
    b = (await get(API + "/api/booking/" + ref)).body.booking;
  }
  ok("the session is STILL confirmed", b.status === "confirmed", b.status);
  ok("…and still has its Meet link", !!b.meetLink, b.meetState);
  ok("…and the invite still downloads", (await fetch(API + "/api/booking/" + ref + "/ics")).status === 200);
  ok("no email was recorded", (await to(addr)).length === 0);
  await post(MAIL + "/_control", { mode: "ok" });
}

/* ── 6 · a free session is looked after too ── */
console.log("\n\x1b[1m6 · the free review\x1b[0m");
{
  const addr = "mary@example.com";
  await book(addr, { type: "free" });
  const [m] = await waitMail(addr);
  ok("the client is emailed", !!m);
  ok("…and told plainly it is free, not charged", /free/i.test(m.text) && !/KES 5,000/.test(m.text), m.text.slice(0, 160));
}

/* ── 7 · no client is emailed about someone else ── */
console.log("\n\x1b[1m7 · leakage\x1b[0m");
{
  const all = await inbox();
  const desk = process.env.DESK_EMAIL || "desk@paulchege.co.ke";
  const leaked = all.filter((m) => m.to !== desk).filter((m) => {
    const others = ["grace@example.com", "reader@example.com", "mary@example.com"].filter((a) => a !== m.to);
    return others.some((a) => (m.html + m.text).includes(a));
  });
  ok("no message mentions another client's address", leaked.length === 0,
     leaked.map((m) => m.to + " / " + m.subject).join("; "));
}

console.log("\n" + "─".repeat(58));
console.log(pass + " passed · " + fail + " failed\n");
process.exit(fail ? 1 : 0);
