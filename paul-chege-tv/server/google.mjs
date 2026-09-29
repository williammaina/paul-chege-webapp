/**
 * Google Calendar — real Meet links.
 *
 * On a confirmed booking we create an event on Paul's own calendar with a
 * Meet conference attached and the client as an attendee. Google then does
 * three useful things at once: it mints the Meet link, it puts the session in
 * Paul's diary where he will actually see it, and it emails the client a
 * proper calendar invite from google.com — which is worth more as a trust
 * signal than anything we could send ourselves.
 *
 * Auth is a refresh token for Paul's own Google account (see
 * `node server/tools/google-auth.mjs`). A service account is deliberately not
 * used: without Workspace domain-wide delegation it cannot create Meet links
 * at all, and most one-person businesses are on an ordinary Gmail.
 */

const OAUTH = process.env.GOOGLE_OAUTH_BASE || "https://oauth2.googleapis.com";
const CAL = process.env.GOOGLE_CALENDAR_BASE || "https://www.googleapis.com/calendar/v3";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export function configured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

let token = { value: null, expires: 0 };

async function accessToken() {
  if (token.value && Date.now() < token.expires) return token.value;

  const res = await fetch(OAUTH + "/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    // A revoked or expired refresh token is the one failure a human must fix,
    // so say exactly that rather than burying it in a generic 502.
    const hint = body.error === "invalid_grant"
      ? " — the refresh token has been revoked or expired. Re-run `node server/tools/google-auth.mjs`."
      : "";
    throw new GoogleError("Google would not issue an access token" + hint, res.status, body);
  }
  token = { value: body.access_token, expires: Date.now() + (Number(body.expires_in || 3600) - 60) * 1000 };
  return token.value;
}

/**
 * Creates the event and returns its Meet link.
 *
 * `requestId` is derived from the booking reference, which makes the call
 * idempotent at Google's end: a retry after a timeout re-uses the same
 * conference instead of minting a second one.
 */
export async function createMeeting(b, { organiserEmail, location, phone }) {
  const end = new Date(new Date(b.startsAt).getTime() + b.minutes * 60_000);

  const description = [
    b.session + " with Paul Chege.",
    "",
    "Booking reference: " + b.ref,
    b.amount ? "Paid: KES " + b.amount.toLocaleString("en-KE") + (b.receipt ? " · M-Pesa " + b.receipt : "") : "No charge.",
    b.note ? "\nWhat you asked Paul to prepare:\n" + b.note : "",
    "",
    "Cannot make it? Reschedule free up to 24 hours before — call " + phone + " and quote " + b.ref + ".",
  ].join("\n");

  const event = {
    summary: b.session + " — " + (b.name || "client"),
    description,
    location,
    start: { dateTime: new Date(b.startsAt).toISOString(), timeZone: "Africa/Nairobi" },
    end: { dateTime: end.toISOString(), timeZone: "Africa/Nairobi" },
    // Google emails this person the invite, with the Meet link in it.
    attendees: b.email ? [{ email: b.email, displayName: b.name || undefined }] : [],
    guestsCanModify: false,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }, { method: "email", minutes: 1440 }] },
    conferenceData: {
      createRequest: {
        requestId: "pcc-" + b.ref,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    extendedProperties: { private: { bookingRef: b.ref, mpesaReceipt: b.receipt || "" } },
  };

  const url = CAL + "/calendars/" + encodeURIComponent(CALENDAR_ID) + "/events"
    + "?conferenceDataVersion=1&sendUpdates=" + (b.email ? "all" : "none");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + (await accessToken()), "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleError(body?.error?.message || "Google Calendar refused the event", res.status, body);

  const video = (body.conferenceData?.entryPoints || []).find((e) => e.entryPointType === "video");
  const meetLink = body.hangoutLink || video?.uri || null;

  // The event exists but Google did not attach a conference. Worth knowing:
  // it usually means the account cannot create Meet links, not a transient
  // fault, so retrying will not help.
  if (!meetLink) {
    console.warn("[google] event created without a Meet link —", JSON.stringify(body.conferenceData || {}).slice(0, 200));
  }

  return {
    meetLink,
    eventId: body.id || null,
    eventLink: body.htmlLink || null,
    phone: (body.conferenceData?.entryPoints || []).find((e) => e.entryPointType === "phone")?.uri || null,
  };
}

/** Called when a booking is cancelled, so Paul's diary does not keep ghosts. */
export async function cancelMeeting(eventId) {
  if (!eventId) return false;
  const res = await fetch(
    CAL + "/calendars/" + encodeURIComponent(CALENDAR_ID) + "/events/" + encodeURIComponent(eventId) + "?sendUpdates=all",
    { method: "DELETE", headers: { Authorization: "Bearer " + (await accessToken()) } }
  );
  // 410 means it is already gone, which is the outcome we wanted anyway.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new GoogleError("Google Calendar would not cancel that event", res.status, await res.text().catch(() => ""));
  }
  return true;
}

export class GoogleError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "GoogleError";
    this.status = status || 502;
    this.detail = detail;
  }
}
