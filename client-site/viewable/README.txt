PAUL CHEGE FINANCIAL ADVISORY — WEBSITE

WHAT CHANGED SINCE THE PROTOTYPE
- The hero now runs wider than the page gutter, so the two panels sit near
  the edges and the portrait takes the middle.
- A "Trusted partners" band sits under the hero with the six organisations
  Paul works with.
- Booking, M-Pesa payment, Google Meet links and email receipts are REAL.
  They are no longer demonstration-only.

TWO WAYS TO RUN IT

1. As a static page (what you have here)
   Open index.html in any browser. The page works and reads correctly, but
   with no server behind it the diary says "call us" and online ordering is
   switched off rather than showing a price it cannot charge.

2. With the payment server — the full thing
       npm install     (nothing to install; Node 18+ only)
       npm run server
   Then open http://localhost:4300. The server serves this page AND the API
   on the same origin, so there is nothing to configure. The page asks
   /api/health on load and switches itself on.

INSIGHTS SECTION
The episode cards are Paul's real YouTube videos. View counts, durations
and dates come from the YouTube Data API through the server, so they do not
go stale. Without a key (or without the server) the page shows the figures
baked into the HTML — never a blank section. Nothing is loaded from
youtube.com until a visitor presses play.

WHAT IS LIVE ONCE THE SERVER RUNS
- Booking: the diary shows real availability, a slot is HELD for ten minutes
  before any money is asked for, and it is confirmed the moment Safaricom
  says the payment went through. No one is ever paid-up and seatless.
- M-Pesa: a real STK push to the buyer's handset, money into Paul's own
  shortcode. Before the prompt, the page tells the buyer the exact amount,
  the paybill, and the name that will appear on their phone.
- eBook: downloads to the buyer's device the moment payment clears.
- Google Meet: every confirmed session gets a real meeting room on Paul's
  calendar, and Google emails the client the invite.
- Email: receipts, booking confirmations, and reminders 24 hours and 1 hour
  before a session.

BEFORE REAL MONEY CAN MOVE
Put Safaricom Daraja credentials in server/.env — see server/.env.example
and server/README.md. Without them the checkout says plainly that nothing
will be charged; it never pretends a payment happened.

Run `python3 tools/preflight.py` for the launch checklist.

STILL TO CONFIRM BEFORE PUBLIC LAUNCH
- Prices come from the server (currently KES 1,999 paperback, KES 999 eBook).
  The earlier prototype showed KES 2,500 — confirm which is right and set it
  in server/index.mjs (CATALOGUE).
- Paul's qualifications, licences and memberships are still not stated
  anywhere. The IRA licence number in particular is shown to clients before
  they pay, so it should be the real one.
- The eBook file served to buyers is a placeholder until the real PDF is put
  at EBOOK_PATH.

Entry file: index.html
