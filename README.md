![Rental Booking App](./docs/banner.svg)

# Rental Booking App (Tables, Chairs & Karaoke Sets)

A reservation platform for a party/event rental business: customers browse a catalog, check
real-time availability, and book tables, chairs, and karaoke sets online; admins manage inventory,
approve/track bookings, schedule deliveries, and pull reports. Three apps, one backend:

```
backend/    Node.js + Express + PostgreSQL (Sequelize) REST API
frontend/   React (Vite) web app - customer + admin, light-blue theme
mobile/     Flutter customer app - same API, with local caching for offline viewing
```

See [API_CONTRACT.md](./API_CONTRACT.md) for the full endpoint reference (used to build both clients).

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker, see below)
- Flutter SDK 3.x (for the mobile app)

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit DB credentials / JWT secrets as needed
```

Start Postgres. Easiest via Docker:

```bash
docker run -d --name rental-booking-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rental_booking \
  -p 5432:5432 postgres:16-alpine
```

Run migrations (these ARE the schema - see `src/db/migrations`) and seed demo data:

```bash
npm run migrate
npm run seed
```

Start the API:

```bash
npm run dev   # http://localhost:4000, auto-reloads on changes
```

Demo accounts created by the seeder (password for both: `Password123!`):
- `admin@rentalapp.test` - role `admin`
- `customer@rentalapp.test` - role `customer`

### Notes on payments

`GCASH`/`MAYA` run in **mock mode** by default (`PAYMENTS_MOCK_MODE=true` in `.env`) since no live
gateway credentials were provided - payments "succeed" instantly so the rest of the booking/payment
flow is fully testable. To wire up a real gateway later, fill in `GCASH_API_KEY`/`MAYA_API_KEY`, flip
`PAYMENTS_MOCK_MODE=false`, and implement the real HTTP call in `src/services/paymentService.js`
(the `TODO(production)` comments mark exactly where).

### Tearing down / resetting the DB

```bash
npm run migrate:undo   # repeat, or add a count, to roll back
npm run seed:undo
```

## 2. Frontend (web)

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL defaults to http://localhost:4000/api
npm run dev              # http://localhost:5173
```

`CLIENT_ORIGIN` in the backend `.env` must match this URL for CORS to allow requests (defaults to
`http://localhost:5173`, matching Vite's default port).

Customer routes: `/`, `/items/:id`, `/booking/review`, `/my-bookings`, `/profile`, `/notifications`.
Admin routes (require `admin`/`staff` role): `/admin`, `/admin/inventory`, `/admin/bookings`,
`/admin/calendar`, `/admin/customers`, `/admin/deliveries`, `/admin/reports`.

## 3. Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter analyze          # should report no issues
flutter run               # emulator/device must already be connected
```

See [`mobile/README.md`](./mobile/README.md) for how the app reaches `localhost:4000` from an
emulator vs. a physical device (they need different base URLs) and other mobile-specific notes.
The app targets the same backend API described in `API_CONTRACT.md`.

## Deployment

Vercel hosts the frontend well but isn't a fit for a stateful Express + Postgres API, so the two
deploy to different places: **frontend → Vercel**, **backend → Render** (its free tier includes
Postgres, and `render.yaml` at the repo root auto-provisions both together). Both platforms deploy
straight from the `kawsing13/rental-booking` GitHub repo - no local build/upload needed. Do these in
order, since the frontend needs the backend's URL and the backend needs the frontend's URL:

**1. Backend on Render**
1. [render.com](https://render.com) → sign in with GitHub → **New +** → **Blueprint** → pick this repo.
   Render reads `render.yaml` and provisions the `rental-booking-db` Postgres instance and the
   `rental-booking-backend` web service together, generating the JWT secrets automatically.
2. Once it's deployed, copy the service's URL (`https://rental-booking-backend-xxxx.onrender.com`).
3. Open a Shell on the web service (Render dashboard → the service → **Shell**) and run
   `npm run seed` once, to load the demo admin/customer accounts and starter catalog
   (`npm run migrate` already ran automatically as part of the build).

**2. Frontend on Vercel**
1. [vercel.com](https://vercel.com) → sign in with GitHub → **Add New** → **Project** → pick this repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects the Vite framework preset from there).
3. Add an environment variable `VITE_API_URL` = `https://<your-render-backend-url>/api` (from step 1.2).
4. Deploy. Copy the resulting `https://<your-project>.vercel.app` URL.

**3. Connect them**
Back on Render, open the backend service → **Environment** → set `CLIENT_ORIGIN` to the Vercel URL
from step 2.4 (no trailing slash) → save (this redeploys the service). CORS blocks the browser from
calling the API until this matches exactly.

Once both are set, the Vercel URL is a fully working deployment - login with the seeded demo accounts
from step 1.3, or register a new one.

A redeploy on either platform happens automatically on every push to `master`, matching how the
service was created. GCash/Maya stay in mock mode in production too (see "Notes on payments" above)
until real gateway credentials are added as environment variables on the Render side.

## Project structure & design notes

- **Schema-first, portable DB**: the Postgres schema lives entirely in Sequelize migrations
  (`backend/src/db/migrations`), not a hand-written SQL dump - `npm run migrate` recreates it
  anywhere, and switching engines later mostly means changing `dialect` in `src/config/database.js`.
- **Inventory / double-booking prevention**: availability for a date range is computed on the fly
  (total stock minus everything reserved by overlapping active bookings), and booking creation takes
  a row lock on each item inside a DB transaction so two simultaneous requests for the last unit can't
  both succeed. See `backend/src/services/inventoryService.js`.
- **Security**: bcrypt password hashing, short-lived JWT access tokens + refresh tokens, role-based
  route guards (`customer` / `staff` / `admin`), express-validator on every mutating endpoint, rate
  limiting on auth routes, helmet security headers, and an audit log (`audit_logs` table) recording
  inventory/booking/payment mutations.
- **Theme**: light blue across web and mobile, defined once in `frontend/src/styles/theme.css` (CSS
  variables) and mirrored in `mobile/lib/theme/app_theme.dart`.

## Verified during development

The backend was run against a live local Postgres container (migrations + seed executed
successfully) and smoke-tested end-to-end via HTTP: registration/login, catalog browse, availability
checks, booking creation, the double-booking conflict (409) path, admin status transitions, mock
GCash payment, notifications, and the admin dashboard aggregation.

The frontend was built (`npm run build`, clean) and driven with a real headless-Chromium session:
catalog rendering, customer login, admin login/dashboard, and a full booking flow (browse → item
detail → availability check → add to booking → review → submit → view confirmation with payment
form) all completed with zero console errors.

The mobile app was built and run on a real physical Android device (`flutter pub get` and
`flutter analyze` clean) over a USB `adb reverse` tunnel to this backend: registration, catalog
browse, item detail, date-range availability checks, and adding an item to a booking draft with the
review screen all completed successfully against live data. See `mobile/README.md`'s "Verified"
section for the one step (final booking submission) that wasn't confirmed completing in that session,
and why.
