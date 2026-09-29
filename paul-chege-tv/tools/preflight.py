#!/usr/bin/env python3
"""Launch checklist. Run before deploying:  python3 tools/preflight.py

Fails loudly on anything that must not reach production: unfilled legal
values, the draft banner, demo-mode endpoints, placeholder domains.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "src", "PaulChegeConsultancyTV.jsx")
CFG = os.path.join(ROOT, "public", "config.js")

src = open(SRC, encoding="utf-8").read()
_cfg_raw = open(CFG, encoding="utf-8").read() if os.path.exists(CFG) else ""
# config.js documents every setting with an EXAMPLE of a filled-in value.
# Reading those reported live endpoints that had never been configured — the
# check said "payments.api is set" while it was empty. Comments come out
# before anything is read.
cfg = re.sub(r"/\*.*?\*/", "", _cfg_raw, flags=re.S)
cfg = re.sub(r"^\s*//.*$", "", cfg, flags=re.M)

blockers, warnings, passes = [], [], []

def check(cond, ok, bad, hard=True):
    (passes if cond else (blockers if hard else warnings)).append(ok if cond else bad)

# 1 · legal placeholders
brackets = re.findall(r"⟦([^⟧]+)⟧", src)
check(not brackets,
      "legal values filled in",
      f"{len(brackets)} placeholder(s) still in the legal pages: " + ", ".join(sorted(set(brackets))))

# 2 · the draft banner
check("Draft, pending legal review" not in src,
      "legal draft banner removed",
      "privacy/terms still show the 'Draft, pending legal review' banner — remove it once an advocate has signed off")

# 3 · endpoints
check('key: ""' not in cfg,
      "Web3Forms key set",
      "config.js has no Web3Forms key — the contact form and the checklist download stay in demo mode")
check('url: ""' not in cfg,
      "booking sink set",
      "config.js has no Apps Script URL — bookings are stored by the payment server, but nothing is mirrored to a spreadsheet Paul can open", hard=False)
check('free: ""' not in cfg,
      "Calendly links set",
      "config.js has no Calendly links — the built-in diary is used instead, which is fine; set them only if Paul prefers Calendly", hard=False)

# 4 · the domain
# Either the source default or a config.js override must give an absolute origin.
_src_origin = re.search(r"origin:\s*[\"'](https?://[^\"']+)[\"']", src)
_cfg_origin = re.search(r"site:\s*\{[^}]*?origin:\s*[\"'](https?://[^\"']+)[\"']", cfg, re.S)
check(bool(_src_origin or _cfg_origin),
      "site origin present (" + ((_cfg_origin or _src_origin).group(1) if (_src_origin or _cfg_origin) else "—") + ")",
      "no absolute site origin — canonicals, sitemap and link previews will be wrong", hard=False)

# 5 · unsourced claims that were removed; catch them coming back
for claim in ["10K+ happy", "10,000+ Kenyan", "4.8/5", "KES 312,000", "1,240 readers"]:
    check(claim not in src,
          f"no unsourced claim: {claim}",
          f"unsourced claim is back in the source: '{claim}' — it has no evidence behind it")

# 6 · testimonials must be real or absent
m = re.search(r"const TESTIMONIALS = \[(.*?)\];", src, re.S)
if m and m.group(1).strip():
    check("consent" in m.group(1),
          "testimonials carry a consent field",
          "TESTIMONIALS has entries without a `consent` field — do not publish a quote you cannot show permission for")
else:
    passes.append("no testimonials published (section hides itself)")

# 7 · payments
import os, json as _json
env = ""
if os.path.exists("server/.env"):
    env = open("server/.env").read()

api = re.search(r"payments:\s*\{[^}]*?api:\s*[\"']([^\"']*)[\"']", cfg, re.S)
api = api.group(1).strip() if api else ""

if not api:
    # Blank is correct when the server serves the site too, which is the
    # documented setup — the page probes /api/health and switches itself on.
    passes.append("payments.api blank — the site uses the API on its own origin (correct when `npm run server` serves both)")
else:
    check(api.startswith("https://") or "localhost" in api,
          "payments.api is an encrypted address",
          f"payments.api is plain HTTP ({api}) — M-Pesa details must not cross an unencrypted connection")

# These decide whether real money can move, wherever the API is hosted, so
# they are checked regardless of payments.api. Nesting them under it once
# meant the recommended blank setting skipped them entirely.
for k in ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY"]:
    check(re.search(rf"^{k}=.+$", env, re.M) is not None,
          f"{k} is set",
          f"server/.env has no {k} — the payment server runs in rehearsal mode and charges nobody")

pub = re.search(r"^PUBLIC_URL=(.+)$", env, re.M)
check(pub is not None and pub.group(1).startswith("https://"),
      "PUBLIC_URL is a public HTTPS address",
      "server/.env PUBLIC_URL is not HTTPS — Safaricom will not deliver the payment callback, so paid orders never complete")

base = re.search(r"^MPESA_BASE=(.+)$", env, re.M)
if base and "sandbox" in base.group(1):
    warnings.append("MPESA_BASE still points at the Daraja sandbox — real buyers cannot pay")
if base and "localhost" in base.group(1):
    blockers.append("MPESA_BASE points at the local emulator — no real payment can be taken")

# 7b · the paid booking needs a payee the client can check
if True:
    payee = re.search(r"^PAYEE_NAME=(.+)$", env, re.M)
    check(payee is not None and payee.group(1).strip() != "",
          "PAYEE_NAME is set",
          "server/.env has no PAYEE_NAME — clients are told which name will appear on their M-Pesa prompt, and getting it wrong reads as fraud")
    ira = re.search(r"^IRA_LICENCE=(.+)$", env, re.M)
    check(ira is not None and ira.group(1).strip() != "",
          "IRA licence shown before payment",
          "server/.env has no IRA_LICENCE — a client paying KES 5,000 has nothing to look up", hard=False)
    partyb = re.search(r"^MPESA_TX_TYPE=CustomerBuyGoodsOnline$", env, re.M)
    if partyb:
        pb = re.search(r"^MPESA_PARTY_B=(.+)$", env, re.M)
        check(pb is not None and pb.group(1).strip() != "",
              "MPESA_PARTY_B set for a till",
              "MPESA_TX_TYPE is a till but MPESA_PARTY_B is empty — the push will be accepted and the money will not arrive")

# 7c · Google Meet is optional, but half-configured is worse than off
gid = re.search(r"^GOOGLE_CLIENT_ID=(.+)$", env, re.M)
gsec = re.search(r"^GOOGLE_CLIENT_SECRET=(.+)$", env, re.M)
gref = re.search(r"^GOOGLE_REFRESH_TOKEN=(.+)$", env, re.M)
gset = [bool(x and x.group(1).strip()) for x in (gid, gsec, gref)]
if not any(gset):
    warnings.append("Google Meet is not connected — bookings confirm and Paul phones the client instead of sending a link")
elif not all(gset):
    missing = [n for n, v in zip(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"], gset) if not v]
    blockers.append("Google Meet is half-configured — missing " + ", ".join(missing) + " (run `npm run google:auth`)")
else:
    passes.append("Google Meet connected — sessions get a real room and land in Paul's calendar")
    gbase = re.search(r"^GOOGLE_CALENDAR_BASE=(.+)$", env, re.M)
    if gbase and "localhost" in gbase.group(1):
        blockers.append("GOOGLE_CALENDAR_BASE points at the local emulator — no real Meet link will be created")

# 7d · email
prov = re.search(r"^EMAIL_PROVIDER=(.+)$", env, re.M)
prov = prov.group(1).strip().lower() if prov else "none"
if prov in ("", "none"):
    warnings.append("no EMAIL_PROVIDER — no receipts, no booking confirmations and no session reminders are sent")
elif prov == "web3forms":
    blockers.append("EMAIL_PROVIDER=web3forms cannot send to a buyer — it delivers to the account owner's inbox. Use resend, brevo, postmark or mailersend")
else:
    check(bool(re.search(r"^EMAIL_API_KEY=.+$", env, re.M)),
          "email provider configured (" + prov + ")",
          "EMAIL_PROVIDER is set but EMAIL_API_KEY is empty — nothing will be sent")
    check(bool(re.search(r"^EMAIL_FROM=\S+@\S+$", env, re.M)),
          "a from-address is set",
          "EMAIL_FROM is missing or not an address — providers reject the send")
    ebase = re.search(r"^EMAIL_API_BASE=(.+)$", env, re.M)
    if ebase and "localhost" in ebase.group(1):
        blockers.append("EMAIL_API_BASE points at the local emulator — no real email will be sent")
    if not re.search(r"^DESK_EMAIL=\S+@\S+$", env, re.M):
        warnings.append("no DESK_EMAIL — Paul gets no notice when someone books")

# 7e · test hooks must never ship
check(not re.search(r"^ALLOW_TEST_HOOKS=1$", env, re.M),
      "test hooks are off",
      "ALLOW_TEST_HOOKS=1 is set — the reminder trigger endpoint is exposed; remove it before deploying")

# 7f · YouTube
ytk = re.search(r"^YOUTUBE_API_KEY=(.+)$", env, re.M)
if not (ytk and ytk.group(1).strip()):
    warnings.append("no YOUTUBE_API_KEY — the episodes section shows the view counts baked into the HTML, which drift")
else:
    passes.append("YouTube connected — view counts and durations are live")
    ytb = re.search(r"^YOUTUBE_API_BASE=(.+)$", env, re.M)
    if ytb and "localhost" in ytb.group(1):
        blockers.append("YOUTUBE_API_BASE points at the local emulator — the figures shown would be fake")

# 8 · the eBook that buyers receive
ebook = re.search(r"^EBOOK_PATH=(.+)$", env, re.M)
path = (ebook.group(1).strip() if ebook else "server/assets/anatomy-of-smart-borrowing.pdf")
if os.path.exists(path):
    blob = open(path, "rb").read()
    placeholder = b"PLACEHOLDER" in blob[:20000]
    check(not placeholder,
          "the eBook file is in place",
          f"EBOOK_PATH ({path}) is still the placeholder — buyers would pay KES 999 and receive a note saying so")
else:
    check(not api, "no eBook needed while payments are off",
          f"EBOOK_PATH ({path}) does not exist — an eBook sale would take the money and deliver nothing")

W, B = "\033[33m", "\033[31m"
G, R = "\033[32m", "\033[0m"
print("\nPreflight — Paul Chege Consultancy TV\n" + "─" * 52)
for p in passes:    print(f" {G}pass{R}   {p}")
for w in warnings:  print(f" {W}warn{R}   {w}")
for b in blockers:  print(f" {B}BLOCK{R}  {b}")
print("─" * 52)
print(f" {len(passes)} passed · {len(warnings)} warnings · {len(blockers)} blockers\n")
sys.exit(1 if blockers else 0)
