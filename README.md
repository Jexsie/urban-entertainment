# Urban Entertainment · NEON NIGHTS (18+)

Server-rendered event site that sells tickets only after an age check with an
EUDI wallet, through the `age-over-18` presentation configuration of the
`urban-entertainment` tenant in EUDIPLO.

```bash
cp .env.example .env.local   # fill in EUDIPLO_CLIENT_SECRET and APP_SECRET
npm install
npm run dev                  # http://localhost:3001
```

## How the gate works

1. "Verify you're 18+" calls `POST /api/age-check`. The server creates the
   EUDIPLO request with the least-privilege gateway client, keeps EUDIPLO's
   session ID to itself and gives the browser a QR code plus an opaque,
   HttpOnly check cookie.
2. The page polls `GET /api/age-check`. When EUDIPLO reports the session
   `completed` with `age_equal_or_over.18 = true`, the server sets a signed,
   30-minute **age pass** cookie. Only the result is kept, never the claims.
3. `/tickets`, the purchase and the confirmation are rendered only for a
   valid age pass, checked on the server. The checkout cannot be reached by URL.

Failure codes from EUDIPLO are shown as guest-friendly messages
(`claim_value_mismatch` → "Your ID doesn't show that you're 18 or older").

## Same-device flow

With `APP_URL` set to a public `https://` address, the page also offers
"Wallet on this phone? Open it". The wallet then returns the phone's browser
to `/age/return`, which checks that the check cookie belongs to this browser
and that `response_code` matches the session before issuing the pass. On
`localhost`, only the QR code (cross-device) is offered.

## Demo limits

- Checks are kept in memory: one process, lost on restart.
- Results are read by polling; no webhook (localhost cannot receive one).
