# Paul Chege Financial Advisory — Progress

**Phase 2 of 4 · P2-M03 in progress · 3 of 11 milestones complete**

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

### P2-M03 — Bug hunt and flow verification 🔄 IN PROGRESS

**Branch:** `fix/p2-m03-bug-hunt`

Added as its own milestone rather than folded into P2-M02, which had
already shipped. A round of fixing after delivery is new work, not an
extension of the work that caused it.

#### Tasks
- [x] Teach the contrast audit to read `oklab`, which Tailwind v4 emits
- [x] Show the book mesh instead of the still that was covering it
- [ ] Make the speaking icons visible on their dark panel
- [ ] Fetch `/api/health` once rather than once per component
- [ ] Walk every flow through the interface, not only the API

### P2-M04 — Deploy to Vercel ⬜ NOT STARTED

**Branch:** `feat/p2-m04-vercel`

The file-backed order and booking stores do not survive a serverless
filesystem, so this milestone is a storage decision before it is a
deployment one.

---

## Phase 3 — Hardening ⬜ NOT STARTED

### P3-M01 — Analytics and error reporting ⬜ NOT STARTED
### P3-M02 — Deployment and CI ⬜ NOT STARTED

---

## Phase 4 — After delivery ⬜ NOT STARTED

### P4-M01 — Content editing without a developer ⬜ NOT STARTED
