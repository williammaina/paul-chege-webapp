/**
 * A local stand-in for Safaricom, speaking the exact Daraja wire format:
 * same OAuth shape, same STK push request and response fields, same callback
 * body, same result codes. It exists so the whole flow — prompt, PIN, money,
 * callback, download — can be proven end to end on this machine before anyone
 * touches production credentials.
 *
 * Point the server at it with MPESA_BASE=http://localhost:4400.
 *
 * Drive the "handset" from the control endpoints:
 *   POST /pin/accept   { checkoutRequestId }
 *   POST /pin/cancel   { checkoutRequestId }
 *   POST /pin/wrong    { checkoutRequestId }
 *   POST /pin/nomoney  { checkoutRequestId }
 *   GET  /prompts      what is currently ringing
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT || 4400);
const prompts = new Map();
let n = 0;

const read = (req) => new Promise((ok, no) => {
  const c = []; req.on("data", (d) => c.push(d));
  req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch (e) { no(e); } });
});
const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/** Posts the callback back to whoever asked for the push, exactly as
 *  Safaricom would, including the CallbackMetadata item array. */
async function fire(p, resultCode, resultDesc, meta) {
  const payload = {
    Body: {
      stkCallback: {
        MerchantRequestID: p.merchantRequestId,
        CheckoutRequestID: p.checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: resultDesc,
        ...(meta ? { CallbackMetadata: { Item: meta } } : {}),
      },
    },
  };
  p.result = { code: resultCode, desc: resultDesc };
  try {
    const r = await fetch(p.callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("  ↳ callback →", p.callbackUrl, r.status);
  } catch (e) {
    console.log("  ↳ callback failed (fine — the query sweep should catch it):", e.message);
  }
}

const receipt = () => {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "S" + Array.from({ length: 9 }, () => A[Math.floor(Math.random() * A.length)]).join("");
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname;

  if (path.startsWith("/oauth/v1/generate")) {
    if (!String(req.headers.authorization || "").startsWith("Basic ")) {
      return send(res, 400, { requestId: "mock", errorCode: "400.008.01", errorMessage: "Invalid Authentication passed" });
    }
    return send(res, 200, { access_token: "mock_token_" + Date.now(), expires_in: "3599" });
  }

  if (path === "/mpesa/stkpush/v1/processrequest") {
    if (!String(req.headers.authorization || "").startsWith("Bearer ")) {
      return send(res, 404, { errorCode: "404.001.03", errorMessage: "Invalid Access Token" });
    }
    const b = await read(req);
    if (!/^254[17]\d{8}$/.test(String(b.PhoneNumber))) {
      return send(res, 400, { errorCode: "400.002.02", errorMessage: "Bad Request - Invalid PhoneNumber" });
    }
    if (!Number.isInteger(b.Amount) || b.Amount < 1) {
      return send(res, 400, { errorCode: "400.002.01", errorMessage: "Bad Request - Invalid Amount" });
    }
    const id = "ws_CO_" + (++n) + Date.now().toString().slice(-8);
    const p = {
      checkoutRequestId: id,
      merchantRequestId: "mock-" + n + "-" + Date.now(),
      callbackUrl: b.CallBackURL,
      amount: b.Amount,
      phone: b.PhoneNumber,
      ref: b.AccountReference,
      at: Date.now(),
      result: null,
    };
    prompts.set(id, p);
    console.log("📲 STK PUSH  KES", b.Amount, "→", b.PhoneNumber, "·", b.AccountReference, "·", id);
    console.log("   accept it:  curl -s localhost:" + PORT + "/pin/accept -d '{\"checkoutRequestId\":\"" + id + "\"}'");
    return send(res, 200, {
      MerchantRequestID: p.merchantRequestId,
      CheckoutRequestID: id,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing",
    });
  }

  if (path === "/mpesa/stkpushquery/v1/query") {
    const b = await read(req);
    const p = prompts.get(b.CheckoutRequestID);
    if (!p) return send(res, 500, { errorCode: "500.001.1001", errorMessage: "Invalid CheckoutRequestID" });
    if (!p.result) {
      return send(res, 500, {
        errorCode: "500.001.1001",
        errorMessage: "The transaction is being processed",
        ResultCode: "1037", ResultDesc: "Request is being processed",
      });
    }
    return send(res, 200, {
      ResponseCode: "0", ResponseDescription: "The service request has been accepted successsfully",
      MerchantRequestID: p.merchantRequestId, CheckoutRequestID: b.CheckoutRequestID,
      ResultCode: String(p.result.code), ResultDesc: p.result.desc,
    });
  }

  /* ── the handset ── */
  const act = path.match(/^\/pin\/(accept|cancel|wrong|nomoney|silence)$/);
  if (act) {
    const b = await read(req);
    const p = prompts.get(b.checkoutRequestId) ||
      [...prompts.values()].filter((x) => !x.result).pop();
    if (!p) return send(res, 404, { error: "no prompt waiting" });

    if (act[1] === "accept") {
      console.log("👆 PIN accepted ·", p.checkoutRequestId);
      await fire(p, 0, "The service request is processed successfully.", [
        { Name: "Amount", Value: p.amount },
        { Name: "MpesaReceiptNumber", Value: receipt() },
        { Name: "TransactionDate", Value: Number(new Date().toISOString().replace(/\D/g, "").slice(0, 14)) },
        { Name: "PhoneNumber", Value: Number(p.phone) },
      ]);
    } else if (act[1] === "cancel") {
      console.log("✋ cancelled ·", p.checkoutRequestId);
      await fire(p, 1032, "Request cancelled by user");
    } else if (act[1] === "wrong") {
      await fire(p, 2001, "The initiator information is invalid.");
    } else if (act[1] === "nomoney") {
      await fire(p, 1, "The balance is insufficient for the transaction");
    } else {
      p.result = { code: 1037, desc: "DS timeout user cannot be reached" };
      console.log("🔇 silence ·", p.checkoutRequestId, "(no callback sent — the sweep must find it)");
    }
    return send(res, 200, { ok: true, checkoutRequestId: p.checkoutRequestId });
  }

  if (path === "/prompts") {
    return send(res, 200, [...prompts.values()].map((p) => ({
      checkoutRequestId: p.checkoutRequestId, amount: p.amount, phone: p.phone,
      ref: p.ref, settled: !!p.result, result: p.result,
    })));
  }

  send(res, 404, { error: "not a Daraja endpoint" });
}).listen(PORT, () => {
  console.log("🟩 Mock Safaricom Daraja on http://localhost:" + PORT);
  console.log("   Any consumer key/secret works. Prompts wait for you to press a PIN.");
});
