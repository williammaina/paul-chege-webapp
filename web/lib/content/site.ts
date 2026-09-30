/**
 * Every fact on the page, in one place.
 *
 * Paul is a regulated intermediary, so nothing here may be decorative.
 * Each reach figure was read off the platform itself and carries the date
 * it was read; if a number cannot be sourced it does not go on the page.
 */

export const site = {
  name: "Paul Chege",
  role: "Financial Advisor • Author • Educator • Speaker",
  phone: "+254 796 882 372",
  phoneHref: "tel:+254796882372",
  email: "hello@paulchege.co.ke",
  // No street address until Paul gives one. The previous entry was the
  // office of a brand he has worked with, not his own.
  city: "Nairobi, Kenya",
  youtube: "https://www.youtube.com/@paulchege91",
  tiktok: "https://www.tiktok.com/@paulchegetv",
  facebook: "https://www.facebook.com/paulchegeconsultancyTv",
} as const;

export const nav = [
  { href: "#home", label: "Home" },
  { href: "#brands", label: "Partners" },
  { href: "#services", label: "Advisory" },
  { href: "#about", label: "About" },
  { href: "#book", label: "The Book" },
  { href: "#insights", label: "Insights" },
  { href: "#contact", label: "Contact" },
] as const;

export const reach = [
  { value: "358.7K", label: "TikTok followers", sub: "15.5M likes", href: site.tiktok },
  { value: "183K", label: "Facebook followers", sub: "Community", href: site.facebook },
  { value: "151", label: "Videos published", sub: "YouTube", href: site.youtube },
  { value: "546K+", label: "Combined audience", sub: "Read 28 Sep 2026", href: null },
] as const;

export const brands = [
  { name: "Mjengo Flexi Limited", kind: "Construction finance", file: "mjengo-flexi.webp" },
  { name: "Nicmaa Home & Office Furniture", kind: "Workspace fit-out", file: "nicmaa.webp" },
  { name: "Chic Logistics", kind: "Transport & logistics", file: "chic-logistics.webp" },
  { name: "Bizsure Insurance Brokers", kind: "Insurance", file: "bizsure.webp" },
  { name: "Marnju Tiles", kind: "Building & finishes", file: "marnju-tiles.webp" },
  { name: "Capital Mabati", kind: "Roofing & materials", file: "capital-mabati.webp" },
] as const;

/**
 * Advisory, as three lanes rather than eight cards.
 *
 * Eight equally weighted cards, seven of which said "Book a session", asked
 * the visitor to tell apart three different names for "bring me the loan
 * paper before you sign it". They are one decision, so they are one lane.
 * The old numbering survives on each item so a returning visitor can still
 * find the thing they remember.
 */
export type LaneItem = {
  n: string;
  title: string;
  body: string;
};

export type Lane = {
  n: string;
  tone: "borrowing" | "personal" | "business";
  kicker: string;
  title: string;
  lede: string;
  items: LaneItem[];
};

export const lanes: Lane[] = [
  {
    n: "01",
    tone: "borrowing",
    kicker: "Before you sign",
    title: "Borrowing",
    lede: "An offer letter, a restructure or a mortgage application — read out loud before you commit to it.",
    items: [
      { n: "03", title: "Smart borrowing & debt strategy",
        body: "The real rate, the fees behind it, and whether the repayment survives a bad month." },
      { n: "07", title: "Loan & financing decision review",
        body: "Bring the term sheet. Structure, affordability, and what the whole thing costs by the end of the term." },
      { n: "08", title: "Mortgage & asset financing readiness",
        body: "What you can genuinely afford and what the bank will ask you for, before you start the application." },
    ],
  },
  {
    n: "02",
    tone: "personal",
    kicker: "Your own money",
    title: "Personal & planning",
    lede: "Where the money is going now, and what has to change for the thing you are saving toward to arrive on time.",
    items: [
      { n: "01", title: "Personal financial advisory",
        body: "Where your money actually goes, what it is costing you, and the two or three changes that matter most this year." },
      { n: "04", title: "Financial planning & goal setting",
        body: "A school fee, a plot, a car, a move. What it costs, when it is reachable, and what has to change for the date to hold." },
    ],
  },
  {
    n: "03",
    tone: "business",
    kicker: "Business & cover",
    title: "Business & cover",
    lede: "Capital and cash flow for a business that has outgrown guesswork, and the policy that was supposed to pay and did not.",
    items: [
      { n: "06", title: "Business & SME advisory",
        body: "Cash flow, working capital, and the financing question actually in front of you." },
      { n: "02", title: "Declined claims & cover placement",
        body: "Paul reads the policy with you, finds what it says, and tells you whether the refusal stands." },
    ],
  },
];

export const framework = [
  { n: 1, title: "Understand", body: "Gain clarity on your financial position and goals." },
  { n: 2, title: "Borrow", body: "Evaluate borrowing choices and understand their cost." },
  { n: 3, title: "Build", body: "Use capital and resources to create opportunities." },
  { n: 4, title: "Protect", body: "Think about resilience, obligations and risk." },
  { n: 5, title: "Grow", body: "Build toward lasting financial wellbeing." },
] as const;

export const bookFacts = {
  title: "The Anatomy of Smart Borrowing",
  subtitle: "Understanding loans before you engage.",
  blurb: "Six chapters on how lending actually works in Kenya — written for the borrower, not the lender.",
  foreword: "H.E. Rigathi Gachagua",
  isbn: "978-9914-9204-1-3",
  topics: ["Banks & financial institutions", "Loan agreements", "Interest rates", "Credit score",
           "Asset financing", "Vehicle loans", "Business growth", "Financial freedom"],
} as const;

export const speaking = [
  { icon: "🎤", title: "Keynotes & Panels", body: "Borrowing, money and financial literacy." },
  { icon: "👥", title: "Corporate Workshops", body: "Sessions built for teams and institutions." },
  { icon: "▣", title: "Financial Wellness", body: "Education around everyday money decisions." },
  { icon: "◉", title: "Media & Commentary", body: "Interviews and expert commentary." },
] as const;

/**
 * The credential band under the hero.
 *
 * Everything here is already elsewhere on the page — it was just in small
 * grey type three screens down, below a carousel of six SME logos. A sitting
 * Deputy President writing the foreword is the strongest single fact Paul
 * has, and it was ranked below "Nicmaa Home & Office Furniture".
 *
 * Nothing goes in this array that Paul cannot evidence on request.
 */
export const proof = {
  headline: "Foreword by H.E. Rigathi Gachagua",
  headlineSub: "Deputy President of Kenya",
  facts: [
    { value: "Sept 2026", label: "Launched at Safari Park Hotel", sub: "Nairobi" },
    { value: "546K+", label: "Combined audience", sub: "Read 28 Sep 2026" },
    { value: "151", label: "Episodes published", sub: "YouTube" },
  ],
} as const;

/**
 * Anonymised case outcomes — the honest substitute for testimonials.
 *
 * Paul is a regulated intermediary. Reviews need the client's written
 * consent, and neither a review nor an outcome may be invented, so this
 * array ships empty and the section does not render at all until Paul
 * supplies real cases. That is deliberate: an empty section is a gap, an
 * invented one is a false claim about a financial service.
 *
 * Each entry is one thing that actually happened, with identifying detail
 * removed. Paul writes it; nobody else does. Shape:
 *
 *   {
 *     tag: "Declined claim",
 *     headline: "KES 380,000 reinstated after re-reading the exclusion.",
 *     body: "The insurer refused on a clause that did not apply to the ...",
 *     detail: "Nairobi · 2025",
 *   }
 *
 * `disclaimer` renders whenever the section does, because a past outcome is
 * not a promise of a future one and the page has to say so.
 */
export type CaseOutcome = {
  tag: string;
  headline: string;
  body: string;
  detail: string;
};

export const caseOutcomes: CaseOutcome[] = [];

export const outcomesDisclaimer =
  "Real cases, with identifying details removed and shared with permission. " +
  "Every situation differs — a past outcome is not a guarantee of a future one.";
