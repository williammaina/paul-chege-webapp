/**
 * A local stand-in for the YouTube Data API v3 `videos.list` endpoint,
 * including the failures that matter: a spent quota, a bad key, and a video
 * that has been deleted or made private (YouTube simply omits it rather
 * than erroring, which is easy to get wrong).
 *
 *   YOUTUBE_API_BASE=http://localhost:4900
 *
 *   POST /_control {mode}   ok | quota | badkey | missing
 *   POST /_bump    {id,by}  move a view count, to prove the page updates
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_YT_PORT || 4900);
let mode = "ok";

const DB = {
  "xApF-msZJ6M": { v: 19342, t: "Why Promitto Is Selling Shares (Bank + Mortgage Plan): Smart or Risky?", d: "PT13M56S", p: "2025-10-28T09:00:00Z" },
  "atqQnaseJ3c": { v: 4431,  t: "Married 11 times, auctioned 5 times, and 10 failed businesses", d: "PT55M31S", p: "2026-01-20T09:00:00Z" },
  "rFvz1p1AhBI": { v: 3502,  t: "Kenya Pipeline Company IPO: What to know before investing", d: "PT38M22S", p: "2026-01-26T09:00:00Z" },
  "Kl-BNPd2Ksg": { v: 2287,  t: "CEO Podcast · Episode 1: From hawker to millionaire entrepreneur", d: "PT51M51S", p: "2025-11-25T09:00:00Z" },
  "Daq2pcruXZg": { v: 1904,  t: "EP01 · Ndukagure lorii ya FRR na ũrimũ nĩũgũtahwo", d: "PT28M5S", p: "2025-09-15T09:00:00Z" },
  "7FFJKnwpEpo": { v: 1731,  t: "NCBA Shares Are Skyrocketing — The Truth Behind the Hype", d: "PT10M59S", p: "2025-10-30T09:00:00Z" },
  "gJXa44cpn_o": { v: 1048,  t: "Mobile Banking Nightmare: Is Your Money Safe?", d: "PT40M27S", p: "2026-05-22T09:00:00Z" },
  "JlPbNG8olcM": { v: 702,   t: "Grace Period or Debt Trap? The Hidden Cost That Can Sink You", d: "PT23M0S", p: "2026-01-18T09:00:00Z" },
  "5koeXz9-R8I": { v: 421,   t: "The health cover that pays YOU the cash instead of the hospital", d: "PT45M15S", p: "2025-11-20T09:00:00Z" },
};

const read = (req) => new Promise((ok, no) => {
  const c = []; req.on("data", (d) => c.push(d));
  req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch (e) { no(e); } });
});
const send = (res, s, b) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };
const gerr = (res, code, reason, message) =>
  send(res, code, { error: { code, message, errors: [{ reason, message }] } });

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/_control") {
    mode = (await read(req)).mode || "ok";
    console.log("🎛  mode →", mode);
    return send(res, 200, { mode });
  }
  if (url.pathname === "/_bump") {
    const b = await read(req);
    if (DB[b.id]) DB[b.id].v += Number(b.by || 1000);
    console.log("📈", b.id, "→", DB[b.id]?.v);
    return send(res, 200, { id: b.id, views: DB[b.id]?.v });
  }

  if (url.pathname === "/videos") {
    if (mode === "quota") return gerr(res, 403, "quotaExceeded", "The request cannot be completed because you have exceeded your quota.");
    if (mode === "badkey") return gerr(res, 400, "keyInvalid", "API key not valid. Please pass a valid API key.");
    if (!url.searchParams.get("key")) return gerr(res, 403, "forbidden", "The request is missing a valid API key.");

    const ids = (url.searchParams.get("id") || "").split(",").filter(Boolean);
    // `missing` drops the first id, the way YouTube drops a video that has
    // been deleted or made private: no error, just an absent item.
    const serve = mode === "missing" ? ids.slice(1) : ids;
    const items = serve.filter((id) => DB[id]).map((id) => ({
      kind: "youtube#video", id,
      snippet: { title: DB[id].t, publishedAt: DB[id].p, channelTitle: "Paul Chege Consultancy TV" },
      contentDetails: { duration: DB[id].d },
      statistics: { viewCount: String(DB[id].v), likeCount: String(Math.round(DB[id].v * 0.031)) },
    }));
    console.log("📺 videos.list ×" + ids.length + " → " + items.length + " returned");
    return send(res, 200, { kind: "youtube#videoListResponse", items,
      pageInfo: { totalResults: items.length, resultsPerPage: items.length } });
  }

  gerr(res, 404, "notFound", "Not Found");
}).listen(PORT, () => {
  console.log("📺 Mock YouTube Data API on http://localhost:" + PORT);
  console.log("   YOUTUBE_API_BASE=http://localhost:" + PORT);
});
