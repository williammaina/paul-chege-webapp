/* ────────────────────────────────────────────────────────────────────────────
   Paul Chege Consultancy TV — live configuration

   Edit this file and reload. No rebuild, no npm, nothing to recompile.
   Anything left blank keeps that feature in demo mode, which the page says
   plainly on screen so nobody mistakes a demo for a delivered message.
   ──────────────────────────────────────────────────────────────────────────── */
window.PC_CONFIG = {

  /* ── 1 · Contact form ──────────────────────────────────────────────────
     Get a free access key at https://web3forms.com — you enter the inbox
     that should receive enquiries and they email you the key. Paste it here.
     Delivery is bound to that inbox. Free tier: 250 submissions/month.      */
  contact: {
    provider: "web3forms",
    key: "",                       // ← paste your Web3Forms access key
  },

  /* ── 2 · Booking records ───────────────────────────────────────────────
     A Google Apps Script Web App that appends a row per booking.
     The doPost snippet to paste is in source/PROJECT-README.md.
     Deploy as: Execute as "me", Who has access "anyone", then paste the
     /exec URL below.                                                        */
  booking: {
    provider: "sheets",
    url: "",                       // ← paste the Apps Script /exec URL
  },

  /* ── 3 · Calendly ──────────────────────────────────────────────────────
     Paste the two event links and the booking hub swaps its built-in diary
     for Calendly's real widget: live availability, Calendly's confirmation
     emails, and the invite on Paul's calendar.                              */
  calendly: {
    free: "",                      // ← e.g. https://calendly.com/paulchege/30min
    paid: "",                      // ← e.g. https://calendly.com/paulchege/60min
  },

  /* ── Payments ───────────────────────────────────────────────────────────
     LEAVE THIS BLANK IF THE SITE AND THE SERVER SHARE A DOMAIN.

     `node server/index.mjs` serves the site AND the API together, so the
     API is already at /api on the same origin — nothing to configure. The
     site asks /api/health on load and switches itself on; it does not
     decide from this setting.

     Only fill it in when the API lives somewhere else:

       payments: { api: "https://pay.paulchege.co.ke" }

     Whether real money moves is decided by the Daraja credentials in
     server/.env, which never appear here — this file is public.
     ──────────────────────────────────────────────────────────────────── */
  payments: {
    api: "",
  },
};
