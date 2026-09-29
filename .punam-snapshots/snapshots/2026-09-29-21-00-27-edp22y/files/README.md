# Paul Chege Financial Advisory

The site and payment server for Paul Chege — insurance broker with Bizsure,
financial coach, and author of *The Anatomy of Smart Borrowing*.

See `SPECIFICATION.md` for what this is meant to be, `PROGRESS.md` for
where it has got to, and `FLOWS.md` for every path a visitor can take and
what happens when each dependency fails.

## Layout

| | |
| --- | --- |
| `client-site/` | The site the client chose. `viewable/index.html` is the source of truth; the shareable single-file copy is generated from it. |
| `paul-chege-tv/server/` | The payment, booking, Meet, email and YouTube server. Node 18+, no runtime dependencies. |
| `paul-chege-tv/` (rest) | The earlier React prototype, kept for reference. |

## Running it

```bash
cd paul-chege-tv
cp server/.env.example server/.env     # then fill it in
npm run server
```

Then open http://localhost:4300. The server serves the site and the API on
the same origin, so there is nothing to configure — the page asks
`/api/health` on load and switches itself on.

With no credentials, every integration falls back to a defined behaviour
rather than failing: the diary says to call, ordering is switched off
rather than advertising a price it cannot charge, and the episode figures
come from the values baked into the HTML.

### Without a server

Open `client-site/viewable/index.html` directly. The page reads correctly;
only the parts that need money or a diary are switched off.

## Local emulators

Every external service has one, so the failure modes can be exercised
without credentials:

```bash
node server/mock-daraja.mjs    # :4400  Safaricom
node server/mock-google.mjs    # :4500  Calendar and Meet
node server/mock-email.mjs     # :4600  the email provider
node server/mock-youtube.mjs   # :4900  the Data API
```

## Tests

185 assertions across five suites, covering the happy path and every
failure mode that costs somebody money.

```bash
node server/test-flow.mjs       # 46  eBook purchase end to end
node server/test-booking.mjs    # 45  hold, pay, confirm, lapse
node server/test-meet.mjs       # 30  Meet provisioning and its outages
node server/test-email.mjs      # 40  receipts and reminders
node server/test-youtube.mjs    # 24  live figures and quota exhaustion
```

They run against a live server and consume diary slots, so point them at a
throwaway store rather than the real one:

```bash
BOOKING_STORE=/tmp/b.json ORDER_STORE=/tmp/o.json PORT=4301 node server/index.mjs
API=http://localhost:4301 node server/test-booking.mjs
```

## Building the site

See `client-site/README-BUILD.md`. Briefly:

```bash
cd client-site
npm install
python3 build-tailwind.py      # compile Tailwind, inline it
python3 build-standalone.py    # generate the shareable single-file copy
npx esbuild src/fx.js --bundle --minify --format=iife --target=es2020 --outfile=viewable/js/fx.js
```

## Accessibility

Contrast is audited rather than assumed. Paste `client-site/tools/contrast-audit.js`
into the console on the running page; it composites translucent layers and
folds gradients, and prints the full element path for anything that fails.
The site currently reports zero failures.
