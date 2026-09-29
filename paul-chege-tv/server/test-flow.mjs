/**
 * End-to-end proof of the M-Pesa flow, against the local Safaricom emulator.
 *
 *   node server/mock-daraja.mjs &
 *   MPESA_BASE=http://localhost:4400 MPESA_CONSUMER_KEY=k MPESA_CONSUMER_SECRET=s \
 *   MPESA_SHORTCODE=174379 MPESA_PASSKEY=p PUBLIC_URL=http://localhost:4300 \
 *   node server/index.mjs &
 *   node server/test-flow.mjs
 *
 * Every case below is a thing that actually happens to real buyers.
 */
const API = process.env.API || "http://localhost:4300";
const MOCK = process.env.MOCK || "http://localhost:4400";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log("  \x1b[32m✓\x1b[0m " + name); }
  else { fail++; console.log("  \x1b[31m✗\x1b[0m " + name + (detail ? "  → " + detail : "")); }
};
const post = (url, body) => fetch(url, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const get = (url) => fetch(url, { cache: "no-store" }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})), res: r }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Waits for the order to leave `pending`. */
async function settle(id, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const { body } = await get(API + "/api/order/" + id);
    if (body.status && body.status !== "pending") return body;
    await sleep(400);
  }
  return { status: "gave-up" };
}

console.log("\n\x1b[1mM-Pesa end-to-end\x1b[0m  " + API + "  ⇄  " + MOCK + "\n");

/* ── 0 · the server is up and thinks it is live ── */
{
  const { body } = await get(API + "/api/health");
  ok("server is live (credentials present)", body.live === true, JSON.stringify(body));
  ok("the eBook file exists on disk", body.ebookReady === true);
}

/* ── 1 · the happy path: eBook, paid, downloaded ── */
console.log("\n\x1b[1m1 · eBook — prompt, PIN, payment, automatic download\x1b[0m");
{
  const { status, body } = await post(API + "/api/checkout", {
    items: [{ sku: "ebook", qty: 1 }], phone: "0712345678", name: "Jane Wanjiku", email: "jane@example.com",
  });
  ok("checkout accepted", status === 200, JSON.stringify(body));
  ok("server priced it at KES 999, not whatever the client said", body.amount === 999, "got " + body.amount);

  const prompts = (await get(MOCK + "/prompts")).body;
  const live = prompts.filter((p) => !p.settled).pop();
  ok("Safaricom received a push for the right amount", live?.amount === 999);
  ok("…to the right MSISDN, normalised from 07…", live?.phone === "254712345678", live?.phone);
  ok("…referencing the order", live?.ref === body.orderId, live?.ref);

  const pre = await get(API + "/api/order/" + body.orderId);
  ok("before the PIN, no download is on offer", pre.body.status === "pending" && !pre.body.downloadUrl);

  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(body.orderId);
  ok("order is paid", done.status === "paid", done.status + " " + (done.message || ""));
  ok("the M-Pesa receipt number is recorded", /^S[A-Z0-9]{9}$/.test(done.receipt || ""), done.receipt);
  ok("a download link was minted", !!done.downloadUrl);

  const file = await fetch(done.downloadUrl);
  const buf = Buffer.from(await file.arrayBuffer());
  ok("the file downloads", file.status === 200);
  ok("…as a PDF", file.headers.get("content-type") === "application/pdf");
  ok("…as an attachment, so the browser saves it", /^attachment/.test(file.headers.get("content-disposition") || ""));
  ok("…under the book's name", /filename\*=UTF-8/.test(file.headers.get("content-disposition") || ""));
  ok("…and is a real PDF", buf.subarray(0, 5).toString() === "%PDF-");

  globalThis.__paidToken = done.downloadUrl.split("/").pop();
}

/* ── 2 · the buyer says no ── */
console.log("\n\x1b[1m2 · the buyer cancels the prompt\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0722000111", name: "Peter Otieno", email: "p@example.com" });
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
  await post(MOCK + "/pin/cancel", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(body.orderId);
  ok("order is marked cancelled", done.status === "cancelled", done.status);
  ok("no download is handed out", !done.downloadUrl);
  ok("the buyer is told why, in their words", /cancelled the prompt/i.test(done.message || ""), done.message);
}

/* ── 3 · not enough money ── */
console.log("\n\x1b[1m3 · insufficient balance\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0733000222", name: "Mary Njeri", email: "m@example.com" });
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
  await post(MOCK + "/pin/nomoney", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(body.orderId);
  ok("order failed", done.status === "failed", done.status);
  ok("the message names the real problem", /enough money/i.test(done.message || ""), done.message);
}

/* ── 4 · the callback never arrives (dead tunnel, firewall, dropped packet) ── */
console.log("\n\x1b[1m4 · the callback never arrives — the query sweep must still resolve it\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0700123456", name: "Silent Sam", email: "s@example.com" });
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
  // Settle it at Safaricom's end WITHOUT posting a callback.
  await post(MOCK + "/pin/silence", { checkoutRequestId: live.checkoutRequestId });
  await sleep(9000);                    // the poll route queries after 8s
  const done = await settle(body.orderId, 15000);
  ok("the order does not hang forever", done.status !== "pending" && done.status !== "gave-up", done.status);
  ok("it resolves as a timeout, not a phantom sale", done.status === "timeout", done.status);
  ok("no file is released", !done.downloadUrl);
}

/* ── 4b · the buyer who takes their time ──
   The regression that matters most: a query fired while the prompt is still
   ringing must not be read as a verdict. This once killed the sale eight
   seconds in, while the PIN was still being typed. */
console.log("\n\x1b[1m4b · a slow buyer — the poll must not write off a live prompt\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0788776655", name: "Slow Susan", email: "ss@example.com" });
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();

  // Poll hard for 12s while the prompt is genuinely unanswered — this is what
  // the browser does, and it is what used to break the order.
  for (let i = 0; i < 12; i++) { await get(API + "/api/order/" + body.orderId); await sleep(1000); }
  const mid = (await get(API + "/api/order/" + body.orderId)).body;
  ok("after 12s of polling the order is still pending", mid.status === "pending", mid.status);

  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(body.orderId);
  ok("a late PIN still pays", done.status === "paid", done.status);
  ok("…and still releases the file", !!done.downloadUrl);
}

/* ── 4c · a genuine payment overturns a premature verdict ── */
console.log("\n\x1b[1m4c · a late callback must be able to correct a written-off order\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0744556677", name: "Late Larry", email: "ll@example.com" });
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();

  // Safaricom's query says "no response", so the order is written off…
  await post(MOCK + "/pin/silence", { checkoutRequestId: live.checkoutRequestId });
  await sleep(9000);
  const writtenOff = await settle(body.orderId, 12000);
  ok("the order is written off", writtenOff.status === "timeout", writtenOff.status);

  // …and then the real callback lands, saying the money moved.
  await post(API + "/api/mpesa/callback", {
    Body: { stkCallback: { MerchantRequestID: "late", CheckoutRequestID: live.checkoutRequestId,
      ResultCode: 0, ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: { Item: [
        { Name: "Amount", Value: 999 }, { Name: "MpesaReceiptNumber", Value: "SLATE12345" },
        { Name: "PhoneNumber", Value: 254744556677 }] } } },
  });
  await sleep(600);
  const fixed = (await get(API + "/api/order/" + body.orderId)).body;
  ok("the payment is honoured, not lost", fixed.status === "paid", fixed.status);
  ok("the buyer gets the file they paid for", !!fixed.downloadUrl);
}

/* ── 5 · the things an attacker tries ── */
console.log("\n\x1b[1m5 · abuse\x1b[0m");
{
  const cheap = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1, price: 1, amount: 1 }], phone: "0711223344", name: "Cheap Charlie", email: "c@example.com" });
  ok("a client-supplied price is ignored", cheap.body.amount === 999, "charged " + cheap.body.amount);

  const fake = await post(API + "/api/checkout", { items: [{ sku: "free-everything", qty: 1 }], phone: "0711223345", name: "Nobody", email: "n@example.com" });
  ok("an unknown SKU is refused", fake.status === 400, fake.status + " " + JSON.stringify(fake.body));

  const bad = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "12345", name: "Wrong Number", email: "w@example.com" });
  ok("a non-Kenyan number is refused before a push is spent", bad.status === 400, bad.status);

  const noTown = await post(API + "/api/checkout", { items: [{ sku: "physical", qty: 1 }], phone: "0711223346", name: "No Address" });
  ok("a physical order without a delivery town is refused", noTown.status === 400, noTown.status);

  const guess = await get(API + "/api/download/" + "A".repeat(32));
  ok("a guessed download token is refused", guess.status === 403, guess.status);

  const traverse = await fetch(API + "/api/download/..%2f..%2fetc%2fpasswd");
  ok("path traversal in the token is refused", traverse.status === 404 || traverse.status === 403, traverse.status);

  const unpaid = await post(API + "/api/checkout", { items: [{ sku: "ebook", qty: 1 }], phone: "0711223347", name: "Unpaid Ursula", email: "u@example.com" });
  const st = await get(API + "/api/order/" + unpaid.body.orderId);
  ok("an unpaid order exposes no link", !st.body.downloadUrl);

  const forged = await post(API + "/api/mpesa/callback", {
    Body: { stkCallback: { CheckoutRequestID: "ws_CO_does_not_exist", ResultCode: 0, ResultDesc: "ok",
      CallbackMetadata: { Item: [{ Name: "Amount", Value: 999 }, { Name: "MpesaReceiptNumber", Value: "SFORGED123" }] } } },
  });
  ok("a forged callback for an unknown order changes nothing", forged.status === 200);
  const still = await get(API + "/api/order/" + unpaid.body.orderId);
  ok("…and that order is still unpaid", still.body.status === "pending", still.body.status);

  const missing = await get(API + "/api/order/PCNOPE1234");
  ok("an unknown order id is a clean 404", missing.status === 404);
}

/* ── 6 · the download token behaves like a credential ── */
console.log("\n\x1b[1m6 · download token limits\x1b[0m");
{
  const token = globalThis.__paidToken;
  let last = 0, n = 0;
  for (let i = 0; i < 8; i++) {
    const r = await fetch(API + "/api/download/" + token);
    await r.arrayBuffer();
    last = r.status;
    if (r.status === 200) n++;
  }
  ok("the link works more than once (a buyer may retry)", n > 1, "succeeded " + n + " times");
  ok("…but not forever — it is capped", last === 403, "last status " + last);
}

/* ── 7 · a cart with both editions ── */
console.log("\n\x1b[1m7 · a mixed cart\x1b[0m");
{
  const { body } = await post(API + "/api/checkout", {
    items: [{ sku: "ebook", qty: 1 }, { sku: "physical", qty: 2 }],
    phone: "0799887766", name: "Grace Muthoni", email: "g@example.com", town: "Nakuru",
  });
  ok("the cart totals server-side", body.amount === 999 + 1999 * 2, "got " + body.amount);
  const live = (await get(MOCK + "/prompts")).body.filter((p) => !p.settled).pop();
  await post(MOCK + "/pin/accept", { checkoutRequestId: live.checkoutRequestId });
  const done = await settle(body.orderId);
  ok("it pays", done.status === "paid", done.status);
  ok("the eBook in the cart still unlocks a download", !!done.downloadUrl);
  ok("the physical copy is still recorded for dispatch", done.physical === true && done.town === "Nakuru");
}

console.log("\n" + "─".repeat(58));
console.log(pass + " passed · " + fail + " failed\n");
process.exit(fail ? 1 : 0);
