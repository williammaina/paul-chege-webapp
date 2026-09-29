/**
 * The chapter list.
 *
 * Somebody who gives an email address for a free chapter has not bought
 * anything, so they do not belong in the order store: mixing them in
 * would put non-customers in the same file the payment flow reconciles,
 * and make "how many orders" a question with two answers.
 *
 * Deliberately small. An address, when it arrived, where from, and a
 * token so the link in their email can be honoured. No tracking, no
 * profile — this is a list to send a chapter to, not a CRM.
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(process.env.LEAD_STORE || join(HERE, "data", "leads.json"));

const TOKEN_HOURS = Number(process.env.CHAPTER_TOKEN_HOURS || 720);   // 30 days
const MAX_DOWNLOADS = Number(process.env.CHAPTER_MAX || 10);

let db = load();

function load() {
  try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return {}; }
}

function persist() {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    const tmp = FILE + ".tmp";
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, FILE);              // atomic: a crash cannot truncate the list
  } catch (err) {
    console.error("[leads] could not persist:", err.message);
  }
}

const norm = (e) => String(e || "").trim().toLowerCase();

/** A shape that will not bounce. Not an attempt to prove deliverability. */
export function validEmail(email) {
  const e = norm(email);
  return e.length >= 6 && e.length <= 160 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
}

/**
 * Records the address and returns a fresh token.
 *
 * Asking twice is not an error — people lose emails. The same address
 * gets a new token and the request is counted, so the list shows demand
 * rather than one row that silently absorbs it.
 */
export function capture(email, meta = {}) {
  const id = norm(email);
  const token = randomBytes(24).toString("base64url");
  const prev = db[id];
  db[id] = {
    email: id,
    name: String(meta.name || prev?.name || "").slice(0, 80),
    source: String(meta.source || "chapter").slice(0, 40),
    firstAskedAt: prev?.firstAskedAt || new Date().toISOString(),
    lastAskedAt: new Date().toISOString(),
    asks: (prev?.asks || 0) + 1,
    token,
    tokenExpires: Date.now() + TOKEN_HOURS * 3600 * 1000,
    downloads: prev?.downloads || 0,
  };
  persist();
  return db[id];
}

/** Constant-time, so a wrong token cannot be found by timing the reply. */
export function redeem(token) {
  const given = Buffer.from(String(token || ""));
  for (const lead of Object.values(db)) {
    if (!lead.token) continue;
    const mine = Buffer.from(lead.token);
    if (mine.length !== given.length) continue;
    if (!timingSafeEqual(mine, given)) continue;
    if (Date.now() > lead.tokenExpires) return { ok: false, reason: "That link has expired. Ask for the chapter again and we will send a fresh one." };
    if (lead.downloads >= MAX_DOWNLOADS) return { ok: false, reason: "That link has been used too many times. Ask again and we will send a fresh one." };
    lead.downloads += 1;
    persist();
    return { ok: true, lead };
  }
  return { ok: false, reason: "That link is not valid." };
}

export const count = () => Object.keys(db).length;
export const all = () => Object.values(db);
