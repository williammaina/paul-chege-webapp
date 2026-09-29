/**
 * Email templates.
 *
 * Tables, inline styles, no external CSS and no web fonts — Outlook and
 * Gmail strip everything else. Every message also ships a plain-text part,
 * because some clients show it and spam filters weigh it.
 *
 * Tone follows the site: say what happened, give the client something they
 * can check, and never promise what has not actually occurred.
 */

const NAVY = "#0A1128";
const GOLD = "#D4AF37";
const GREEN = "#00A651";
const INK = "#2D3748";
const MUTED = "#6B7A90";
const LINE = "#E2E8F0";

const fmt = (n) => "KES " + Number(n || 0).toLocaleString("en-KE");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** 254712345678 → +254 712 345 678. Stored normalised for Safaricom; shown
 *  readable, because a human has to dial it. */
const dialable = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  if (/^254\d{9}$/.test(d)) return "+254 " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9);
  return String(p || "—");
};

const eat = (iso, opts) =>
  new Date(iso).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", ...opts });

const longDate = (iso) => eat(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const clockTime = (iso) => eat(iso, { hour: "numeric", minute: "2-digit", hour12: true });

/* ── chrome ────────────────────────────────────────────────────────────── */

function shell({ preheader, heading, kicker, body, cta, footerNote, site }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#F1F4F9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F4F9;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px -22px rgba(10,17,40,.5);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <tr><td style="background:${NAVY};padding:26px 30px;">
      <div style="font-size:17px;font-weight:800;color:#FFFFFF;letter-spacing:-.2px;">
        Paul Chege <span style="color:${GOLD};">Consultancy TV</span>
      </div>
      <div style="margin-top:5px;font-size:9.5px;font-weight:700;letter-spacing:2.4px;color:#8FA0C0;text-transform:uppercase;">
        Learn &nbsp;·&nbsp; Plan &nbsp;·&nbsp; Build &nbsp;·&nbsp; Prosper
      </div>
    </td></tr>
    <tr><td style="height:3px;background:linear-gradient(90deg,#A8842A,${GOLD},#F3E5AB);font-size:0;line-height:0;">&nbsp;</td></tr>

    <tr><td style="padding:32px 30px 8px;">
      ${kicker ? `<div style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:${MUTED};">${esc(kicker)}</div>` : ""}
      <h1 style="margin:8px 0 0;font-size:23px;line-height:1.25;color:${NAVY};font-weight:800;">${esc(heading)}</h1>
    </td></tr>

    <tr><td style="padding:14px 30px 0;font-size:14.5px;line-height:1.65;color:${INK};">${body}</td></tr>

    ${cta ? `<tr><td style="padding:26px 30px 6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="center" style="background:${cta.colour || GREEN};border-radius:999px;">
          <a href="${esc(cta.href)}" style="display:block;padding:14px 26px;font-size:14.5px;font-weight:800;color:#FFFFFF;text-decoration:none;">${esc(cta.label)}</a>
        </td></tr></table>
      ${cta.sub ? `<p style="margin:10px 0 0;text-align:center;font-size:11.5px;color:${MUTED};">${cta.sub}</p>` : ""}
    </td></tr>` : ""}

    ${footerNote ? `<tr><td style="padding:22px 30px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border-radius:12px;">
        <tr><td style="padding:16px 18px;font-size:12.5px;line-height:1.6;color:${INK};">${footerNote}</td></tr>
      </table></td></tr>` : ""}

    <tr><td style="padding:26px 30px 30px;">
      <div style="border-top:1px solid ${LINE};padding-top:18px;font-size:11.5px;line-height:1.7;color:${MUTED};">
        <strong style="color:${INK};">${esc(site.org)}</strong><br>
        ${esc(site.address)}<br>
        <a href="tel:${esc(site.phone.replace(/\s/g, ""))}" style="color:${MUTED};">${esc(site.phone)}</a>
        &nbsp;·&nbsp; <a href="mailto:${esc(site.email)}" style="color:${MUTED};">${esc(site.email)}</a>
        ${site.licence ? `<br>IRA licence ${esc(site.licence)}` : ""}
        <div style="margin-top:12px;color:#93A1B5;">
          We will never ask you for your M-Pesa PIN — not by email, not by phone.
        </div>
      </div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Key–value rows, the bit people screenshot. */
const rows = (pairs) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 2px;background:#F7F9FC;border-radius:12px;">
    <tr><td style="padding:6px 18px 10px;">
      ${pairs.filter(Boolean).map(([k, v]) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:7px 0;font-size:12.5px;color:${MUTED};">${esc(k)}</td>
          <td align="right" style="padding:7px 0;font-size:12.5px;font-weight:700;color:${NAVY};">${esc(v)}</td>
        </tr></table>`).join("")}
    </td></tr>
  </table>`;

const plain = (lines) => lines.filter((l) => l !== null && l !== undefined).join("\n");

/* ── 1 · the eBook / book receipt ──────────────────────────────────────── */

export function purchaseReceipt(order, { downloadUrl, site }) {
  const digital = order.items.some((i) => i.digital);
  const heading = digital ? "Your eBook is ready" : "Thank you — your order is in";

  const body = `
    <p style="margin:0 0 14px;">Hello ${esc(order.name?.split(" ")[0] || "there")},</p>
    <p style="margin:0 0 6px;">We have received <strong>${fmt(order.amount)}</strong>. Thank you.</p>
    ${rows([
      ["Order", order.id],
      order.receipt ? ["M-Pesa receipt", order.receipt] : null,
      ["Paid", fmt(order.amount)],
      ...order.items.map((i) => [i.qty > 1 ? i.label + " × " + i.qty : i.label, fmt(i.price * i.qty)]),
      order.physical ? ["Delivery", order.town + " · 2–3 working days"] : null,
    ])}`;

  const html = shell({
    preheader: digital ? "Your download link is inside — good for 72 hours." : "Order " + order.id + " confirmed.",
    kicker: "Receipt", heading, body, site,
    cta: downloadUrl ? { label: "Download your eBook", href: downloadUrl, colour: GREEN,
      sub: "The link works for 72 hours and up to six downloads." } : null,
    footerNote: order.physical
      ? `We will call <strong>${esc(order.phone)}</strong> before the courier sets off. Keep your M-Pesa SMS — with order <strong>${esc(order.id)}</strong> it is all you need if anything goes wrong.`
      : `Keep your M-Pesa SMS. With order <strong>${esc(order.id)}</strong> it is all you need if anything goes wrong.`,
  });

  const text = plain([
    heading, "",
    "Hello " + (order.name?.split(" ")[0] || "there") + ",",
    "We have received " + fmt(order.amount) + ". Thank you.", "",
    "Order: " + order.id,
    order.receipt ? "M-Pesa receipt: " + order.receipt : null,
    ...order.items.map((i) => "· " + i.label + (i.qty > 1 ? " x" + i.qty : "")),
    order.physical ? "Delivery to " + order.town + " — 2-3 working days." : null,
    downloadUrl ? "\nDownload (72 hours): " + downloadUrl : null,
    "", site.org + " · " + site.phone,
    "We will never ask you for your M-Pesa PIN.",
  ]);

  return { subject: (digital ? "Your eBook — " : "Order ") + order.id, html, text };
}

/* ── 2 · the booking confirmation ──────────────────────────────────────── */

export function bookingConfirmation(b, { site, icsUrl }) {
  const body = `
    <p style="margin:0 0 14px;">Hello ${esc(b.name?.split(" ")[0] || "there")},</p>
    <p style="margin:0 0 6px;">Your session with Paul is confirmed. Here it is in writing.</p>
    ${rows([
      ["Session", b.session],
      ["Date", longDate(b.startsAt)],
      ["Time", clockTime(b.startsAt) + " EAT (" + b.minutes + " min)"],
      ["Reference", b.ref],
      b.receipt ? ["M-Pesa receipt", b.receipt] : null,
      b.amount ? ["Paid", fmt(b.amount)] : ["Cost", "Free"],
      ["How", b.meetLink ? "Google Meet" : "Paul calls you on " + dialable(b.phone)],
    ])}
    ${b.note ? `<p style="margin:16px 0 0;font-size:13px;color:${MUTED};"><strong style="color:${INK};">What you asked Paul to prepare:</strong><br>${esc(b.note)}</p>` : ""}`;

  const html = shell({
    preheader: longDate(b.startsAt) + " at " + clockTime(b.startsAt) + " EAT · reference " + b.ref,
    kicker: "Confirmed", heading: "You are booked in", body, site,
    cta: b.meetLink
      ? { label: "Join the Google Meet", href: b.meetLink, colour: "#1A73E8", sub: b.meetLink.replace(/^https?:\/\//, "") }
      : (icsUrl ? { label: "Add to your calendar", href: icsUrl, colour: GOLD } : null),
    footerNote: `<strong>If Paul does not join within 10 minutes, you get every shilling back.</strong>
      No form and no argument — send <strong>${esc(b.ref)}</strong> to us on WhatsApp.
      Rescheduling is free up to 24 hours before; call <a href="tel:${esc(site.phone.replace(/\s/g, ""))}" style="color:${INK};font-weight:700;">${esc(site.phone)}</a>.`,
  });

  const text = plain([
    "You are booked in", "",
    b.session,
    longDate(b.startsAt) + " at " + clockTime(b.startsAt) + " EAT (" + b.minutes + " min)",
    "Reference: " + b.ref,
    b.receipt ? "M-Pesa receipt: " + b.receipt : null,
    b.amount ? "Paid: " + fmt(b.amount) : "Cost: free",
    b.meetLink ? "\nJoin: " + b.meetLink : "\nPaul will call you on " + dialable(b.phone) + ".",
    "", "If Paul does not join within 10 minutes you get every shilling back —",
    "send " + b.ref + " to us on WhatsApp. Reschedule free up to 24 hours before:",
    site.phone, "", site.org, site.address,
  ]);

  return { subject: "Confirmed — " + longDate(b.startsAt) + ", " + clockTime(b.startsAt) + " · " + b.ref, html, text };
}

/* ── the free chapter ──────────────────────────────────────────────────── */

/**
 * Nobody has paid anything here, so the message asks for nothing back and
 * does not pretend a download is an order. It says what the link is, how
 * long it lasts, and how to stop hearing from us — which is both decent
 * and what a Kenyan data-protection notice expects.
 */
export function chapter(lead, { site, url, book }) {
  const first = esc(lead.name?.split(" ")[0] || "there");
  const body = `
    <p style="margin:0 0 14px;">Hello ${first},</p>
    <p style="margin:0 0 14px;">Here is the free chapter of <strong>${esc(book)}</strong>.
       It is the part on reading a loan offer before you sign it — the rate you are
       actually paying, the fees behind it, and whether the repayment survives a bad month.</p>
    <p style="margin:0 0 6px;font-size:13px;color:${MUTED};">
       The link works for thirty days. If you lose it, ask again on the site and
       we will send a fresh one.</p>`;

  const html = shell({
    preheader: "Your free chapter of " + book,
    kicker: "Free chapter", heading: "Here is your chapter", body, site,
    cta: { label: "Download the chapter", href: url, colour: GOLD },
    footerNote: `You are getting this because you asked for the chapter on
      <strong>paulchege.co.ke</strong>. We will not add you to anything else without
      asking. Reply to this email and we will remove your address.`,
  });

  const text = plain([
    "Here is your chapter", "",
    "The free chapter of " + book + " — reading a loan offer before you sign it.",
    "", "Download: " + url,
    "", "The link works for thirty days. If you lose it, ask again on the site.",
    "", "You are getting this because you asked for the chapter on paulchege.co.ke.",
    "Reply to this email and we will remove your address.",
    "", site.org,
  ]);

  return { subject: "Your free chapter — " + book, html, text };
}

/* ── 3 · the reminders ─────────────────────────────────────────────────── */

export function reminder(b, { site, kind }) {
  const tomorrow = kind === "24h";
  const heading = tomorrow ? "Your session with Paul is tomorrow" : "Your session with Paul starts in an hour";

  const prep = tomorrow ? `
    <p style="margin:16px 0 6px;font-weight:700;color:${NAVY};">Worth having to hand</p>
    <ul style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.7;color:${INK};">
      <li>Your offer letter or loan statement, if there is one</li>
      <li>What you currently pay each month, and how many months are left</li>
      <li>The one question you most want answered</li>
    </ul>` : "";

  const body = `
    <p style="margin:0 0 14px;">Hello ${esc(b.name?.split(" ")[0] || "there")},</p>
    <p style="margin:0 0 6px;">${tomorrow
      ? "A quick note so it does not creep up on you."
      : "Starting shortly — here is everything you need."}</p>
    ${rows([
      ["Session", b.session],
      ["When", longDate(b.startsAt) + " · " + clockTime(b.startsAt) + " EAT"],
      ["Reference", b.ref],
      ["How", b.meetLink ? "Google Meet" : "Paul calls you on " + dialable(b.phone)],
    ])}
    ${prep}`;

  const html = shell({
    preheader: (tomorrow ? "Tomorrow at " : "In one hour — ") + clockTime(b.startsAt) + " EAT · " + b.ref,
    kicker: tomorrow ? "Tomorrow" : "Starting soon", heading, body, site,
    cta: b.meetLink
      ? { label: tomorrow ? "Your meeting room" : "Join now", href: b.meetLink, colour: "#1A73E8", sub: b.meetLink.replace(/^https?:\/\//, "") }
      : null,
    footerNote: tomorrow
      ? `Cannot make it? Rescheduling is free up to 24 hours before — call <a href="tel:${esc(site.phone.replace(/\s/g, ""))}" style="color:${INK};font-weight:700;">${esc(site.phone)}</a> and quote <strong>${esc(b.ref)}</strong>.`
      : `Anything wrong, ring <a href="tel:${esc(site.phone.replace(/\s/g, ""))}" style="color:${INK};font-weight:700;">${esc(site.phone)}</a> and quote <strong>${esc(b.ref)}</strong>.`,
  });

  const text = plain([
    heading, "",
    b.session,
    longDate(b.startsAt) + " at " + clockTime(b.startsAt) + " EAT",
    "Reference: " + b.ref,
    b.meetLink ? "Join: " + b.meetLink : "Paul will call you on " + dialable(b.phone) + ".",
    tomorrow ? "\nHave to hand: your offer letter or statement, what you pay monthly,\nmonths remaining, and the one question you most want answered." : null,
    "", site.org + " · " + site.phone,
  ]);

  return { subject: (tomorrow ? "Tomorrow: " : "In 1 hour: ") + b.session + " · " + clockTime(b.startsAt), html, text };
}

/* ── 4 · the desk's own copy ───────────────────────────────────────────── */

export function deskNotice(b, { site }) {
  const html = shell({
    preheader: b.ref + " · " + longDate(b.startsAt),
    kicker: "New booking", heading: (b.name || "A client") + " booked a session",
    site,
    body: rows([
      ["Client", b.name || "—"],
      ["Phone", dialable(b.phone)],
      ["Email", b.email || "—"],
      ["Session", b.session],
      ["When", longDate(b.startsAt) + " · " + clockTime(b.startsAt) + " EAT"],
      ["Paid", b.amount ? fmt(b.amount) + (b.receipt ? " · " + b.receipt : "") : "Free"],
      ["Reference", b.ref],
    ]) + (b.note ? `<p style="margin:16px 0 0;font-size:13px;"><strong>Brief:</strong><br>${esc(b.note)}</p>` : ""),
    cta: b.meetLink ? { label: "Open the meeting room", href: b.meetLink, colour: "#1A73E8" } : null,
  });
  return { subject: "New booking · " + (b.name || "client") + " · " + longDate(b.startsAt), html, text: plain([
    "New booking " + b.ref, b.name, dialable(b.phone), b.email, b.session,
    longDate(b.startsAt) + " " + clockTime(b.startsAt) + " EAT",
    b.amount ? "Paid " + fmt(b.amount) : "Free", b.note ? "Brief: " + b.note : null,
  ]) };
}
