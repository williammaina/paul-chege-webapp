/**
 * Live view counts.
 *
 * The property under test: **the section never goes blank or lies.** A
 * quota wall, a bad key or a deleted video must leave every episode listed
 * with its last known figures, never an empty grid and never a wrong number
 * presented as live.
 */
import { EPISODES } from "../../web/lib/server/episodes.mjs";   // the one baked list, not a copy

const API = process.env.API || "http://localhost:4300";
const YT = process.env.YT_MOCK || "http://localhost:4900";

let pass = 0, fail = 0;
const ok = (n, c, d = "") => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n); } else { fail++; console.log("  \x1b[31m✗\x1b[0m " + n + (d ? "  → " + d : "")); } };
const get = (u) => fetch(u, { cache: "no-store" }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());
const mode = (m) => post(YT + "/_control", { mode: m });
const eps = () => get(API + "/api/episodes").then((r) => r.body);

console.log("\n\x1b[1mYouTube view counts\x1b[0m\n");

/* ── 1 · live figures ── */
console.log("\x1b[1m1 · live figures\x1b[0m");
{
  await mode("ok");
  const d = await eps();
  ok("the server reports YouTube as the source", d.source === "youtube", d.source);
  ok("every episode is listed", d.items.length === 9, String(d.items.length));
  ok("all of them carry live data", d.items.every((i) => i.live));
  ok("view counts are compacted the way YouTube shows them",
     d.items.every((i) => /^\d+(\.\d)?[KM]?$/.test(i.views)), d.items.map((i) => i.views).join(","));
  ok("durations are parsed out of ISO 8601",
     d.items.every((i) => /^\d+:\d{2}(:\d{2})?$/.test(i.len)), d.items.map((i) => i.len).join(","));
  ok("ages are human", d.items.every((i) => /(today|\d+[dwy] ago|\d+mo ago)/.test(i.age)), d.items.map((i) => i.age).join(","));
  ok("the list is ordered most-watched first",
     d.items.every((x, n, a) => n === 0 || a[n - 1].viewCount >= x.viewCount),
     d.items.map((i) => i.viewCount).join(" "));
  ok("no key is anywhere in the response", !JSON.stringify(d).includes("AIza"));
}

/* ── 2 · the number actually moves ── */
console.log("\n\x1b[1m2 · a count that changes\x1b[0m");
{
  const before = (await eps()).items.find((i) => i.id === "JlPbNG8olcM");
  await post(YT + "/_bump", { id: "JlPbNG8olcM", by: 40000 });
  const after = (await eps()).items;
  const now = after.find((i) => i.id === "JlPbNG8olcM");
  ok("the new figure comes through", now.viewCount > before.viewCount, before.views + " → " + now.views);
  ok("…formatted, not raw", /^\d+(\.\d)?K$/.test(now.views), now.views);
  ok("…and it is re-ranked to the top", after[0].id === "JlPbNG8olcM", after[0].id);
  await post(YT + "/_bump", { id: "JlPbNG8olcM", by: -40000 });
}

/* ── 3 · the quota runs out ── */
console.log("\n\x1b[1m3 · the daily quota is spent\x1b[0m");
{
  await mode("quota");
  const d = await eps();
  ok("every episode is STILL listed", d.items.length === 9, String(d.items.length));
  ok("they fall back to the baked figures", d.source === "baked" && d.items.every((i) => !i.live));
  ok("the figures are real, not blank", d.items.every((i) => i.views && i.len && i.age));
  ok("the reason says what to do about it", /quota/i.test(d.error || ""), d.error);
}

/* ── 4 · a bad key ── */
console.log("\n\x1b[1m4 · the key is wrong\x1b[0m");
{
  await mode("badkey");
  const d = await eps();
  ok("nothing disappears", d.items.length === 9);
  ok("it names the variable to fix", /YOUTUBE_API_KEY/.test(d.error || ""), d.error);
}

/* ── 5 · a video is deleted or made private ── */
console.log("\n\x1b[1m5 · YouTube omits a video\x1b[0m");
{
  await mode("missing");
  const d = await eps();
  ok("the rest still go live", d.source === "youtube" && d.items.filter((i) => i.live).length === 8,
     String(d.items.filter((i) => i.live).length));
  ok("the missing one keeps its last known figures", d.items.length === 9 &&
     d.items.every((i) => i.views && i.len));
  ok("…and is honestly marked as not live", d.items.filter((i) => !i.live).length === 1);
  await mode("ok");
}

/* ── 6 · the page itself ── */
console.log("\n\x1b[1m6 · what the page ships with\x1b[0m");
{
  const html = await fetch(API + "/").then((r) => r.text());
  ok("the API key is not in the HTML", !/AIza[\w-]{10,}/.test(html));
  // These two assert that the episodes and their figures are in the
  // SERVER-RENDERED markup, so a reader with no JavaScript still sees
  // them. They used to check `data-vid="` and `class="ep-meta"`, which
  // tested one particular DOM rather than the property — and broke the
  // moment the page became React, even though every episode was still
  // rendered. React also splits adjacent text nodes with `<!-- -->`, so
  // "19K views" is never one run of characters in the HTML.
  const ids = EPISODES.map((e) => e.id);
  const present = ids.filter((id) => html.includes(id));
  ok("episodes are in the markup, not only fetched",
     present.length === ids.length, `${present.length} of ${ids.length}`);
  ok("baked figures are present for a reader with no server",
     EPISODES.every((e) => html.includes(e.views)),
     EPISODES.filter((e) => !html.includes(e.views)).map((e) => e.views).join(", ") || "all present");
  // The player builds its iframe from a string at click time, so that
  // string legitimately contains "<iframe … youtube". What matters is that
  // no iframe exists in the markup the browser parses.
  const markup = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  ok("no YouTube iframe is in the markup — nothing loads until play is pressed",
     !/<iframe/i.test(markup),
     (markup.match(/<iframe[^>]*>/i) || [""])[0]);
}

console.log("\n" + "─".repeat(58));
console.log(pass + " passed · " + fail + " failed\n");
process.exit(fail ? 1 : 0);
