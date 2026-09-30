# Paul Chege Financial Advisory — Progress

**Phase 2 of 4 · P2-M15 in progress · 13 of 22 milestones complete**

## How this file works

- Work happens only on the milestone marked 🔄 IN PROGRESS.
- A task is ticked when its commit lands, not when it feels done.
- Work that isn't in the spec becomes a new task, milestone or phase here,
  and an amendment in `SPECIFICATION.md` if it changes what the project is.

---

## Phase 1 — The site and its till 🔄 IN PROGRESS

### P1-M01 — The advisory site and its payment server ✅ COMPLETE

**Branch:** `feat/p1-m01-site-and-payments` · merged into `development`

Everything built before the repository existed, landing as one milestone.

#### Tasks
- [x] Add the advisory site, its build scripts and its contrast audit
- [x] Add the payment, booking, Meet, email and YouTube server
- [x] Keep the earlier React prototype for reference
- [x] Commit the built script bundles so a copied `viewable/` deploys whole

### P1-M02 — Go live on real credentials ⬜ NOT STARTED

Nothing here is code. Every item is a value or a document only Paul can
supply, and the site is honest but incomplete until they exist.

#### Tasks
- [ ] Daraja production credentials and a public HTTPS callback
- [ ] Google OAuth refresh token for Meet provisioning
- [ ] Transactional email provider key
- [ ] YouTube Data API key
- [ ] IRA licence number, registered entity name, ODPC registration
- [ ] Advocate review of the privacy and terms pages
- [ ] The real eBook PDF, replacing the placeholder

### P1-M03 — Evidence a stranger can check ⬜ NOT STARTED

#### Tasks
- [ ] Three client testimonials with written consent
- [ ] A second and third photograph of Paul

---

## Phase 2 — The Next.js rebuild 🔄 IN PROGRESS

Ships as `v0.2.0`. The static page and its hand-rolled server become a
Next.js application: App Router, Tailwind, React Three Fiber, GSAP and
Lenis, deployable to Vercel.

The domain modules are **not** rewritten. `daraja`, `bookings`, `store`,
`google`, `email`, `templates` and `youtube` carry 185 assertions between
them, including the Daraja query that must not be read as a verdict while
the buyer is still holding their phone. Only the HTTP layer changes.

### P2-M01 — Scaffold and design tokens ✅ COMPLETE

**Branch:** `feat/p2-m01-nextjs-scaffold` · merged into `development`

#### Tasks
- [x] Scaffold the app, the design tokens and the self-hosted fonts
- [x] Move the domain modules under `web/lib/server`

### P2-M02 — The application ✅ COMPLETE

**Branch:** `feat/p2-m02-route-handlers` · merged into `development`

Originally planned as three milestones — the API, the page, the motion.
They were built and verified together against one running server, so
splitting them into three branches after the fact would have meant three
pull requests that could not be reviewed independently. Folded into one
and recorded here rather than left to look like the plan was followed.

#### Tasks
- [x] Serve the whole API through Route Handlers on the shared router
- [x] Build every section as a component with the real content
- [x] Port the hero shader, the R3F book, Lenis, magnets and the skew
- [x] Port the hold-then-pay booking flow and the book checkout
- [x] Give the API suite a harness that runs against Next
- [x] Make the two markup-shaped assertions test behaviour instead

### P2-M03 — Bug hunt and flow verification ✅ COMPLETE

**Branch:** `fix/p2-m03-bug-hunt` · merged into `development`

Added as its own milestone rather than folded into P2-M02, which had
already shipped. A round of fixing after delivery is new work, not an
extension of the work that caused it.

#### Tasks
- [x] Teach the contrast audit to read `oklab`, which Tailwind v4 emits
- [x] Show the book mesh instead of the still that was covering it
- [x] Make the speaking icons visible on their dark panel
- [x] Fetch `/api/health` once rather than once per component
- [x] Walk every flow through the interface, not only the API

### P2-M04 — Second hunt: the paths nobody takes ✅ COMPLETE

**Branch:** `fix/p2-m04-hunt-round-two` · merged into `development`

The first round walked the happy paths. This one went after the states a
visitor only reaches when something is already wrong.

#### Tasks
- [x] Say something when the diary cannot be reached, instead of an empty grid
- [x] Read the session price from the server in the advisory section
- [x] Trap focus in the payment dialogs and restore it on close
- [x] Remove the last type escape rather than silence it

### P2-M05 — Third hunt: abandoning a payment ✅ COMPLETE

**Branch:** `fix/p2-m05-hunt-round-three` · merged into `development`

#### Tasks
- [x] Ignore a checkout that resolves after its dialog was closed
- [x] Stop a stray click dismissing a dialog while money is moving

### P2-M06 — Fourth hunt: the server's edges ✅ COMPLETE

**Branch:** `fix/p2-m06-hunt-round-four` · merged into `development`

#### Tasks
- [x] Answer HEAD, which monitors use and the router was refusing
- [x] Stop returning an unexpected error's own message to the caller

### P2-M07 — Fifth hunt: dead weight and dead frames ✅ COMPLETE

**Branch:** `fix/p2-m07-hunt-round-five` · merged into `development`

#### Tasks
- [x] Give the dialogs an entrance and an exit instead of appearing
- [x] Drop GSAP, which was installed and never used
- [x] Re-check the static site with the corrected contrast parser

### P2-M08 — Sixth hunt: what a stranger's machine sees ✅ COMPLETE

**Branch:** `fix/p2-m08-hunt-round-six` · merged into `development`

#### Tasks
- [x] Add robots and a sitemap, and keep crawlers out of the API
- [x] Replace Next's blank "Application error" with a page that helps
- [x] Add structured data built only from claims the page already makes
- [x] Add a skip link and declare the language as Kenyan English

### P2-M09 — Map the flows ✅ COMPLETE

**Branch:** `docs/p2-m09-flow-map` · merged into `development`

#### Tasks
- [x] Write down every path and every failure, from walking them

### P2-M10 — Drop the hero side panel ✅ COMPLETE

**Branch:** `fix/p2-m10-drop-hero-aside` · merged into `development`

Asked for directly. The hero is two columns now, and nothing was lost
with it: its quote is Paul's own words rather than a client's, and its
three entry points all opened the same dialog the hero's own button does.

#### Tasks
- [x] Remove the side panel and give the hero two columns

### P2-M11 — Correct the Bizsure relationship ✅ COMPLETE

**Branch:** `fix/p2-m11-bizsure-and-hero-panel` · merged into `development`

Paul told us Bizsure is a brand he has worked with, not part of his
business. The site said otherwise in eleven places, and one of them was
not merely wording: the M-Pesa payee defaulted to Bizsure, so the
assurance panel would have told real buyers to cancel a genuine payment
because the name on their handset did not match.

The hero panel removed in P2-M10 is restored in the same branch, at
Paul's request and to his wording.

#### Tasks
- [x] Remove every claim that Bizsure is part of the business
- [x] Use Paul's own contact details and payee name
- [x] Restore the perspective panel to the hero

### P2-M12 — A list, and a button that follows ✅ COMPLETE

**Branch:** `feat/p2-m12-chapter-and-sticky-bar` · merged into `development`

Two of eight suggestions, chosen by Paul. Every other conversion on this
page is a single payment, so somebody not ready to buy today left no
trace; and the page is fifteen thousand pixels tall on a handset, where
the only booking button was in the hero.

#### Tasks
- [x] Give away a chapter in exchange for an email address
- [x] Keep a booking button reachable on a phone

### P2-M13 — Deploy to Vercel ⬜ NOT STARTED

**Branch:** `feat/p2-m13-vercel`

Two things make this a storage decision before it is a deployment one,
and both let money go wrong rather than merely breaking a page:

- **The order and booking stores are JSON files.** A serverless filesystem
  is per-invocation, so a slot held by one request is invisible to the
  next and two people can pay for the same hour.
- **The rate limiter is an in-memory `Map`.** It resets on every cold
  start and is per-instance, so the five-prompts-per-phone rule that
  stops somebody using Paul's shortcode to spam STK pushes at a stranger
  is unenforced the moment there is more than one instance.

Both need shared storage — Postgres, Redis or Vercel KV — before this can
be deployed rather than after.

### P2-M14 — Proof first, three lanes, room for outcomes ✅ COMPLETE

**Branch:** `feat/p2-m14-proof-lanes-outcomes` · merged into `development`

Three of the improvements Paul picked from a list of nine, all of them
about the same failure: the page asked to be trusted before it had said
anything a stranger could check.

- **The strongest fact was ranked last.** A sitting Deputy President
  wrote the foreword, and that was a grey line of body copy three
  screens down, under a marquee of six SME logos.
- **Eight advisory cards, seven saying "Book a session".** Three of them
  were different names for reading a loan document before signing it,
  and nothing on the card told them apart.
- **No third-party evidence at all.** Paul is a regulated intermediary,
  so a testimonial needs written consent and nothing may be invented.

#### Tasks
- [x] Put the foreword credential directly under the hero
- [x] Collapse the eight advisory cards into three lanes
- [x] Build the case-outcome section, and leave it empty until Paul fills it

### P2-M15 — Layout principles 🔄 IN PROGRESS

**Branch:** `feat/p2-m14-proof-lanes-outcomes`

Paul supplied Flux Academy's *Principles of Layout* and asked for the
page to be held against it. Audited at 1440 and 375, three of the nine
principles were being broken measurably rather than as a matter of
taste.

- **Alignment.** The hero ran on its own 1500px container with a 16px
  gutter while every other section used `.wrap` at 1180 with 20px, so
  the content stepped 107px inward at the fold. The partners heading
  was also the only one on the page centred rather than flush-left.
- **White space and sequence.** Section padding was 46, 56, 76, 88 and
  92 pixels with no system behind the differences, so the page scrolled
  at one flat volume.
- **Focal point and hierarchy.** In the credential band the three
  supporting figures were set larger than the foreword credential they
  support.

#### Tasks
- [x] Put every section, the hero included, on one vertical axis
- [ ] Give the page a section rhythm instead of five arbitrary paddings
- [ ] Make the foreword the focal point of the credential band


---

## Phase 3 — Hardening ⬜ NOT STARTED

### P3-M01 — Analytics and error reporting ⬜ NOT STARTED
### P3-M02 — Deployment and CI ⬜ NOT STARTED

## Phase 4 — After delivery ⬜ NOT STARTED

### P4-M01 — Content editing without a developer ⬜ NOT STARTED
