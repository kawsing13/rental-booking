# Deployment notes — RentTa

Working notes for the hosted setup. The step-by-step first-time instructions live in
[`README.md`](./README.md) ("Deployment" section); this file is the quick reference for what's
actually running and how the pieces connect.

Last verified: **2026-09-04** — full stack live, browser login working end to end.

## The three platforms

| Piece | Platform | URL | Config source |
|-------|----------|-----|---------------|
| Frontend (React/Vite) | Vercel | https://rentta.vercel.app | Vercel project settings |
| Backend (Express API) | Render | https://rental-booking-backend.onrender.com | [`render.yaml`](./render.yaml) |
| Database (Postgres 16) | Neon (serverless) | — | `DATABASE_URL` on Render |

Each does the piece it's best at. The database is on Neon rather than in Render's Blueprint because
Neon's free tier is more generous; that's why `render.yaml` doesn't declare a database.

Everything deploys straight from GitHub (`kawsing13/rental-booking`, branch `master`) — **every push
to `master` auto-redeploys both Render and Vercel.** No local build/upload step.

## Environment variables

### Render (backend service → Environment tab)

| Var | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://…@…neon.tech/…?sslmode=require` | Neon connection string. `sync: false` in `render.yaml` so Render prompts for it. Not stored in the repo. |
| `CLIENT_ORIGIN` | `https://rentta.vercel.app` | **Must match the Vercel URL exactly, no trailing slash.** CORS blocks the browser from calling the API until it does — see below. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | auto-generated | Render generates these from `render.yaml` (`generateValue: true`). |
| `NODE_ENV` | `production` | |
| Payment vars | mock mode | `PAYMENTS_MOCK_MODE=true`; no real gateway credentials. See `backend/src/services/paymentService.js` `TODO(production)` markers. |

### Vercel (project → Settings → Environment Variables)

| Var | Value |
|-----|-------|
| `VITE_API_URL` | `https://rental-booking-backend.onrender.com/api` |

Vite bakes `VITE_*` vars in **at build time**, so changing this needs a redeploy, not just a restart.
Confirm what's baked in with:
`curl -s https://rentta.vercel.app/assets/index-*.js | grep -o 'https://[^"]*onrender[^"]*'`

### Vercel project settings (not env vars)

- **Root Directory**: `frontend` (Vercel auto-detects the Vite preset from there)
- **Build Command**: `npm run build` (default) → output `dist` (default)
- SPA routing: [`frontend/vercel.json`](./frontend/vercel.json) rewrites all paths to `/index.html`
  so deep links / refreshes on client routes (e.g. `/admin/inventory`) don't 404.

## The CORS gotcha

The backend passes a **single** origin string to `cors()` — [`backend/src/config/env.js`](./backend/src/config/env.js)
(`clientOrigin`), used in [`backend/src/app.js`](./backend/src/app.js). Whatever `CLIENT_ORIGIN` is
set to on Render is the *only* browser origin allowed to call the API with credentials.

Consequences:
- Vercel **preview deployments** (branch URLs like `rental-booking-git-*.vercel.app`) are
  CORS-blocked. Only the production `rentta.vercel.app` works. Making previews work means teaching
  the backend to accept a comma-separated list of origins — not done yet.
- Local dev is unaffected: without `CLIENT_ORIGIN` set locally, `env.js` falls back to
  `http://localhost:5173`.

Check it:
```bash
curl -s -i -X OPTIONS https://rental-booking-backend.onrender.com/api/auth/login \
  -H "Origin: https://rentta.vercel.app" -H "Access-Control-Request-Method: POST" \
  | grep -i access-control-allow-origin
# expect: access-control-allow-origin: https://rentta.vercel.app
```

## Database migrations & seeding

`render.yaml`'s `buildCommand` runs on **every deploy**:
```
npm install && npm run migrate && npm run seed
```
- Migrations (`backend/src/db/migrations`) ARE the schema — no hand-written SQL dump.
- **Both seeders are idempotent** (check-then-skip before inserting). This is load-bearing: they run
  on every redeploy, not as a one-off. If you add seed data, guard it the same way or the build
  breaks on the next deploy.
- No shell access needed on Render (the free tier doesn't have it anyway).

## Demo accounts (seeded)

Password for both: `Password123!`
- `admin@rentalapp.test` — admin
- `customer@rentalapp.test` — customer

## First-deploy order (if rebuilding from scratch)

Later steps need URLs from earlier ones, so:
1. **Neon** — create project, copy connection string.
2. **Render** — New → Blueprint → pick repo → paste connection string as `DATABASE_URL`. Migrate +
   seed run automatically in the build. Copy the service URL.
3. **Vercel** — Add Project → pick repo → Root Directory `frontend` → add `VITE_API_URL` =
   `<render-url>/api` → deploy. Copy the `*.vercel.app` URL.
4. **Back to Render** — set `CLIENT_ORIGIN` to the Vercel URL → save (redeploys). Done.

## Smoke test after a deploy

```bash
# backend up
curl -s https://rental-booking-backend.onrender.com/api/health          # {"status":"ok"}
# frontend up + correct API baked in
curl -s https://rentta.vercel.app/ -o /dev/null -w "%{http_code}\n"      # 200
# end-to-end login through the real CORS path
curl -s -X POST https://rental-booking-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: https://rentta.vercel.app" \
  -d '{"email":"customer@rentalapp.test","password":"Password123!"}'     # returns user + accessToken
```
Render's free tier sleeps after inactivity — the first request after a while takes ~30–60s to wake.

## Favicon

[`frontend/public/favicon.svg`](./frontend/public/favicon.svg) is the RentTa mark: brand
blue→green gradient circle + white house-sheltering-speaker-and-mic glyph. It mirrors
[`frontend/src/components/BrandMark.jsx`](./frontend/src/components/BrandMark.jsx) (same roofline
path `M3 11 12 4l9 7`, same 62% glyph-to-circle ratio) — **keep the two in sync** when touching
branding. Note: SVG comments can't contain a literal `--`, which is easy to trip on when referencing
CSS custom-property names in a comment.
