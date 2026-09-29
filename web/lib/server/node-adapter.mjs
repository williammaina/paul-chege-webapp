/**
 * Run a Node-style `(req, res)` handler from a Route Handler.
 *
 * The API is one router, shared. Next speaks Web `Request`/`Response`; the
 * router speaks Node's `IncomingMessage`/`ServerResponse`. Rather than
 * reimplement six hundred lines of orchestration in TypeScript and let the
 * two drift, this translates at the boundary.
 *
 * The response side is a real Writable, not a string buffer, because the
 * eBook download pipes a read stream straight into it.
 */
import { PassThrough, Readable } from "node:stream";

class ResponseCollector extends PassThrough {
  constructor() {
    super();
    this.statusCode = 200;
    this.headersSent = false;
    this._headers = {};
    this._ready = new Promise((resolve) => { this._resolveReady = resolve; });
  }
  setHeader(name, value) { this._headers[String(name).toLowerCase()] = value; }
  getHeader(name) { return this._headers[String(name).toLowerCase()]; }
  removeHeader(name) { delete this._headers[String(name).toLowerCase()]; }
  writeHead(status, headersOrMessage, maybeHeaders) {
    this.statusCode = status;
    const headers = typeof headersOrMessage === "object" ? headersOrMessage : maybeHeaders;
    for (const [k, v] of Object.entries(headers || {})) this.setHeader(k, v);
    this.headersSent = true;
    this._resolveReady();
    return this;
  }
  end(...args) {
    // A handler may end without writeHead — 204s and the CORS preflight do.
    if (!this.headersSent) { this.headersSent = true; this._resolveReady(); }
    return super.end(...args);
  }
}

/** Build the Node-shaped request the router expects from a Web Request. */
async function toNodeRequest(request) {
  const url = new URL(request.url);
  const headers = {};
  for (const [k, v] of request.headers) headers[k.toLowerCase()] = v;

  const body = request.body
    ? Readable.fromWeb(request.body)
    : Readable.from([]);

  // The router reads `req.url` as a path plus query, the way Node gives it.
  body.method = request.method;
  body.url = url.pathname + url.search;
  body.headers = headers;
  body.socket = { remoteAddress: headers["x-forwarded-for"]?.split(",")[0]?.trim() || "127.0.0.1" };
  return body;
}

export async function runNodeHandler(handler, request) {
  const req = await toNodeRequest(request);
  const res = new ResponseCollector();

  // Start the handler but do not await it: a streamed download writes its
  // body over many ticks and only settles once the stream is finished.
  const done = Promise.resolve(handler(req, res)).catch((err) => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: err?.message || "Something went wrong." }));
  });

  await Promise.race([res._ready, done]);
  await res._ready;

  const headers = new Headers();
  for (const [k, v] of Object.entries(res._headers)) {
    if (v === undefined || v === null) continue;
    // Content-Length is computed by the runtime; a stale one truncates.
    if (k === "content-length") continue;
    if (Array.isArray(v)) { for (const one of v) headers.append(k, String(one)); }
    else headers.set(k, String(v));
  }

  const status = res.statusCode;
  const empty = status === 204 || status === 304;
  return new Response(empty ? null : Readable.toWeb(res), { status, headers });
}
