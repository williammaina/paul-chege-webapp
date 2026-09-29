/**
 * Transactional email.
 *
 * The previous mail.mjs posted to Web3Forms, which is a *notification* relay:
 * it sends to the account owner's inbox, whatever address you put in the
 * payload. So a "receipt to the buyer" would have gone to Paul, every time,
 * and the client would have received nothing. That is fixed here with real
 * transactional providers, all of which are a plain HTTPS POST — no SMTP
 * library, no dependency.
 *
 * Set EMAIL_PROVIDER to resend | brevo | postmark | mailersend | none.
 */

const FROM_NAME = () => process.env.EMAIL_FROM_NAME || "Paul Chege Consultancy TV";
const FROM_ADDR = () => process.env.EMAIL_FROM || "";
const REPLY_TO = () => process.env.EMAIL_REPLY_TO || process.env.RECEIPT_REPLY_TO || "info@bizsure.co.ke";
const BCC = () => process.env.EMAIL_BCC || "";     // Paul's own copy of everything

export function configured() {
  const p = (process.env.EMAIL_PROVIDER || "none").toLowerCase();
  if (p === "none" || !p) return false;
  if (!FROM_ADDR()) return false;
  return !!process.env.EMAIL_API_KEY;
}

export function providerName() {
  return (process.env.EMAIL_PROVIDER || "none").toLowerCase();
}

/**
 * Sends one message. Returns { ok, id } or throws.
 *
 * `attachments` is [{ filename, content (utf8 string), contentType }]; each
 * provider wants it base64 in a slightly different envelope.
 */
export async function send({ to, subject, html, text, attachments = [], replyTo }) {
  if (!configured()) return { ok: false, skipped: "email is not configured" };
  if (!to) return { ok: false, skipped: "no recipient" };

  const provider = providerName();
  const base = (process.env.EMAIL_API_BASE || "").replace(/\/+$/, "");
  const key = process.env.EMAIL_API_KEY;
  const b64 = (s) => Buffer.from(s, "utf8").toString("base64");

  let url, headers, body;

  if (provider === "resend") {
    url = (base || "https://api.resend.com") + "/emails";
    headers = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
    body = {
      from: FROM_NAME() + " <" + FROM_ADDR() + ">",
      to: [to], subject, html, text,
      reply_to: replyTo || REPLY_TO(),
      ...(BCC() ? { bcc: [BCC()] } : {}),
      ...(attachments.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: b64(a.content) })) } : {}),
    };
  } else if (provider === "brevo") {
    url = (base || "https://api.brevo.com/v3") + "/smtp/email";
    headers = { "api-key": key, "Content-Type": "application/json", accept: "application/json" };
    body = {
      sender: { name: FROM_NAME(), email: FROM_ADDR() },
      to: [{ email: to }], subject, htmlContent: html, textContent: text,
      replyTo: { email: replyTo || REPLY_TO() },
      ...(BCC() ? { bcc: [{ email: BCC() }] } : {}),
      ...(attachments.length ? { attachment: attachments.map((a) => ({ name: a.filename, content: b64(a.content) })) } : {}),
    };
  } else if (provider === "postmark") {
    url = (base || "https://api.postmarkapp.com") + "/email";
    headers = { "X-Postmark-Server-Token": key, "Content-Type": "application/json", Accept: "application/json" };
    body = {
      From: FROM_NAME() + " <" + FROM_ADDR() + ">",
      To: to, Subject: subject, HtmlBody: html, TextBody: text,
      ReplyTo: replyTo || REPLY_TO(), MessageStream: process.env.EMAIL_STREAM || "outbound",
      ...(BCC() ? { Bcc: BCC() } : {}),
      ...(attachments.length ? { Attachments: attachments.map((a) => ({ Name: a.filename, Content: b64(a.content), ContentType: a.contentType || "text/plain" })) } : {}),
    };
  } else if (provider === "mailersend") {
    url = (base || "https://api.mailersend.com/v1") + "/email";
    headers = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
    body = {
      from: { email: FROM_ADDR(), name: FROM_NAME() },
      to: [{ email: to }], subject, html, text,
      reply_to: { email: replyTo || REPLY_TO() },
      ...(attachments.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: b64(a.content), disposition: "attachment" })) } : {}),
    };
  } else {
    return { ok: false, skipped: "unknown EMAIL_PROVIDER: " + provider };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const raw = await res.text();
  if (!res.ok) throw new EmailError(provider + " refused the message (" + res.status + "): " + raw.slice(0, 300), res.status);

  let id = null;
  try { const j = JSON.parse(raw); id = j.id || j.messageId || j.MessageID || j.message_id || null; } catch { /* some return empty */ }
  return { ok: true, id };
}

export class EmailError extends Error {
  constructor(message, status) { super(message); this.name = "EmailError"; this.status = status || 502; }
}
