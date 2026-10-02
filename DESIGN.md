# Design specification — paulchege.co.ke

The tokens, pairings, motion contracts and component source the site is
built from. Every contrast figure here was computed against the WCAG 2.1
formula, not estimated; the script is reproducible from the hexes below.

Things in the brief that could not be done as written are called out at
the end rather than quietly dropped.

---

## 0. What the references actually contain

Ten screenshots in `~/Pictures/Screenshots` plus the Musemind Dribbble
profile. They are not one language — they are three.

| Group | Shots | Language |
|---|---|---|
| Editorial portrait | Madison, Amelia Carter, Yelena | Cutout or full-bleed subject, oversized condensed display type locked to the baseline, italic serif as counterpoint, status pill |
| Ambient glow | Kumo matcha, Musemind grid | Radial colour blooms, floating rounded tiles on soft drop shadows, light airy surfaces |
| Professional services | Bentol, Health Care LA, Author's Trace | Bento cards, pill nav, metric tiles, one accent per card on a shared neutral |

The third group is the one that transfers. Bentol is a finance-advisor
site and Health Care LA runs three differently coloured cards in a single
row over one surface — which is exactly the problem the advisory lanes
had, solved.

**Palette.** The references split into warm-cream editorial (`#FDF8F0` →
`#F5C87A`), saturated duotone (`#E8491F` / `#0A0A0A`) and deep-green
professional (`#0B3B32` / `#D6F24A`). None is Paul's navy and gold, and
copying a hue set from a photography portfolio onto a regulated
intermediary would be borrowing the wrong thing. What transfers is the
*structure*: one deep neutral, a small set of hot accents used sparingly,
and a near-white for breathing room.

**Motion vocabulary**, inferred from the shots plus Musemind's house
style: staggered word reveals, radial glow tracking the cursor, floating
tiles on light parallax, marquee tickers, counters on metric tiles, pill
badges with a pulsing radar dot. All of it is implemented below.

---

## 1. Colour tokens

Three grounds were tried. Navy and gold was the inherited default. Petrol
and lime came from sampling the ten screenshots — the largest chromatic
cluster across all of them is the #003030 family at hue 180, with a
lime/olive band at 60-90 — and Paul rejected it. Charcoal is where it
landed, and it is the right answer: the Dribbble finance-advisor grid is
overwhelmingly near-black with one hot accent (Jukov black/yellow, Beyond
Coins black/magenta, TGCFlow dark/violet), a neutral ground holds any
accent without a hue clash, and it gives the most contrast headroom of
the three — gold measures 9.13 on the card here against 6.77 on petrol.

### Surfaces

| Token | Hex | Used for |
|---|---|---|
| `--surface-900` | `#081726` | Hero base, the deepest point of the page |
| `--surface-800` | `#0C2238` | Dark section bands — the brand navy |
| `--surface-700` | `#17344F` | Elevated cards on dark |
| `--surface-650` | `#1F4A71` | Card hover lift |
| `--color-cream` | `#FAF8F4` | Light bands |

### Lane accents, measured

Tone, not hue — all three are brand values.

| Token | Hex | Lane | on `#17344F` |
|---|---|---|---|
| `--color-accent-gold` | `#F1C35B` | Borrowing | 7.74 |
| `--color-accent-coral` | `#E6B84C` | Personal & planning | 6.90 |
| `--color-accent-violet` | `#C8B293` | Business & cover | 6.25 |

Text on the grounds (900 / 800 / 700): `#FFFFFF` 18.1 / 16.1 / 12.8,
`#DBE6F2` 14.3 / 12.8 / 10.1, `#B3C4D8` 10.2 / 9.1 / 7.2, `#8FA3BD`
7.0 / 6.3 / 5.0. `#8FA3BD` falls to 3.58 on the 650 hover lift, so it
is never text there.

Borders on dark are `rgba(255,255,255,.10)`, lifting to
`rgba(234,179,8,.45)` on hover. Never a solid grey stroke: at these
surface values a solid border reads as a seam.

### Text

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#F8FAFC` | Headings and emphasis on dark |
| `--text-secondary` | `#E2E8F0` | Body copy on dark |
| `--text-tertiary` | `#CBD5E1` | Supporting lines, captions |
| `--text-muted` | `#94A3B8` | Metadata only, never a sentence |
| `--color-ink` | `#192638` | Body copy on light (15.27:1 on white) |

### Accents

| Token | Hex | Role |
|---|---|---|
| `--gold-400` | `#E6B84C` | Primary accent on dark — eyebrows, rules, active nav |
| `--gold-bright` | `#F1C35B` | Solid CTA fill (navy text sits on it) |
| `--gold-ink` | `#7D5F1A` | **The only gold permitted as text on white** |
| `--amber-500` | `#EAB308` | Hover borders, focus rings, featured gradient |
| `--amber-600` | `#D97706` | Gradient stop and non-text fills only |

### Lane accents

One hue per advisory lane, so three parts of one practice read as three
doors rather than three products. Surface, radius, type and spacing stay
identical across all three; only `--accent` changes, and it drives the
kicker, the gradient edge, the call to action and the hue of the hover
glow.

| Token | Hex | Lane | On `#1E293B` |
|---|---|---|---|
| `--color-accent-gold` | `#E6B84C` | Borrowing | 7.89 |
| `--color-accent-emerald` | `#34D399` | Personal & planning | 7.61 |
| `--color-accent-cyan` | `#22D3EE` | Business & cover | 8.09 |

All three clear AA as body text on the card surface. On white they measure
1.85, 1.92 and 1.81 — like the golds, they are dark-surface accents and
never text on a light band.

### Verified contrast

Foreground against each surface. AA body text needs 4.5:1, AA large needs 3:1.

| Foreground | `#0B132B` | `#0F172A` | `#1E293B` |
|---|---|---|---|
| `#F8FAFC` | 17.57 | 17.06 | 13.98 |
| `#E2E8F0` | 14.91 | 14.48 | 11.87 |
| `#CBD5E1` | 12.38 | 12.02 | 9.85 |
| `#94A3B8` | 7.17 | 6.96 | 5.71 |
| `#E6B84C` | 9.91 | 9.63 | 7.89 |
| `#EAB308` | 9.59 | 9.31 | 7.63 |
| `#D97706` | 5.77 | 5.60 | **4.59** |

Every pairing above clears AA on dark.

**The one failure to know about.** On white, `#D97706` measures **3.19:1**
and `#EAB308` measures **1.92:1**. Both fail AA for body text. Neither may
ever be used as text on a light surface — that is what `--gold-ink`
(`#7D5F1A`, 5.96:1) exists for. The brief proposed the ambers as general
accents; on dark they are excellent, on light they are unreadable.

---

## 2. Type

### The pairing

| Role | Family | Weight / size | Leading |
|---|---|---|---|
| Display (h1) | Source Serif 4 Variable | 600 · `clamp(2.2rem, 1rem+2.15vw, 2.85rem)` | 0.98 |
| Section (h2) | Source Serif 4 Variable | 600 · `clamp(1.85rem, .85rem+2.4vw, 2.6rem)` | 1.02 |
| Card title (h3) | Source Serif 4 Variable | 600 · `1.3rem` | 1.2 |
| Body | Inter Variable | 400 · `1rem`–`1.05rem` | **1.6** |
| Lede | Inter Variable | 400 · `1.05rem` | 1.6 |
| Eyebrow | Inter Variable | 800 · `.7rem` uppercase, `.18em` tracking | 1.2 |
| Metadata | Inter Variable | 400 · `.74rem` | 1.4 |

Headings carry `letter-spacing: -0.028em`; the display line tightens to
`-0.04em`. Numerals use `font-variant-numeric: tabular-nums lining-nums`
so figures in a column line up.

**h1 must always measure larger than h2.** This inverted once already when
the hero gave width to the portrait, and a section heading outranking the
page's own headline is the single most visible hierarchy error available.

### On Playfair Display and Plus Jakarta Sans

Inter is already the body face, self-hosted through `@fontsource-variable`,
so that half of the brief is met.

Playfair Display, Instrument Serif and Plus Jakarta Sans are **not
installable here** — this machine has no network, `npm view` times out, and
only `inter` and `source-serif-4` are vendored. Loading them from the
Google Fonts CDN instead would add a render-blocking third-party request to
a site whose audience is largely on Kenyan mobile data, and I could not
verify the result offline.

Source Serif 4 is a high-contrast transitional serif and is doing the job
Playfair was asked to do. To make the swap when there is a network:

```bash
npm i @fontsource-variable/playfair-display
```

```diff
- import "@fontsource-variable/source-serif-4";
+ import "@fontsource-variable/playfair-display";
```

```diff
- --font-display: "SourceSerifVar", Georgia, "Times New Roman", serif;
+ --font-display: "Playfair Display Variable", Georgia, serif;
```

Playfair's didone stroke contrast thins badly below about 20px, so if it
goes in, the card `h3` should move to Inter 600 rather than follow it.

---

## 3. Layout

### The axis

One container for the whole page, hero included:

```css
.wrap { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }
```

### Section rhythm

Three volumes, so the page scrolls with dynamics rather than at one level:

```css
.section-sm { padding-block: clamp(36px, 3.4vw, 52px); }  /* credential band */
.section    { padding-block: clamp(64px, 6.6vw, 104px); } /* partners, framework, insights */
.section-lg { padding-block: clamp(80px, 8.8vw, 136px); } /* advisory, about, book, contact */
```

### Hero wireframe — asymmetrical two-column

```
┌───────────────────────────────── .wrap 1180 ──────────────────────────────┐
│                                                                            │
│  ┌──────────── 1.15fr ────────────┐   ┌─────────── .85fr ───────────┐      │
│  │ EYEBROW                         │   │      ╭ ambient glow ╮       │      │
│  │                                 │   │   ╭───────────────────╮     │      │
│  │ Understand Money.               │   │   │                   │     │      │
│  │ Borrow Intentionally.           │   │   │     portrait      │     │      │
│  │ Build With Confidence.          │   │   │   (uncropped)     │     │      │
│  │                                 │   │   │                   │     │      │
│  │ Subtitle, 1.6 leading, 52ch     │   │   │                   │     │      │
│  │                                 │   │ ╭─┴───────────────────┤     │      │
│  │ [ Book a Consultation → ]       │   │ │ PAUL'S PERSPECTIVE  │     │      │
│  │   Discover Paul's approach →    │   │ │ glass card, overlaps│     │      │
│  │                                 │   │ ╰─────────────────────╯     │      │
│  └─────────────────────────────────┘   └─────────────────────────────┘      │
│                                                                            │
│  ┌── 01 Personal ──┬── 02 Borrowing ──┬── 03 Business ──┐  jump strip       │
│  └─────────────────┴──────────────────┴─────────────────┘                   │
└────────────────────────────────────────────────────────────────────────────┘
```

Card padding is 32px, rising to 44px at `lg`. The three jump links move out
of the old right-hand column into a strip beneath the fold line, which is
what frees the width for the portrait.

### Portrait framing contract

The file is square, 2047×2048, and Paul occupies **x436 → x1780** — 1344px
wide, centred at 1108 against the file's own centre of 1023. Two rules
follow and both are load-bearing:

1. The frame's aspect ratio must be **≥ 0.656**. Below that the crop
   reaches his shoulders.
2. `object-position` must be **63%**, not 50%. He is not centred in the file.

---

## 4. Components

### Service card

One elevated surface for every card. The previous grid ran three different
treatments — flat navy, plain white, a teal gradient — which made three
related lanes read as three unrelated products.

```jsx
<article className="group relative flex flex-col overflow-hidden rounded-2xl
                    border border-white/10 bg-[#1E293B] p-7 lg:p-8
                    transition-all duration-300 will-change-transform
                    hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-xl
                    hover:shadow-black/40 motion-reduce:transition-none
                    motion-reduce:hover:translate-y-0">
  <p className="text-[.66rem] font-extrabold uppercase tracking-[.13em] text-gold-400">
    {lane.kicker}
  </p>
  <h3 className="mt-1.5 text-[1.55rem] font-semibold leading-tight text-[#F8FAFC]">
    {lane.title}
  </h3>
  <p className="mt-2.5 text-[.9rem] leading-relaxed text-[#CBD5E1]">{lane.lede}</p>

  <ul className="mt-6 border-t border-white/10">
    {lane.items.map((item) => (
      <li key={item.n} className="flex gap-3.5 border-b border-white/10 py-3.5">
        <span className="mt-0.5 shrink-0 text-[.68rem] font-extrabold tabular-nums text-[#94A3B8]">
          {item.n}
        </span>
        <span className="min-w-0">
          <b className="block text-[.93rem] font-semibold leading-snug text-[#F8FAFC]">{item.title}</b>
          <small className="mt-1 block text-[.8rem] leading-relaxed text-[#CBD5E1]">{item.body}</small>
        </span>
      </li>
    ))}
  </ul>

  <button onClick={onBook}
          className="mt-auto self-start pt-7 text-[.86rem] font-extrabold text-gold-400
                     transition-transform duration-300 group-hover:translate-x-1">
    Book a session →
  </button>
</article>
```

Featured lane adds a gradient hairline rather than a second background, so
the surface stays identical and only the edge changes:

```jsx
<div className="rounded-2xl bg-gradient-to-br from-amber-400/70 via-amber-500/25 to-transparent p-px">
  {/* the card above, with border-transparent */}
</div>
```

### Primary CTA, with the shine

```jsx
<button className="group relative overflow-hidden rounded-xl bg-gold-bright px-6 py-3.5
                   font-bold text-navy transition hover:brightness-105
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
  <span className="relative z-10">Book a Consultation →</span>
  <span aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r
                   from-transparent via-white/45 to-transparent
                   transition-transform duration-700 ease-out
                   group-hover:translate-x-full motion-reduce:hidden" />
</button>
```

### Sticky header

```jsx
<header className="sticky top-0 z-50 border-b border-white/10
                   bg-[#0B132B]/80 backdrop-blur-md backdrop-saturate-150">
```

80% rather than 95%: above about 90% the blur has nothing to show through
and the effect is paid for without being seen.

---

## 5. Motion

Every transform is on `transform`/`opacity` only, 300ms, `ease-out`. Hover
lifts are `-translate-y-1`. Everything decorative sits behind
`motion-reduce:` or `motion-safe:`; the shine, the card lift and the
portrait scale all stop for a reduced-motion preference.

---

## 6. Not done as specified

**"Most Popular" badge.** Not added. Paul is a regulated financial
intermediary and that badge is a claim about demand across his advisory
services. No booking data supports it, and inventing one on a page that
takes money is the same category of problem as inventing a testimonial.
The featured treatment is built and the gradient border is wired; give me a
true label and it ships in a line. "Start here" would be honest if the
borrowing lane is genuinely where most people should begin.

**Playfair Display / Plus Jakarta Sans.** Not installable offline. See §2
for the exact two-line swap and the one caveat.

**The floating "Cart 0" badge.** There is no cart on this site. `grep -ri
"cart\|basket"` over `components/`, `app/` and `lib/` returns nothing. The
book is bought through a modal that goes straight to an M-Pesa STK push —
there is no basket to clean up.

**The cropped portrait.** Already fixed before this brief; the framing
contract in §3 is what holds it. Both shoulders clear the frame with about
20px of backdrop to spare at every breakpoint.


---

## 7. Motion

### Easing scale

```css
--ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);    /* entrances */
--ease-out-back:     cubic-bezier(0.34, 1.56, 0.64, 1);/* playful overshoot */
--ease-out-soft:     cubic-bezier(0.22, 0.61, 0.36, 1);/* hover states */
--ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);   /* reversible state */
```

Every transition picks from these, so two elements answering the same
gesture cannot disagree about how it feels.

### What runs, and on what

| Effect | Where | Mechanism |
|---|---|---|
| Staggered word reveal | Hero h1 | `Kinetic` — splits on whitespace, one clip per word, 60ms apart |
| Count-up metrics | Reach figures | `Counter` — parses the leading number, keeps the suffix |
| Rise-in on first sight | Every section | `Reveal` — IntersectionObserver, `translate` not `transform` |
| Magnetic pull | `.magnetic` buttons | One delegated pointer listener and one rAF for the page |
| Card parallax | `.card-tilt` | `useCardDepth` publishes `--px`/`--py` |
| Cursor-tracked glow | `.glow-card` | Spends the same `--px`/`--py` on a radial highlight |
| Gradient hairline | `.edge-accent` | Two background layers, `background-clip` padding-box + border-box |
| Radar ping | `.pulse-dot` | One keyframe on a pseudo-element |
| Ambient mesh | Hero | Raw WebGL2 fbm shader, ~6KB against three.js's 550KB |
| Seamless marquee | Partners | Track duplicated, translated -50%, copy `aria-hidden` |

### Rules

Transform and opacity only. Nothing animates a layout property: a hover
that moves `top` or `height` costs a layout pass per frame on a mid-range
Android, which is most of this audience.

`Reveal` uses the independent `translate` property rather than
`transform`, because the cards it wraps carry their own `transform` for
tilt and a second `transform` would replace the first instead of
composing with it.

Every effect is behind `prefers-reduced-motion`. Reduced motion gets the
finished state on first paint — not a shortened animation, none at all.

### Library choice

**No animation library.** `motion` is in the dependency tree for the
booking modal's `AnimatePresence` and stays there, but nothing in this
layer uses it. The whole kinetic system above is IntersectionObserver plus
CSS custom properties: four small components and about ninety lines of
CSS. Framer Motion's `whileInView` and `staggerChildren` would be more
expressive and would also put a runtime in the critical path of a page
whose audience is largely on Kenyan mobile data, to do what two observers
already do.

`Counter` is the one place with a rAF loop, because a count-up cannot be
expressed as a CSS transition on text content.
