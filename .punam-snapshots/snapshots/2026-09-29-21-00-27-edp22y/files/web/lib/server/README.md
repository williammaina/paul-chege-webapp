# Domain modules

The logic behind M-Pesa, the booking diary, Google Meet, email and the
YouTube figures. Zero dependencies, plain ESM, no framework.

They live here because the Next.js app is the product from v0.2.0 onward,
and the legacy server in `paul-chege-tv/server/index.mjs` imports them from
here rather than the other way round. There is **one copy**: the 185
assertions in `paul-chege-tv/server/test-*.mjs` exercise the same code the
Route Handlers call.

Deliberately framework-free. Nothing in here imports from `next`, touches a
`Request`, or knows what a Route Handler is — the HTTP layer is the part
that changed, and keeping the domain ignorant of it is what made swapping
that layer a morning's work rather than a rewrite.

| | |
| --- | --- |
| `env.mjs` | Reads `.env`, with no dependency on dotenv. |
| `daraja.mjs` | OAuth, STK push, and the STK query whose answer must not be mistaken for a verdict while the buyer is still holding their phone. |
| `store.mjs` | Orders, on disk, written atomically. |
| `bookings.mjs` | The diary. Holds, lapses and confirmations. |
| `google.mjs` | Calendar events and Meet links. |
| `email.mjs` | Receipts and reminders through a transactional provider. |
| `templates.mjs` | The message bodies, HTML and plain text. |
| `youtube.mjs` | Live view counts, cached, with the key never leaving the server. |
