# Payments — taking real money by M-Pesa

This is the half of the site that cannot be static. Safaricom will not talk to
a browser: the Daraja secret has to live somewhere the public cannot read, and
Safaricom needs a public URL to post the result to. That is all this server is.

```
browser ──POST /api/checkout──▶ here ──STK push──▶ Safaricom ──▶ the handset
handset ──PIN──▶ Safaricom ──POST /api/mpesa/callback──▶ here   (money moved)
browser ──GET /api/order/:id (polling)──▶ here ──▶ { downloadUrl }
browser ──GET /api/download/:token──▶ here ──▶ the PDF, as an attachment
```

No dependencies. Node 18 or newer.

## One command, everything real

```bash
npm run build          # the site
npm run server         # serves the site AND the API on :4300
```

Open <http://localhost:4300>. The site asks `/api/health` on load and
switches itself on — **there is no URL to configure and no CORS to get
wrong.** Put the Daraja credentials in `server/.env` and the checkout is
taking real money; leave them out and it says plainly that nothing will be
charged.

This is deliberate. The checkout used to decide it was in "demo mode" from
whether a config string was set, which was wrong in exactly the normal
deployment — API behind the same domain as the site, so no URL needed.
Liveness is something the page asks the server, not something it infers.

## Try it on this machine, right now

Two terminals. Nothing real is charged — the first terminal is a local
emulator that speaks Daraja's exact wire format.

```bash
npm run mock
```

```bash
cp server/.env.example server/.env    # the defaults already point at the emulator
# fill in any nonsense for the four credentials — the emulator accepts anything
npm run server
npm run test:mpesa
```

`npm run test:mpesa` drives 46 assertions through the whole chain: payment,
cancellation, an empty M-Pesa account, a callback that never arrives, a client
that lies about the price, a forged callback, a guessed download token, and a
mixed cart.

To click through it yourself, set `payments.api` in `public/config.js` to
`http://localhost:4300`, buy the eBook, and accept the prompt by hand:

```bash
curl -s localhost:4400/prompts                       # what is ringing
curl -s -X POST localhost:4400/pin/accept -d '{}'    # press the PIN
```

`/pin/cancel`, `/pin/wrong`, `/pin/nomoney` and `/pin/silence` produce the
other outcomes. `/pin/silence` is the nasty one — it settles the payment at
Safaricom's end without sending a callback, which is what a dead tunnel looks
like in production.

## Going live

1. **A Daraja app.** developer.safaricom.co.ke → My Apps. Copy the consumer
   key and secret into `server/.env`.
2. **Paul's own shortcode.** `MPESA_SHORTCODE` is the paybill or till the
   money lands in, so it reaches him directly — nothing passes through anyone
   else's account. For a till, set `MPESA_TX_TYPE=CustomerBuyGoodsOnline` and
   `MPESA_PARTY_B` to the **head office** number, which is not the till number
   customers dial. Getting this pair wrong is the single most common reason a
   push is accepted and the money never arrives.
3. **The passkey.** Sandbox's is on the Daraja test-credentials page.
   Production's comes with Go-Live approval.
4. **A public HTTPS callback.** `PUBLIC_URL` must be reachable from the
   internet. Safaricom will not post to localhost, and in production it will
   not post to plain HTTP either. For a quick test, `npx localtunnel --port
   4300`; in production, put this behind the same TLS as the site.
5. **Go Live.** Daraja → Go Live, with a real shortcode and Safaricom's
   approval. Then switch `MPESA_BASE` to `https://api.safaricom.co.ke`.
6. **The eBook.** Point `EBOOK_PATH` at the real PDF, somewhere **outside the
   web root**. `server/assets/` is gitignored for exactly this reason. Until
   you do, buyers receive a placeholder that says so in large letters.
7. Point `payments.api` in `public/config.js` at this server, and add the
   site's origin to `ALLOWED_ORIGINS`.

`GET /api/health` reports whether it is live and whether the eBook is in place.

## What this server refuses to trust

- **The price.** It comes from `CATALOGUE` in `index.mjs`, never from the
  browser. A client that posts `price: 1` still pays 1,999.
- **The callback body.** It is unauthenticated — anyone on the internet can
  post to it. So it is used only to *look up* an order this server created,
  the amount is compared against what we asked for, and a mismatch is flagged
  rather than fulfilled. A callback for an unknown order does nothing.
- **The download token.** Minted server-side only after Safaricom confirms,
  compared in constant time, expiring in 72 hours, capped at six uses.

## Things worth knowing before they bite

- **The STK Query lies while a prompt is ringing.** Daraja answers with HTTP
  500 and a `ResultCode` that looks final. Reading it as a verdict writes off
  a sale while the buyer is still typing their PIN. `stkQuery` only reports an
  answer when the query itself succeeded — do not "simplify" that away.
- **The callback is the authority.** If a genuine `paid` callback arrives for
  an order already written off, it overturns it. A buyer who was debited must
  never be left with nothing.
- **Callbacks must always get a 200.** A non-200 makes Safaricom retry for
  hours. So the handler acknowledges first and processes after.
- **Orders live in a JSON file** (`server/data/orders.json`). That is a
  deliberate choice for one small business — no database to run, and a file
  Paul can open when a buyer rings about a missing book. It will not survive a
  container restart on an ephemeral filesystem; mount a volume, or replace the
  six exported functions in `store.mjs` with a real database.
- **Refunds are not automated.** An `underpaid` order is flagged and a human
  calls. Reversals go through Safaricom.

## Booking a paid session

Same payment machinery, one extra rule: **the seat is taken off the diary
before any money is asked for, and confirmed in the same breath as the
payment.** There is no window in which a client has paid and holds nothing.

```
GET  /api/slots                  what is actually free, weekdays only
POST /api/booking/hold           takes the seat for 10 minutes
POST /api/checkout {bookingRef}  the STK push, priced from the held seat
POST /api/mpesa/callback         money in → seat confirmed
GET  /api/booking/:ref           status
GET  /api/booking/:ref/ics       the calendar invite
POST /api/booking/confirm        free sessions only; refuses a paid one
```

`npm run test:booking` proves it — 45 assertions including double-booking,
abandoned holds, retry after a cancelled PIN, and every way of trying to get
a paid session for nothing.

### Designed against the fear of being scammed

A client is about to send KES 5,000 to a number they have never dealt with.
The design assumes they are **right** to be suspicious, so instead of
reassuring them it hands them things they can check for themselves:

- **The name that will appear on their own handset.** Before the prompt goes
  out they are told the amount, the paybill, and the registered name, with
  *"if it says any other name or any other amount, cancel it and call us."*
  Kenyans already read the name on an M-Pesa prompt — this turns their own
  caution into a verification step.
- **A licence number, an address on a map, and a phone that rings a person**,
  all offered *before* payment, not after.
- **"Nobody here will ever ask you for your M-Pesa PIN."** Stated plainly, so
  any later request for one is self-evidently fraud.
- **A live countdown on their own hold.** It is true, and a fake diary cannot
  produce one.
- **A refund promise with no process**: if Paul does not join within ten
  minutes, quote the reference on WhatsApp and the money goes back the same
  day.
- **Immediate, checkable artefacts**: booking reference, M-Pesa receipt
  number, and a calendar invite carrying both plus the phone number to ring.

Two behaviours matter and are easy to get wrong:

- **A cancelled payment does not take the seat away.** The client is standing
  there about to retry; snatching the slot while still showing them a
  countdown is the exact thing that makes an honest business feel like a
  scam. The hold's own deadline frees the seat instead — by itself, with no
  cleanup job.
- **The UI must never claim more than the server did.** Everything on the
  confirmation — the receipt, the reference, the invite — comes back from the
  server, and the "how" row promises only the phone call, because that is the
  part that is certainly true.

Tune with `SLOT_TIMES`, `HOLD_MINUTES`, `BOOKING_LEAD_HOURS`, `BOOKING_DAYS`.

## Google Meet links

Optional, and deliberately so. Connected, every confirmed session gets a real
Meet room, lands in Paul's own calendar, and Google emails the client the
invite from google.com — which is worth more as a trust signal than anything
we could send ourselves. Not connected, the booking still confirms and the
page says Paul will phone them.

```bash
npm run mock:google     # a local Google, for testing
npm run google:auth     # one-time, produces the refresh token
npm run test:meet       # 30 assertions
```

Setup is in `server/.env.example`. Two things catch people out:

- **Leave the OAuth consent screen in "Testing" and Google expires the
  refresh token after seven days.** Publish the app.
- **A service account will not work** without Workspace domain-wide
  delegation — it cannot create Meet links at all. Hence the refresh token
  for Paul's own account, which is what a one-person business actually has.

### The rule this is built around

**A Google failure must never cost a paid booking.** By the time we call
Google the money has already moved, so provisioning runs outside the payment
path entirely:

| What goes wrong | What the client gets |
|---|---|
| Google is down at the moment of payment | Session confirmed, reference, invite. Link arrives later, on its own. |
| Refresh token revoked | Session confirmed. Gives up after one attempt and shows the phone fallback — no endless spinner. |
| Account cannot mint Meet links | Session confirmed, marked unavailable immediately rather than retried forever. |
| Safaricom sends a duplicate callback | No second room. `requestId` is the booking reference, so Google returns the same conference. |

The page polls the booking after confirming, so a link that lands thirty
seconds late still appears without a refresh. `meetState` is `pending`,
`ready` or `unavailable` — the UI must never show a spinner for a state that
is never coming, and must never print a link it does not have.

## Receipts and reminders

```bash
npm run mock:email      # a local provider; also writes every message to
                        # server/data/outbox/ so you can open it in a browser
npm run test:email      # 40 assertions
```

Four messages, all optional — without `EMAIL_PROVIDER` the site works exactly
as before and the client still sees everything on screen.

| When | To | What it carries |
|---|---|---|
| A book or eBook is paid for | the buyer | Order, M-Pesa receipt, download link |
| A session is confirmed | the client | Reference, receipt, Meet link, refund promise, `.ics` attached |
| A session is confirmed | the desk | Client's phone and brief, so Paul can prepare |
| 24 hours before | the client | What to have ready |
| 1 hour before | the client | Join button |

**Web3Forms could never have done this.** It is a notification relay: it
delivers to the account owner's inbox whatever address you put in the
payload, so every "receipt to the buyer" would have gone to Paul and the
client would have received nothing. `email.mjs` speaks to real transactional
providers instead — Resend, Brevo, Postmark or MailerSend, all a plain HTTPS
POST, still no dependencies.

### Rules this is built around

- **A bounce is not a failed order.** Every message here is sent after money
  has already moved, so `mail()` swallows failures and logs them. Proven by
  taking the provider down mid-purchase: session confirmed, Meet link intact,
  invite still downloadable.
- **Nobody is emailed twice.** Idempotency lives in a stored flag, not in the
  schedule, so a restart, a duplicate Safaricom callback or two ticks landing
  together still send one email. Reminders claim the flag *before* sending.
- **Nothing fires late.** The reminder tick runs every five minutes against a
  twenty-minute window, and never for a session already under way — a
  "starts in an hour" arriving afterwards reads as incompetence.
- **A booking is not a product order.** It gets the confirmation, not a
  second "your order" receipt for the same payment.
- Times are rendered in `Africa/Nairobi` regardless of where the server runs.

## Live view counts

```bash
npm run mock:youtube    # a local YouTube Data API, for testing
npm run test:youtube    # 24 assertions
```

`GET /api/episodes` returns the episode list with live view counts,
durations and publish dates. Setup is in `server/.env.example`.

**The key stays on the server.** The browser calls `/api/episodes`, never
googleapis.com. A key shipped to the page can be read and used by anyone
until it is rotated, and the 10,000 daily units it burns are Paul's. The
test suite asserts the key appears in neither the HTML nor the API
response.

One request covers all nine episodes and costs a single quota unit, so the
cache (`YOUTUBE_CACHE_MINUTES`, default 180) exists to avoid repeating it
per visitor rather than because the API is slow.

### The rule this is built around

**The section must never go blank, and must never present a stale number as
live.** The episode titles and categories are editorial and live in
`EPISODES` in `index.mjs`; only the figures come from YouTube.

| What goes wrong | What the reader sees |
|---|---|
| Daily quota spent | Every episode, with the figures baked into the HTML. The error names the quota and when it resets. |
| Key wrong or revoked | Same, and the error names `YOUTUBE_API_KEY`. |
| A video deleted or made private | YouTube omits it silently; that one keeps its last known figures, the other eight go live. |
| No server at all | The baked figures in the HTML. The page simply does not upgrade. |

### Keeping the static copy current

The page ships with figures in the markup so it reads correctly on first
paint and when handed round as a file. Re-bake them before packaging:

```bash
YOUTUBE_API_KEY=... node tools/bake-episodes.mjs site/index.html
```

It reads the video ids out of the markup, so it cannot drift from the page.
Note that the hero card's "Most watched" label is static — if the leader
changes, move that card by hand. (At runtime the page handles this itself:
it re-ranks the grid and honestly relabels the hero "Featured" when it is
no longer the most-watched.)
