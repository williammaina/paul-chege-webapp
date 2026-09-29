# Paul Chege Consultancy TV — prototype

Single React component (`src/PaulChegeConsultancyTV.jsx`) plus a generated
standalone page (`paul-chege-prototype.html`) that runs with no build step.

    node build-prototype.mjs     # regenerate the standalone page from the JSX
    npm run dev                  # or run it as a normal Vite app

Serve `public/` over http (the images use absolute `/img/...` paths):

    python3 -m http.server 4180 --directory public
    # → http://localhost:4180/prototype.html

## Visual layer

Effects live at the bottom of `src/index.css`, behaviours in the component:

| Piece | How it works |
| --- | --- |
| `[data-reveal]` | Rises into place once when first seen. `useReveal(route)` re-observes on every page change. `data-reveal="left\|right\|zoom"` for direction; `style={{"--rd": "120ms"}}` to stagger. |
| `.pc-grain` | One inline SVG noise tile, `mix-blend-mode: overlay`, over the navy bands. |
| `.pc-spot` | Gold radial highlight that follows the pointer. One window-level listener feeds `--mx`/`--my`; add `.pc-spot-dark` on navy. |
| `.pc-edge` | Gradient hairline that fades in on hover, via a masked pseudo-element. |
| `.pc-marquee` | Logo wall. The track holds `BRANDS` twice and translates exactly -50%, so it loops seamlessly; pauses on hover and on keyboard focus. `.pc-fade-x` masks both edges. |
| `<CountUp>` | Parses "358.7K" into number + suffix and eases to it once the element is 50% visible. |
| `.pc-sheen` | Slow gradient drift across the hero's gold word. |
| `.pc-page` | Keyed on `route`, so each page lifts and fades in. |
| `.pc-tilt` / `.pc-tilt-face` | 3D tilt toward the pointer, capped at 7°. Put `data-tilt` on the frame (it holds the perspective) and `.pc-tilt-face` on the element that rotates. |
| `.pc-par` / `.pc-par-slow` / `.pc-par-fade` | Hero parallax. `useHeroScroll` writes `--sy` and `--hero-op` on `#top` from the scroll position, rAF-throttled. |
| `.pc-display` / `.pc-h2` | Fluid `clamp()` type — no breakpoint jumps. |
| `.pc-dropcap` / `.pc-pull` | Drop cap on a prose block; hanging quote mark on a pull quote. |
| `.pc-skel` / `<Img>` | Shimmer placeholder that fades to the image on load. Use `<Img>` for anything remote. |
| View Transitions | `nav()` calls `document.startViewTransition` where supported; the `.pc-page` CSS fade is the fallback. |
| `useFocusTrap` | Keeps Tab inside modals, the cart drawer and the palette, and restores focus on close. |
| Command palette | ⌘K / Ctrl-K. Indexes pages, actions, TV filters, all nine episodes (titles + keywords) and the six chapters. |
| `@media (prefers-contrast: more)` | Darkens the muted inks, strengthens hairlines, drops the grain, thickens focus rings. |
| `@media (max-width: 767px)` type floor | Raises every micro-label to at least 11.5px and loosens the widest letter-spacing, so 9.5–11px desktop labels stay legible in the hand. |
| `.pc-tap` / `.pc-tap-row` | Touch targets. `.pc-tap` grows padding and cancels it with equal negative margin, so the hit area reaches 44px without moving the layout; `.pc-tap-row` sets `min-height`. Both are `@media (pointer: coarse)` only. |

Everything above is disabled under `prefers-reduced-motion: reduce`, and
`[data-reveal]` elements are forced visible in that case so no content can be
trapped at `opacity: 0`.

The brands strip was a paged carousel with arrows and dots; it is now a marquee.
The old version is in git history if you prefer it.

## Regenerating the static pages

`npm run build` produces `dist/` as a single-page app. The eight prerendered
folders (`dist/about/index.html` and friends) plus `dist/pages/*.html` are
generated afterwards by driving the built site in a browser, capturing each
route's DOM and writing it out. If you change content, rebuild and regenerate,
or the static HTML will drift from the app.

## Pages

The prototype is a small hash router — no server config, works from `file://`
and any static host. Every page is a shareable link:

| Route | Page |
| --- | --- |
| `#/` | Home — hero, stats, service/calculator/book teasers, testimonials |
| `#/about` | Paul's bio, the four hats, the pillars |
| `#/services` | The three desks, how it works, testimonials |
| `#/calculator` | The top-up vs consolidation engine |
| `#/book` | The Anatomy of Smart Borrowing, chapters, M-Pesa purchase |
| `#/booking` | Booking hub (Calendly when configured) |
| `#/tv-hub` | Video library with filters and search |
| `#/contact` | Contact form, channels, office |

Nav dropdowns deep-link: Services → `#/services` scrolled to a specific desk,
TV Hub → `#/tv-hub` with a filter preset. Add a page by extending `PAGES`, `NAV`
and the route blocks in the render.

## Where form submissions go

Both live forms share one adapter. Edit the two config objects at the top of
`src/PaulChegeConsultancyTV.jsx`, then re-run `node build-prototype.mjs`.

| Sink               | Feeds                | Set                              |
| ------------------ | -------------------- | -------------------------------- |
| `CONTACT_ENDPOINT` | Contact form         | `provider` + `key` (or `url`)     |
| `BOOKING_SINK`     | Booking hub          | `provider: "sheets"` + `url`      |
| `CALENDLY`         | Booking hub diary    | `free` + `paid` event links       |

Leave either unconfigured and that form runs in **demo mode**: it says so on
screen and makes no network call.

`BOOKING_SINK.key` falls back to `CONTACT_ENDPOINT.key`, so with one Web3Forms
key both forms email the desk.

### Option A — Web3Forms (email per submission)

Get a free access key at <https://web3forms.com> using the inbox that should
receive submissions, then:

```js
const CONTACT_ENDPOINT = { provider: "web3forms", key: "your-access-key", ... };
```

Free tier is 250 submissions/month. Delivery is bound to the key's inbox.

### Option B — Google Sheets (a bookings list you can open)

Better for bookings, because you get a row per booking rather than an inbox to
sift. Create a Sheet, then **Extensions → Apps Script**, paste this, and deploy
via **Deploy → New deployment → Web app**, with *Execute as: me* and
*Who has access: anyone*:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const b = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Received', 'Name', 'Email', 'Phone', 'Session',
                     'Date', 'Time', 'Starts at', 'Fee', 'Brief', 'Source']);
  }
  sheet.appendRow([new Date(), b.name, b.email, b.phone, b.session,
                   b.date, b.time, b.startsAt, b.fee, b.brief, b.source]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Copy the `/exec` URL into `BOOKING_SINK`:

```js
const BOOKING_SINK = { provider: "sheets", url: "https://script.google.com/.../exec", ... };
```

Apps Script redirects to a `googleusercontent.com` URL that blocks cross-origin
reads, so the page posts `no-cors` and **cannot read the response**. The row is
still appended; the page just cannot distinguish success from failure, and shows
a locally generated reference. If you need a verified confirmation, put a small
handler of your own in front (`provider: "custom"`).

## Calendly

Paste your two event links and the hub swaps its built-in diary for Calendly's
inline widget — live availability, Calendly's confirmation emails, and the
invite on Paul's calendar:

```js
const CALENDLY = {
  free: "https://calendly.com/<you>/30min",
  paid: "https://calendly.com/<you>/60min",
};
```

The tabs pick the event, the name/email already typed are prefilled, and the
widget assets load only when a link is set. If they cannot load, the panel
falls back to an "open in a new tab" link.

When Calendly and `BOOKING_SINK` are both configured, a scheduled event is also
logged to the Sheet. Calendly's browser event carries only the event and invitee
URIs, so that row records the session, fee and those URIs — **not** the client's
name, email or chosen time. For a complete row, add a Calendly webhook
server-side and write to the Sheet from there.

Without Calendly links the built-in diary is used. It is a demo: it shows fixed
slots and does not know what is already booked, so two people can pick the same
time. This is the main reason to connect Calendly.

## Real-world details — sources and confidence

Everything below is in the `OFFICE` and `SOCIAL` constants at the top of
`src/PaulChegeConsultancyTV.jsx`. **Confirm with Paul before this goes live.**

| Detail | Source | Confidence |
| --- | --- | --- |
| Ciata City Mall, Block A, 2nd Floor, Ridgeways, Kiambu Road, Nairobi | bizsure.co.ke | High — official site, but it is **Bizsure's** office, not a Paul Chege Consultancy address |
| +254 710 890 994 / 0709 784 222, info@bizsure.co.ke, Mon–Fri 8–5 | bizsure.co.ke | High |
| facebook.com/paulchegeconsultancyTv | search + posts | High |
| youtube.com/@paulchege91 | search | High |
| tiktok.com/@paulchegetv | search | High |
| instagram.com/paul.chege.7739 | the saved Instagram page in Downloads | **Low — verify.** Matches his personal Facebook handle, but Instagram blocks unauthenticated checks |
| +254 796 882 372 (WhatsApp / "call the desk") | the book-launch poster | Medium — the poster prints it as the event enquiry line |
| Bio: MA in Finance at KCA University, BBA, career at a leading commercial bank | the book jacket's author blurb | High |
| Foreword by H.E. Rigathi Gachagua; ISBN 978-9914-9204-1-3 | the book jacket | High |
| TikTok 358.7K followers · 15.5M likes | tiktok.com/@paulchegetv, 28 Sep 2026 | High — live number, will drift |
| Facebook 183K followers | facebook.com/paulchegeconsultancyTv, 28 Sep 2026 | High — live number |
| 3.19K YouTube subscribers · 151 videos | youtube.com/@paulchege91, 28 Sep 2026 | High — live number |
| Instagram @paul.chege.7739 · 1,199 followers | instagram.com, 28 Sep 2026 | High — handle now confirmed |
| 9 podcast episodes (ids, titles, durations, views) | the FINANCIAL LITERACY playlist | High — same reading |
| "10K+ happy clients", "4.8/5 rating" | the brand sheet | Unverified — no public source |
| Book launch, Safari Park Hotel, 25 Sep 2026 | his own Facebook post | High |

**The "100K+ YouTube subscribers" figure from the brand sheet is wrong.** The
channel shows **3.19K subscribers and 151 videos**. The site now uses those real
numbers. The brand sheet's figure and the jacket's "over 40 million people" have
both been dropped. If a large, true number is wanted, his Facebook page is the
place to look — search results reported roughly 176,000 likes there, which is a
different metric and worth verifying before it goes on the page.

## TV Hub videos

`VIDEOS` holds the nine real episodes with their YouTube ids. Thumbnails come
from `i.ytimg.com`, and clicking plays the episode in a lightbox using a
`youtube-nocookie.com` embed — no tracking cookie until the viewer presses play,
which is the usual arrangement for embedding on a marketing site.

To refresh the list, re-read the playlist and update the array; there is no
YouTube API key in the page, so nothing updates itself. Adding one later
(YouTube Data API v3) would let the hub list new episodes automatically, but the
key must live server-side.

**The consultancy publishes no street address of its own.** Searches of his
Facebook, TikTok and YouTube turn up none. What is on the page is the Bizsure
brokerage office, labelled as such. If Paul works from somewhere else, or does
not want clients arriving at Bizsure's door, replace `OFFICE` before launch.

## Removed: unsourced social proof

The testimonial grid, the case-study accordion and the reader-review cards have
all been **removed** — they were placeholder copy, not real clients. The site now
makes no claim about a named client or a specific outcome.

To bring social proof back, add real material with written permission. Do **not**
restore any of the following, which came from an AI-generated brief and has no
source:

- named testimonials presented as a "verified testimonial matrix"
- outcome figures (KES 850,000 settled, KES 45,000/month saved, KES 300,000 in bills)
- trust badges "KES 50M+ in claims settled", "10,000+ book readers",
  "100K+ media community members"

- the book's "4.9 · 1,240 readers" rating (also removed)

Published on a licensed broker's site this would be false advertising, and in
Kenya insurance advertising is regulated by the IRA. The platform numbers in
`STATS` and `SOCIAL` are real and checkable — use those.

**Still on the page and still unsourced**, from the brand sheet: the hero's
"4.8/5 from 10,000+ Kenyan households & businesses" strip, the "KES 312,000
average client saving" card, and the "4.8/5 client rating" badge on the About
portrait. Get Paul's real numbers or remove these too.

## Brands carousel

`BRANDS` at the top of the component drives the "Brands" section above the
footer on the home page. Each entry has a `logo` field that is currently empty,
so the card renders a monogram wordmark instead.

All six logos are in `public/img/brands/`, white margins auto-trimmed. Cards are
a fixed 150px with `object-contain`, so mixed aspect ratios line up; logos show
in full colour (no greyscale filter — it wrecked Marnju's dark tile). Bizsure's
card links to bizsure.co.ke.

### Paul's own logo

The supplied file is a 160x160 JPEG whose artwork occupies only 112x88 px — the
rest is white margin, which is why it first looked tiny in the header. Three
assets are derived from it by `tools/build-logo.py`:

| File | What it is | Used for |
| --- | --- | --- |
| `img/logo.png` | full lockup, 672x528, transparent | footer (sits straight on navy) |
| `img/logo-mark.png` | the red P + microphone, 368x260, transparent | header, small sizes |
| `img/favicon.png` | the mark, squared, 512x512 | browser tab |

The pipeline trims the margin, upscales 6x with Lanczos, sharpens, then removes
the white background by flood-filling inward from the edges so the white *inside*
the microphone, the "Paul" pill and the blue bar survives. Re-run it if a better
source arrives:

    python3 tools/build-logo.py <path-to-logo>

**This is upscaled, not true HD.** 112x88 px of real detail cannot become sharp
at any size — the header uses the mark rather than the full lockup because
"CHEGE CONSULTANCY" is unreadable below about 90px tall whatever the resolution.
Ask Paul for the original vector (AI/EPS/SVG) or a PNG at 1000px+; drop it in and
re-run the script and everything sharpens at once. The red/blue palette also sits
apart from the site's navy-and-gold, which is worth a conversation.

The six names came from Paul's own captions, so the associations are real, but
**confirm each brand is happy to be listed** — appearing on a partner wall is a
stronger claim than being tagged in a post. Note Nicmaa's logo reads "ICMAA"
because the N is stylised as the red swoosh.

## Still simulated

- **M-Pesa STK push** — needs a server. Safaricom Daraja requires your consumer
  secret to stay server-side and a public callback URL to receive the result.
- **Slot availability** — only when Calendly is not connected; see above.
- **Cart checkout** — no payment is taken.
