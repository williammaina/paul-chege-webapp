# Paul Chege Financial Advisory — Specification

## What this is

A portfolio and transaction site for Paul Chege: insurance broker with
Bizsure, financial coach, and author of *The Anatomy of Smart Borrowing*.

It has to do two jobs at once. It is the public face of a licensed
intermediary, so everything on it must be true and verifiable. It is also a
till: it takes money by M-Pesa for the book and for consultations, and the
person paying has to be able to see that they are not being defrauded.

## Who it is for

- **A borrower with an offer letter in front of them.** They want to know
  what it actually costs before they sign. They are on a phone, on mobile
  data, in Kenya.
- **A client whose claim was declined.** They want to know whether anything
  can be done.
- **An organisation booking a speaker.** They want credentials and a date.

## Principles

1. **Nothing on the page may be unverifiable.** Paul is regulated. A
   fabricated statistic or testimonial is a licence problem, not a
   marketing decision. Every figure carries its source and the date it was
   read.
2. **The buyer is never surprised.** Before any prompt is sent, the page
   states the amount, the paybill, and the registered name that will appear
   on the handset, and says to cancel if any of it differs.
3. **The server decides what things cost.** Prices come from the server
   catalogue. A client that posts its own price is refused.
4. **Money and delivery move together.** A paid eBook downloads. A paid
   session is a confirmed seat with a calendar invite and a Meet link. One
   cannot happen without the other.
5. **Degrade, never break.** Every integration has a defined behaviour when
   it is down, and the page keeps working without it.
6. **The phone is the primary device.** Enhancements that cost bandwidth or
   battery are gated on the device being able to afford them.

## Scope

### The site
One page, section-anchored, with a live scrollspy. Sections: hero,
partners, advisory, about, framework, the book, insights and speaking,
contact.

Two copies are produced from one source. `client-site/viewable/index.html`
is the source of truth and references images as files. The shareable copy
is **generated** from it with images inlined, so the two cannot drift.

### Payments
Safaricom Daraja STK push to Paul's own shortcode. A paid eBook releases a
tokenised download; a paid physical copy is recorded for dispatch.

### Booking
A live diary, weekdays only, with a lead time. A slot is **held** before
payment and confirmed by it. A failed payment leaves a live hold so the
client can retry. An abandoned hold lapses and returns the slot with no
cleanup job.

### After the sale
A Google Meet link and calendar invite, a receipt to the buyer, a desk copy
to Paul, and reminders 24 hours and 1 hour before the session.

### Insights
Real episodes from Paul's YouTube channel. View counts, durations and ages
come from the YouTube Data API through the server, so the API key never
reaches the browser. Nothing is loaded from youtube.com until a visitor
presses play.

## Out of scope

- A CMS. The content changes rarely and lives in the markup.
- User accounts. Nobody needs to log in to buy a book or book an hour.
- Payment methods other than M-Pesa.

## Constraints

- **Node 18+, no runtime dependencies** on the server.
- **The shareable copy must work from the filesystem**, so scripts are
  classic bundles rather than ES modules.
- **WCAG AA contrast**, enforced by an audit tool in the repository.
- The published figures are Paul's real ones and are dated in the markup.

## Amendments

_None yet._
