/**
 * Safaricom Daraja — the only file that talks to Safaricom.
 *
 * Everything here speaks the real wire format documented at
 * https://developer.safaricom.co.ke. Pointing MPESA_BASE at the sandbox, at
 * production, or at the local emulator in mock-daraja.mjs changes nothing else.
 */

const BASE = () => (process.env.MPESA_BASE || "https://sandbox.safaricom.co.ke").replace(/\/+$/, "");

/** Daraja hands out a bearer token that lives 3600s. Re-fetching it on every
 *  call is both slow and rate-limited, so it is cached until a minute before
 *  it expires. */
let token = { value: null, expires: 0 };

export async function accessToken() {
  if (token.value && Date.now() < token.expires) return token.value;

  const key = need("MPESA_CONSUMER_KEY");
  const secret = need("MPESA_CONSUMER_SECRET");
  const basic = Buffer.from(key + ":" + secret).toString("base64");

  const res = await fetch(BASE() + "/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + basic },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new DarajaError("Safaricom refused our credentials", res.status, body);
  }

  token = {
    value: body.access_token,
    expires: Date.now() + (Number(body.expires_in || 3600) - 60) * 1000,
  };
  return token.value;
}

/** 20260928214530 — Daraja wants a local-time stamp, not UTC, and Safaricom
 *  runs on EAT. Deriving it from the machine clock breaks on a UTC server. */
export function timestamp(now = new Date()) {
  const eat = new Date(now.getTime() + 3 * 3600 * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    eat.getUTCFullYear() + p(eat.getUTCMonth() + 1) + p(eat.getUTCDate()) +
    p(eat.getUTCHours()) + p(eat.getUTCMinutes()) + p(eat.getUTCSeconds())
  );
}

function password(shortcode, passkey, ts) {
  return Buffer.from(shortcode + passkey + ts).toString("base64");
}

/**
 * Normalises anything a Kenyan will actually type into the 2547XXXXXXXX /
 * 2541XXXXXXXX form Daraja insists on. Returns null when it is not a Kenyan
 * mobile number — the caller turns that into a 400 rather than letting
 * Safaricom reject it half a second later.
 */
export function msisdn(raw) {
  const d = String(raw || "").replace(/[^\d]/g, "");
  let n = d;
  if (n.startsWith("254")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  // A bare "712345678" is already in the right shape.
  if (!/^[17]\d{8}$/.test(n)) return null;
  return "254" + n;
}

/** Fires the STK push. The handset prompt appears within a couple of seconds. */
export async function stkPush({ phone, amount, reference, description, callbackUrl }) {
  const shortcode = need("MPESA_SHORTCODE");
  const passkey = need("MPESA_PASSKEY");
  const party = process.env.MPESA_PARTY_B || shortcode;
  const type = (process.env.MPESA_TX_TYPE || "CustomerPayBillOnline").trim();
  const ts = timestamp();

  const res = await fetch(BASE() + "/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + (await accessToken()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password(shortcode, passkey, ts),
      Timestamp: ts,
      TransactionType: type,
      Amount: Math.round(amount),          // Daraja rejects decimals outright.
      PartyA: phone,
      PartyB: party,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: reference.slice(0, 12),
      TransactionDesc: description.slice(0, 13),
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ResponseCode !== "0") {
    throw new DarajaError(friendly(body), res.status, body);
  }
  return {
    checkoutRequestId: body.CheckoutRequestID,
    merchantRequestId: body.MerchantRequestID,
    customerMessage: body.CustomerMessage,
  };
}

/**
 * Asks Safaricom what became of a push. This is the safety net: if the
 * callback never reaches us — a dropped connection, a tunnel that died, a
 * firewall — the order still resolves, because we ask.
 */
export async function stkQuery(checkoutRequestId) {
  const shortcode = need("MPESA_SHORTCODE");
  const passkey = need("MPESA_PASSKEY");
  const ts = timestamp();

  const res = await fetch(BASE() + "/mpesa/stkpushquery/v1/query", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + (await accessToken()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password(shortcode, passkey, ts),
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const body = await res.json().catch(() => ({}));

  // While the buyer is still holding their phone, Daraja answers this query
  // with HTTP 500 and errorCode 500.001.1001 — and, misleadingly, a
  // ResultCode that looks like a verdict ("1037"). Treating that as an answer
  // writes off a sale eight seconds in, while the PIN is still being typed.
  // A verdict counts only when the query itself succeeded.
  const settled = res.ok && String(body.ResponseCode) === "0" && body.ResultCode !== undefined;
  if (!settled) return { ok: false, pending: true, raw: body };

  // ResultCode 1032 = the customer cancelled; 1037 = they never responded.
  // Those are real answers, and come back as data rather than as errors.
  return { ok: true, code: body.ResultCode, desc: body.ResultDesc, raw: body };
}

/** Turns Safaricom's terse codes into something a buyer can act on. */
export function readResult(code, desc) {
  const c = String(code);
  if (c === "0") return { state: "paid", message: "Payment received." };
  if (c === "1032") return { state: "cancelled", message: "You cancelled the prompt on your phone." };
  if (c === "1037") return { state: "timeout", message: "The prompt timed out. It may not have reached your phone." };
  if (c === "1") return { state: "failed", message: "There was not enough money in your M-Pesa account." };
  if (c === "2001") return { state: "failed", message: "That M-Pesa PIN was wrong." };
  if (c === "1019") return { state: "timeout", message: "The transaction expired before you confirmed it." };
  if (c === "1001") return { state: "failed", message: "Another M-Pesa prompt is already open on that phone. Finish or cancel it, then try again." };
  return { state: "failed", message: desc || "M-Pesa could not complete the payment." };
}

function friendly(body) {
  const m = String(body?.errorMessage || body?.ResponseDescription || "");
  if (/invalid phonenumber|invalid partya/i.test(m)) return "That does not look like an M-Pesa number.";
  if (/invalid amount/i.test(m)) return "That amount cannot be charged.";
  if (/subscriber|unable to lock/i.test(m)) return "Safaricom could not reach that number. Check it is on and has network.";
  return m || "M-Pesa did not accept the request.";
}

function need(name) {
  const v = process.env[name];
  if (!v) throw new DarajaError("Missing " + name + " — see server/.env.example", 500, { config: true });
  return v;
}

export class DarajaError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "DarajaError";
    this.status = status || 502;
    this.detail = detail;
  }
}

/** True once every credential the flow needs is present. */
export function configured() {
  return ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY"]
    .every((k) => !!process.env[k]);
}
