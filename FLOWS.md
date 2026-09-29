# Flows

Every path a visitor can take, what the server does at each step, and what
happens when each one fails. Written from walking them, not from reading
the code: every row below was driven through the interface and observed.

Verified against the Next.js application on 29 September 2026.
185 assertions pass alongside this; the assertions cover the API, this
covers what a person actually experiences.

---

## 1 · Buying the eBook

```
browser ──POST /api/checkout──▶ server ──STK push──▶ Safaricom ──▶ handset
handset ──PIN──▶ Safaricom ──POST /api/mpesa/callback──▶ server
browser ──GET /api/order/:id (2.5s poll)──▶ server ──▶ downloadUrl
browser ──GET /api/download/:token──▶ the PDF, as an attachment
```

| step | what the visitor sees |
| --- | --- |
| Opens the dialog | The price, from the server, never from the page |
| Before paying | The amount, the paybill and the registered name that will appear on the handset, with instructions to cancel if any of it differs |
| Sends the prompt | "Check your phone", three numbered steps, the dialog locked against a stray dismissal |
| Pays | Receipt number, then a download button |
| Downloads | `application/pdf`, `Content-Disposition: attachment` |

**When it fails**

| failure | behaviour |
| --- | --- |
| Buyer cancels the prompt | "You have not been charged", in the server's words |
| Insufficient balance | The real reason, from Safaricom |
| Callback never arrives | The query sweep resolves it; a late callback can still overturn a written-off order |
| Buyer closes the dialog mid-checkout | The order stays `pending` server-side and the sweep settles it. The dialog forgets; the server does not |
| Prompt expires | After 150s: "The prompt expired without a response. You have not been charged." |
| A guessed or traversed download token | Refused |

---

## 2 · Booking a paid session

The rule is **hold first, pay second**. The seat leaves the board the
moment a time is chosen and before any money is asked for, so nobody pays
for an hour somebody else is about to take.

```
browser ──POST /api/booking/hold──▶ seat held, deadline returned
browser ──POST /api/checkout {bookingRef}──▶ STK push
callback ──▶ booking confirmed, Meet link provisioned, emails sent
```

| step | what the visitor sees |
| --- | --- |
| Picks a time | The seat is held, with a live countdown reading the hold's own deadline |
| Fills the form | The assurance panel, as above |
| Pays | Confirmation, reference, M-Pesa receipt, Meet link, calendar invite |

**When it fails**

| failure | behaviour |
| --- | --- |
| Payment fails | The hold stays alive so they can retry; it is not confirmed |
| Hold lapses | The seat returns with no cleanup job; paying against a lapsed hold is refused, not charged |
| Someone else takes the slot first | Refused before a prompt is spent |
| Google is down | The session is still confirmed; no Meet link is invented, and the retry upgrades it later |
| The email provider is down | The session is still confirmed and the invite still downloads |
| The diary cannot be reached | The dialog says so and gives the office number, rather than showing an empty grid |

---

## 3 · Booking the free review

Identical up to the hold, then confirms with no payment at all. No
assurance panel, because there is nothing to pay. Still produces a
calendar invite and a Meet room.

---

## 4 · Buying the paperback

As the eBook, plus a delivery town — required, and asked for only here.
No download; the order is recorded for dispatch.

---

## 5 · Watching an episode

Nothing is loaded from youtube.com until play is pressed. Hovering cycles
YouTube's own frames from a quarter, half and three quarters through the
video — three unsigned stills from the image host the posters already use,
about 36KB, no iframe and no cookies. The player embeds through
`youtube-nocookie.com` and closes on Escape.

Figures come from the Data API through the server, so the key never
reaches the browser. When the quota is spent the page falls back to the
figures baked into the markup and says why.

---

## 6 · What each dependency failing costs

| down | lost | still works |
| --- | --- | --- |
| Safaricom | New payments | The whole page, the diary, the book |
| Google | Meet links | Bookings, payments, invites |
| Email provider | Receipts and reminders | Bookings, payments, downloads |
| YouTube API | Live view counts | Every episode, with baked figures |
| The API entirely | Ordering and the diary | The page reads correctly; the diary says to call |

No single failure takes the sale with it, and none of them can take money
without delivering.
