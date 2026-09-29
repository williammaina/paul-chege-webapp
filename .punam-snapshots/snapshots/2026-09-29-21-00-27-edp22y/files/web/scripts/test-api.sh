#!/usr/bin/env bash
# Run the API suite against the Next.js server, on mocks.
#
# `.env.local` holds real Daraja credentials and Next loads it in dev with
# a precedence that beats the shell — so without moving it aside, every
# test STK push goes to the real Safaricom sandbox, the mock has no record
# of it, and four of the five suites fail in a way that looks like a code
# regression and is not. It took two wasted runs to find that.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(dirname "$HERE")"
# A free port, chosen now, rather than a fixed one.
#
# A fixed port means a server somebody left running answers instead of the
# one this script starts — `next start` prints EADDRINUSE and exits, the
# suites happily test the stale server, and the failures look like code
# regressions. That has cost three runs. The port is now picked at random
# and the script refuses to continue unless the server it reaches is the
# server it started.
PORT="${PORT:-$(node -e "const s=require('net').createServer();s.listen(0,()=>{console.log(s.address().port);s.close()})")}"
STORE="$(mktemp -d)"
printf '{}\n' > "$STORE/bookings.json"
printf '{}\n' > "$STORE/orders.json"

restore() {
  [ -f "$HERE/.env.local.testing" ] && mv "$HERE/.env.local.testing" "$HERE/.env.local" || true
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap restore EXIT

[ -f "$HERE/.env.local" ] && mv "$HERE/.env.local" "$HERE/.env.local.testing"

for m in daraja google email youtube; do
  lsof -t -iTCP:"$(case $m in daraja) echo 4400;; google) echo 4500;; email) echo 4600;; youtube) echo 4900;; esac)" \
    -sTCP:LISTEN >/dev/null 2>&1 || node "$ROOT/paul-chege-tv/server/mock-$m.mjs" >/dev/null 2>&1 &
done
sleep 1.5

cd "$HERE"

# A production build, started with `next start`. `next dev` refuses to run
# a second instance for the same directory, so a dev server left open by a
# human silently defeats the whole harness; and the built server is what
# actually ships.
npx next build --webpack > /tmp/pc-next-build.log 2>&1 || { tail -20 /tmp/pc-next-build.log; exit 1; }

BOOKING_STORE="$STORE/bookings.json" ORDER_STORE="$STORE/orders.json" \
MPESA_BASE=http://localhost:4400 MPESA_CONSUMER_KEY=k MPESA_CONSUMER_SECRET=s \
MPESA_SHORTCODE=174379 MPESA_PASSKEY=p PUBLIC_URL="http://localhost:$PORT" \
DOWNLOAD_MAX=3 HOLD_MINUTES=0.5 ALLOW_TEST_HOOKS=1 SERVE_SITE=0 \
GOOGLE_CLIENT_ID=x GOOGLE_CLIENT_SECRET=y GOOGLE_REFRESH_TOKEN=z \
GOOGLE_OAUTH_BASE=http://localhost:4500 GOOGLE_CALENDAR_BASE=http://localhost:4500/calendar/v3 \
EMAIL_PROVIDER=resend EMAIL_API_BASE=http://localhost:4600 EMAIL_API_KEY=re_test \
EMAIL_FROM=hello@paulchege.co.ke DESK_EMAIL=desk@bizsure.co.ke \
YOUTUBE_API_KEY=AIzaTEST YOUTUBE_API_BASE=http://localhost:4900 YOUTUBE_CACHE_MINUTES=0 \
  npx next start --port "$PORT" > /tmp/pc-next-test.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  curl -sf -o /dev/null "http://localhost:$PORT/api/health" && break || sleep 1
done

# The server must be ours: alive, on our port, and with the test hooks the
# suites need. Without this check a stale server answers and every failure
# is attributed to the code.
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "the server exited before it was ready:" >&2
  tail -20 /tmp/pc-next-test.log >&2
  exit 1
fi
if ! curl -sf -o /dev/null "http://localhost:$PORT/api/health"; then
  echo "no server answered on $PORT" >&2; exit 1
fi
hooks=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
          -d '{"now":0}' "http://localhost:$PORT/api/_reminders/run")
if [ "$hooks" != "200" ]; then
  echo "the server on $PORT is not this harness's (test hooks answered $hooks, wanted 200)." >&2
  echo "Something else is listening, or ALLOW_TEST_HOOKS did not reach it." >&2
  exit 1
fi
echo "server $SERVER_PID on :$PORT"

fail=0
for t in test-flow test-booking test-meet test-email test-youtube; do
  printf '%-14s ' "$t"
  if out=$(API="http://localhost:$PORT" DESK_EMAIL=desk@bizsure.co.ke \
             node "$ROOT/paul-chege-tv/server/$t.mjs" 2>&1); then
    echo "$out" | grep -E 'passed · ' || { echo 'NO RESULT'; fail=1; }
  else
    echo "$out" | grep -E 'passed · ' || { echo 'ERRORED'; fail=1; }
  fi
done
exit $fail
