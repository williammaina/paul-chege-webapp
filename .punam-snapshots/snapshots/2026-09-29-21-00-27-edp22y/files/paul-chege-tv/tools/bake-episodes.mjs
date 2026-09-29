/**
 * Writes today's YouTube figures into the static HTML.
 *
 * The page fetches live numbers from /api/episodes when a server is there,
 * but the file is also handed round on its own. This is what keeps that
 * copy from quietly ageing: run it before you package, and the baked
 * figures are current on the day you send it.
 *
 *   YOUTUBE_API_KEY=... node tools/bake-episodes.mjs path/to/index.html [...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "../server/env.mjs";
import * as youtube from "../server/youtube.mjs";

loadEnv();

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node tools/bake-episodes.mjs <index.html> [more.html ...]");
  process.exit(1);
}
if (!youtube.configured()) {
  console.error("YOUTUBE_API_KEY is not set — see server/.env.example");
  process.exit(1);
}

// The ids are read out of the markup, so this never drifts from the page.
const first = readFileSync(files[0], "utf8");
const ids = [...new Set([...first.matchAll(/data-vid="([\w-]+)"/g)].map((m) => m[1]))];
if (!ids.length) {
  console.error("no data-vid attributes found — is that the right file?");
  process.exit(1);
}
console.log("reading", ids.length, "videos from YouTube…");

let stats;
try {
  stats = await youtube.stats(ids);
} catch (err) {
  console.error("✗", err.message);
  process.exit(1);
}

const missing = ids.filter((id) => !stats[id]);
if (missing.length) {
  console.warn("⚠ YouTube returned nothing for:", missing.join(", "),
    "\n  (deleted, private or unlisted — their baked figures are left as they are)");
}

for (const file of files) {
  let html = readFileSync(file, "utf8");
  let changed = 0;

  for (const [id, s] of Object.entries(stats)) {
    // Each card is one <article …data-vid="ID"> … </article> block; rewrite
    // only the two spans inside it, so nothing else in the file can be hit.
    const card = new RegExp(`(<article class="ep[^"]*" data-vid="${id}"[\\s\\S]*?</article>)`);
    html = html.replace(card, (block) => {
      const before = block;
      block = block.replace(/(<span class="ep-len">)[^<]*(<\/span>)/, `$1${s.len}$2`);
      block = block.replace(/(<span class="ep-meta">)[^<]*(<\/span>)/,
        `$1${s.views} views &#183; ${s.age}$2`);
      if (block !== before) changed += 1;
      return block;
    });
  }

  writeFileSync(file, html);
  console.log(`  ${file}: ${changed} card(s) updated`);
}

const top = Object.values(stats).sort((a, b) => b.viewCount - a.viewCount)[0];
if (top) console.log(`\nmost watched right now: ${top.views} — ${top.title.slice(0, 60)}`);
console.log("done. Remember the hero card's \"Most watched\" claim is static markup;");
console.log("if the leader has changed, move that card by hand.");
