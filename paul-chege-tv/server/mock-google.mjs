/**
 * A local stand-in for Google's OAuth and Calendar endpoints, speaking the
 * shapes the real ones do — including the awkward parts: a conference that
 * arrives asynchronously, an `invalid_grant` on a revoked token, and a 403
 * rate limit.
 *
 *   GOOGLE_OAUTH_BASE=http://localhost:4500
 *   GOOGLE_CALENDAR_BASE=http://localhost:4500/calendar/v3
 *
 * Control it:
 *   POST /_control {mode}   ok | flaky | noconference | revoked | ratelimit
 *   GET  /_events           what has been "created"
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_GOOGLE_PORT || 4500);
let mode = "ok";
let failuresLeft = 0;
const events = [];
let n = 0;

const read = (req) => new Promise((ok, no) => {
  const c = []; req.on("data", (d) => c.push(d));
  req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch (e) { no(e); } });
});
const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};
const gerror = (res, status, message, reason) =>
  send(res, status, { error: { code: status, message, errors: [{ message, reason }] } });

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;

  if (p === "/_control") {
    const b = await read(req);
    mode = b.mode || "ok";
    failuresLeft = b.mode === "flaky" ? (b.failures ?? 2) : 0;
    console.log("🎛  mode →", mode, failuresLeft ? "(" + failuresLeft + " failures)" : "");
    return send(res, 200, { mode, failuresLeft });
  }
  if (p === "/_events") return send(res, 200, events);
  if (p === "/_reset") { events.length = 0; mode = "ok"; return send(res, 200, { ok: true }); }

  /* ── OAuth ── */
  if (p === "/token") {
    if (mode === "revoked") {
      return send(res, 400, { error: "invalid_grant", error_description: "Token has been expired or revoked." });
    }
    // Deliberately short-lived. The real thing lasts an hour, which would
    // mean a test never exercises the refresh path — and refresh failure is
    // the one Google fault that needs a human, so it must be covered.
    return send(res, 200, { access_token: "ya29.mock." + Date.now(), expires_in: 61, token_type: "Bearer" });
  }

  /* ── Calendar ── */
  const create = p.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events$/);
  if (create && req.method === "POST") {
    if (!String(req.headers.authorization || "").startsWith("Bearer ")) {
      return gerror(res, 401, "Invalid Credentials", "authError");
    }
    if (mode === "ratelimit") return gerror(res, 403, "Rate Limit Exceeded", "rateLimitExceeded");
    if (mode === "flaky" && failuresLeft > 0) {
      failuresLeft -= 1;
      console.log("💥 simulated failure (" + failuresLeft + " left)");
      return gerror(res, 503, "Backend Error", "backendError");
    }

    const b = await read(req);
    const wantsConference = !!b.conferenceData?.createRequest
      && url.searchParams.get("conferenceDataVersion") === "1";
    const id = "evt" + (++n) + Date.now().toString(36);

    // Google keys the conference off requestId: the same id returns the same
    // Meet link rather than minting a second one.
    const rid = b.conferenceData?.createRequest?.requestId;
    const existing = events.find((e) => e._requestId && e._requestId === rid);
    if (existing) {
      console.log("♻️  same requestId → same conference:", existing.hangoutLink);
      return send(res, 200, existing);
    }

    const code = Math.random().toString(36).slice(2, 5) + "-" +
                 Math.random().toString(36).slice(2, 6) + "-" +
                 Math.random().toString(36).slice(2, 5);
    const link = "https://meet.google.com/" + code;

    const event = {
      id,
      htmlLink: "https://calendar.google.com/event?eid=" + id,
      summary: b.summary, description: b.description, location: b.location,
      start: b.start, end: b.end, attendees: b.attendees || [],
      extendedProperties: b.extendedProperties,
      status: "confirmed",
      _requestId: rid,
      ...(mode === "noconference" || !wantsConference ? {} : {
        hangoutLink: link,
        conferenceData: {
          conferenceId: code,
          conferenceSolution: { key: { type: "hangoutsMeet" }, name: "Google Meet" },
          entryPoints: [
            { entryPointType: "video", uri: link, label: "meet.google.com/" + code },
            { entryPointType: "phone", uri: "tel:+254-20-000-0000", pin: "123456789" },
          ],
        },
      }),
    };
    events.push(event);
    console.log("📅 event", id, event.hangoutLink || "(no conference)",
      b.attendees?.length ? "· invited " + b.attendees.map((a) => a.email).join(", ") : "",
      url.searchParams.get("sendUpdates") === "all" ? "· invite emailed" : "");
    return send(res, 200, event);
  }

  const one = p.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events\/([^/]+)$/);
  if (one && req.method === "DELETE") {
    const i = events.findIndex((e) => e.id === decodeURIComponent(one[2]));
    if (i === -1) return gerror(res, 410, "Resource has been deleted", "deleted");
    console.log("🗑  cancelled", events[i].id);
    events.splice(i, 1);
    res.writeHead(204); return res.end();
  }

  gerror(res, 404, "Not Found", "notFound");
}).listen(PORT, () => {
  console.log("🟦 Mock Google (OAuth + Calendar) on http://localhost:" + PORT);
  console.log("   GOOGLE_OAUTH_BASE=http://localhost:" + PORT);
  console.log("   GOOGLE_CALENDAR_BASE=http://localhost:" + PORT + "/calendar/v3");
});
