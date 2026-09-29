/**
 * A local stand-in for a transactional email provider (Resend's shape).
 * Captures everything sent so tests can assert on it, and can be told to
 * fail so the "a bounce must not break a payment" rule is exercised.
 *
 *   EMAIL_PROVIDER=resend EMAIL_API_BASE=http://localhost:4600 EMAIL_API_KEY=x
 *
 *   GET  /_inbox          everything sent
 *   POST /_control {mode} ok | fail
 *   POST /_reset
 */
import { createServer } from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";

const PORT = Number(process.env.MOCK_EMAIL_PORT || 4600);
const OUT = new URL("./data/outbox/", import.meta.url).pathname;
const inbox = [];
let mode = "ok";

const read = (req) => new Promise((ok, no) => {
  const c = []; req.on("data", (d) => c.push(d));
  req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch (e) { no(e); } });
});
const send = (res, s, b) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };

createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;

  if (p === "/_inbox") return send(res, 200, inbox);
  if (p === "/_reset") { inbox.length = 0; mode = "ok"; return send(res, 200, { ok: true }); }
  if (p === "/_control") { const b = await read(req); mode = b.mode || "ok"; return send(res, 200, { mode }); }

  if (p === "/emails" && req.method === "POST") {
    if (!String(req.headers.authorization || "").startsWith("Bearer ")) {
      return send(res, 401, { name: "validation_error", message: "API key is invalid" });
    }
    if (mode === "fail") return send(res, 500, { name: "internal_error", message: "Something went wrong" });

    const b = await read(req);
    const id = "msg_" + (inbox.length + 1) + "_" + Date.now().toString(36);
    const rec = {
      id, to: Array.isArray(b.to) ? b.to[0] : b.to, from: b.from, subject: b.subject,
      html: b.html, text: b.text, bcc: b.bcc || null,
      attachments: (b.attachments || []).map((a) => ({
        filename: a.filename, content: Buffer.from(a.content, "base64").toString("utf8"),
      })),
      at: new Date().toISOString(),
    };
    inbox.push(rec);

    // Write each message out so a human can open it in a browser and judge
    // how it actually looks, which no assertion can do.
    try {
      mkdirSync(OUT, { recursive: true });
      writeFileSync(OUT + id + ".html", rec.html || "");
    } catch { /* not important enough to fail a send */ }

    console.log("✉️  " + rec.to + "  —  " + rec.subject +
      (rec.attachments.length ? "  [" + rec.attachments.map((a) => a.filename).join(", ") + "]" : ""));
    return send(res, 200, { id });
  }

  send(res, 404, { message: "not found" });
}).listen(PORT, () => {
  console.log("✉️  Mock email provider on http://localhost:" + PORT);
  console.log("   Messages are also written to server/data/outbox/ so you can open them.");
});
