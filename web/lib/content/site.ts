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

export type Service = {
  n: string;
  kicker?: string;
  title: string;
  body: string;
  cta: string;
  tone: "dark" | "sand" | "light" | "claims" | "planning" | "education" | "decision";
  icon?: string;
};

export const services: Service[] = [
  { n: "01", tone: "dark", icon: "◎", title: "Personal Financial Advisory",
    body: "Where your money actually goes, what it is costing you, and the two or three changes that will matter most this year.",
    cta: "Book a session" },
  { n: "02", tone: "claims", kicker: "Cover & claims", title: "Declined Claims & Cover Placement",
    body: "A claim turned down, or cover you are not certain you have. Paul reads the policy with you, finds what it actually says, and tells you whether the refusal stands.",
    cta: "Book a session" },
  { n: "03", tone: "sand", icon: "%", title: "Smart Borrowing & Debt Strategy",
    body: "The offer letter, read out loud before you sign it — the real rate, the fees behind it, and whether the repayment survives a bad month.",
    cta: "Book a session" },
  { n: "04", tone: "planning", kicker: "Plan with purpose", title: "Financial Planning & Goal Setting",
    body: "A school fee, a plot, a car, a move. What it costs, when it is reachable, and what has to change for the date to hold.",
    cta: "Book a session" },
  { n: "05", tone: "education", kicker: "Knowledge that travels", title: "Financial Education & Workshops",
    body: "Keynotes and workshops for teams and institutions — the same material as the episodes, delivered in your room.",
    cta: "View programmes" },
  { n: "06", tone: "light", icon: "↗", title: "Business & SME Advisory",
    body: "Cash flow, working capital and the financing question in front of you, for a business that has outgrown guesswork.",
    cta: "Book a session" },
  { n: "07", tone: "decision", kicker: "Before you commit", title: "Loan & Financing Decision Review",
    body: "Bring the term sheet before you commit. Structure, affordability and what the whole thing costs by the end of the term.",
    cta: "Book a session" },
  { n: "08", tone: "dark", icon: "⌂", title: "Mortgage & Asset Financing Readiness",
    body: "What you can genuinely afford, what the bank will ask you for, and the total cost over the full term — before you start the application.",
    cta: "Book a session" },
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
