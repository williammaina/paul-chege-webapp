/**
 * One-time: turns a Google OAuth client into a refresh token.
 *
 *   node server/tools/google-auth.mjs
 *
 * Run it on a machine with a browser, signed in as the account whose calendar
 * the sessions should land on — Paul's. It prints a line to paste into
 * server/.env. The refresh token does not expire unless it is revoked, the
 * account's password changes, or the OAuth consent screen is left in
 * "Testing" (where Google expires it after seven days — publish the app).
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { loadEnv } from "../env.mjs";

loadEnv();

const PORT = Number(process.env.OAUTH_PORT || 4310);
const REDIRECT = "http://localhost:" + PORT + "/callback";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;

if (!id || !secret) {
  console.error(`
Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first.

  1. console.cloud.google.com → create a project
  2. APIs & Services → Library → enable "Google Calendar API"
  3. APIs & Services → OAuth consent screen
       · External, fill in the app name and your email
       · Add the scope ${SCOPE}
       · Add Paul's Google account as a test user
       · PUBLISH the app, or the refresh token expires after 7 days
  4. Credentials → Create credentials → OAuth client ID → Web application
       · Authorised redirect URI: ${REDIRECT}
  5. Paste the client ID and secret into server/.env, then run this again.
`);
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: id,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",      // this is what produces a refresh token
  prompt: "consent",           // …and this is what makes Google resend it
  state,
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:" + PORT);
  if (url.pathname !== "/callback") { res.writeHead(404); return res.end(); }

  const done = (title, body) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>${title}</title>
      <body style="font:16px/1.6 system-ui;max-width:34rem;margin:18vh auto;padding:0 1.5rem;color:#0A1128">
      <h1 style="font-size:1.4rem">${title}</h1><p style="color:#475569">${body}</p></body>`);
  };

  if (url.searchParams.get("state") !== state) {
    done("Something is wrong", "The state did not match. Close this and run the command again.");
    return;
  }
  const error = url.searchParams.get("error");
  if (error) {
    done("Google said no", "It reported: " + error + ". Close this and try again.");
    console.error("\n✗ " + error + "\n");
    server.close();
    return;
  }

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: url.searchParams.get("code"),
      client_id: id, client_secret: secret,
      redirect_uri: REDIRECT, grant_type: "authorization_code",
    }),
  });
  const body = await r.json().catch(() => ({}));

  if (!body.refresh_token) {
    done("No refresh token came back",
      "Google only sends one on first consent. Remove this app at myaccount.google.com/permissions and run the command again.");
    console.error("\n✗ No refresh_token. Google returned:\n", body, "\n");
    server.close();
    return;
  }

  done("Connected", "Paste the line from your terminal into <code>server/.env</code>. You can close this tab.");
  console.log("\n\x1b[32m✓ Paste this into server/.env:\x1b[0m\n");
  console.log("GOOGLE_REFRESH_TOKEN=" + body.refresh_token + "\n");
  server.close();
});

server.listen(PORT, () => {
  console.log("\nOpen this in a browser, signed in as the account the sessions belong to:\n");
  console.log("  " + authUrl + "\n");
  console.log("Waiting on " + REDIRECT + " …\n");
});
