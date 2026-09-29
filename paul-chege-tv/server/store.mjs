/**
 * Order store.
 *
 * A JSON file behind an append-only write queue. This is deliberately the
 * smallest thing that is actually correct for one small business: no database
 * to run, no migrations, and a file you can open and read when a buyer calls
 * to say their book never arrived. Swap it for Postgres by re-implementing
 * the six exported functions.
 */
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const FILE = resolve(process.env.ORDER_STORE || new URL("./data/orders.json", import.meta.url).pathname);
const TOKEN_HOURS = Number(process.env.DOWNLOAD_TTL_HOURS || 72);
const MAX_DOWNLOADS = Number(process.env.DOWNLOAD_MAX || 6);

let orders = load();
/** Writes are serialised so two callbacks landing together cannot clobber
 *  each other, and go via a temp file so a crash mid-write cannot leave a
 *  truncated JSON file behind. */
let writing = Promise.resolve();

function load() {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf8")) || {};
  } catch (err) {
    console.error("[store] orders.json is unreadable, starting empty:", err.message);
    return {};
  }
}

function persist() {
  writing = writing.then(() => {
    try {
      mkdirSync(dirname(FILE), { recursive: true });
      const tmp = FILE + "." + process.pid + ".tmp";
      writeFileSync(tmp, JSON.stringify(orders, null, 2));
      renameSync(tmp, FILE);
    } catch (err) {
      console.error("[store] could not persist orders:", err.message);
    }
  });
  return writing;
}

export function flushed() { return writing; }

export function create(fields) {
  const id = "PC" + randomBytes(4).toString("hex").toUpperCase();
  orders[id] = {
    id,
    uuid: randomUUID(),
    status: "pending",       // pending → paid | cancelled | timeout | failed
    createdAt: new Date().toISOString(),
    downloads: 0,
    ...fields,
  };
  persist();
  return orders[id];
}

export function get(id) { return orders[id] || null; }

export function byCheckoutId(checkoutRequestId) {
  return Object.values(orders).find((o) => o.checkoutRequestId === checkoutRequestId) || null;
}

export function update(id, patch) {
  if (!orders[id]) return null;
  orders[id] = { ...orders[id], ...patch, updatedAt: new Date().toISOString() };
  persist();
  return orders[id];
}

/**
 * Mints the download grant. The token is what the buyer's browser presents to
 * collect the file, so it is generated here — on the server, only after
 * Safaricom has confirmed the money moved — and never derived from anything
 * the client sent.
 */
export function grantDownload(id) {
  const order = orders[id];
  if (!order) return null;
  const token = randomBytes(24).toString("base64url");
  update(id, {
    downloadToken: token,
    downloadExpires: Date.now() + TOKEN_HOURS * 3600 * 1000,
    downloads: 0,
  });
  return token;
}

/**
 * Exchanges a token for the order it unlocks, or an explanation of why not.
 * Compared in constant time: a download token is a bearer credential, and a
 * timing oracle on it is a real hole even though the window is small.
 */
export function redeem(token) {
  if (!token || typeof token !== "string" || token.length > 128) {
    return { ok: false, reason: "That download link is not valid." };
  }
  const order = Object.values(orders).find((o) => {
    if (!o.downloadToken || o.downloadToken.length !== token.length) return false;
    try {
      return timingSafeEqual(Buffer.from(o.downloadToken), Buffer.from(token));
    } catch { return false; }
  });

  if (!order) return { ok: false, reason: "That download link is not valid." };
  if (order.status !== "paid") return { ok: false, reason: "That order has not been paid." };
  if (Date.now() > (order.downloadExpires || 0)) {
    return { ok: false, reason: "That download link has expired. Reply to your receipt and we will send a fresh one." };
  }
  if (order.downloads >= MAX_DOWNLOADS) {
    return { ok: false, reason: "That link has already been used " + MAX_DOWNLOADS + " times. Reply to your receipt for a fresh one." };
  }

  update(order.id, { downloads: order.downloads + 1, lastDownloadAt: new Date().toISOString() });
  return { ok: true, order };
}

/** Orders still waiting on Safaricom, oldest first — the reconciler's input. */
export function stale(olderThanMs) {
  const cut = Date.now() - olderThanMs;
  return Object.values(orders).filter(
    (o) => o.status === "pending" && o.checkoutRequestId && new Date(o.createdAt).getTime() < cut
  );
}

export function all() { return Object.values(orders); }
