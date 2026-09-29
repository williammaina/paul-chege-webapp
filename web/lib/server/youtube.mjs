/**
 * YouTube Data API — live view counts, durations and titles.
 *
 * The key stays here. A browser calling the API directly would have to ship
 * it in the page, and an exposed key can be used by anyone until it is
 * rotated — YouTube keys are quota-limited, so that is someone else burning
 * Paul's 10,000 units a day.
 *
 * One call covers up to 50 videos and costs a single quota unit, so the
 * whole channel refreshes for almost nothing. The cache exists to keep it
 * that way when the page is popular, not because the API is slow.
 */
const BASE = () => (process.env.YOUTUBE_API_BASE || "https://www.googleapis.com/youtube/v3").replace(/\/+$/, "");
const TTL = Number(process.env.YOUTUBE_CACHE_MINUTES || 180) * 60_000;

export const configured = () => !!process.env.YOUTUBE_API_KEY;

let cache = { at: 0, ids: "", data: null };

/** 19342 → "19K", 1900000 → "1.9M". Matches how YouTube itself shows them. */
export function compact(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return (k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)) + "K";
  }
  const m = n / 1_000_000;
  return (m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)) + "M";
}

/** PT55M31S → "55:31", PT1H2M3S → "1:02:03". */
export function duration(iso) {
  const m = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(iso || ""));
  if (!m) return null;
  const [, d, h, mi, s] = m.map((x) => (x ? Number(x) : 0));
  const hours = d * 24 + h;
  const pad = (n) => String(n).padStart(2, "0");
  return hours ? `${hours}:${pad(mi)}:${pad(s)}` : `${mi}:${pad(s)}`;
}

/** "8mo ago", "1y ago" — the same shape the page already used. */
export function age(published, now = Date.now()) {
  const then = Date.parse(published);
  if (!Number.isFinite(then)) return null;
  const days = Math.max(0, Math.floor((now - then) / 86400000));
  if (days < 1) return "today";
  if (days < 7) return days + "d ago";
  if (days < 31) return Math.floor(days / 7) + "w ago";
  if (days < 365) return Math.floor(days / 30) + "mo ago";
  const y = Math.floor(days / 365);
  return y + "y ago";
}

/**
 * Fetches statistics for the given ids. Returns a map keyed by video id;
 * ids YouTube does not return (deleted, private, made unlisted) are simply
 * absent, and the caller keeps whatever it already had for them.
 */
export async function stats(ids) {
  if (!configured()) throw new YouTubeError("YOUTUBE_API_KEY is not set", 500);
  const list = [...new Set(ids)].filter(Boolean).slice(0, 50);
  if (!list.length) return {};

  const key = list.join(",");
  if (cache.data && cache.ids === key && Date.now() - cache.at < TTL) return cache.data;

  const url = BASE() + "/videos?" + new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: key,
    key: process.env.YOUTUBE_API_KEY,
  });

  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason || "";
    const hint = reason === "quotaExceeded"
      ? " — the daily quota is spent; it resets at midnight Pacific."
      : reason === "keyInvalid" ? " — check YOUTUBE_API_KEY." : "";
    throw new YouTubeError((body?.error?.message || "YouTube refused the request") + hint, res.status, body);
  }

  const out = {};
  for (const item of body.items || []) {
    out[item.id] = {
      id: item.id,
      title: item.snippet?.title || null,
      views: compact(item.statistics?.viewCount),
      viewCount: Number(item.statistics?.viewCount) || 0,
      likes: Number(item.statistics?.likeCount) || 0,
      len: duration(item.contentDetails?.duration),
      age: age(item.snippet?.publishedAt),
      publishedAt: item.snippet?.publishedAt || null,
    };
  }

  cache = { at: Date.now(), ids: key, data: out };
  return out;
}

export function cacheAge() {
  return cache.data ? Math.round((Date.now() - cache.at) / 1000) : null;
}

export class YouTubeError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "YouTubeError";
    this.status = status || 502;
    this.detail = detail;
  }
}
