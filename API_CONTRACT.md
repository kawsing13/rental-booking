# Rental Booking App — API Contract

Base URL (dev): `http://localhost:4000/api`. All request/response bodies are JSON.
Protected routes require `Authorization: Bearer <accessToken>`.

Demo accounts (from the seeder): `admin@rentalapp.test` / `Password123!` (role `admin`),
`customer@rentalapp.test` / `Password123!` (role `customer`). Password min length is 8.

## Auth (`/auth`)
- `POST /auth/register` `{ name, email, password, phone?, address? }` → `201 { user, accessToken, refreshToken }`
- `POST /auth/login` `{ email, password }` → `200 { user, accessToken, refreshToken }`
- `POST /auth/refresh` `{ refreshToken }` → `200 { accessToken }`
- `GET /auth/me` (auth) → `200 { user }`
- `PUT /auth/me` (auth) `{ name?, phone?, address? }` → `200 { user }` (profile management — email/role are not editable here)
- `POST /auth/forgot-password` `{ email }` → `200 { message }` (always 200, doesn't leak whether the email exists)
- `POST /auth/reset-password` `{ token, newPassword }` → `200 { message }`

`user` shape: `{ id, name, email, phone, role: 'customer'|'admin'|'staff', address }`. Access tokens expire in 15m,
refresh tokens in 7d — the client must call `/auth/refresh` on a 401 and retry once, then force logout if that
also fails.

## Catalog (`/items`) — GET routes are public, POST/PUT/DELETE require admin/staff
- `GET /items?category=&search=&minPrice=&maxPrice=&page=&limit=` → `{ items: Item[], pagination: { page, limit, total } }`
- `GET /items/:id` → `{ item }`
- `GET /items/:id/availability?eventDate=YYYY-MM-DD&returnDate=YYYY-MM-DD` → `{ itemId, name, quantityTotal, reserved, available }`
- `POST /items` (admin/staff) `{ name, category, description?, rentalPrice, quantityTotal, images?, rentalTerms? }` → `201 { item }`
- `PUT /items/:id` (admin/staff) partial body of editable fields → `{ item }`
- `DELETE /items/:id` (admin) → `204`

`Item` shape: `{ id, name, category: 'chair'|'table'|'karaoke', description, rentalPrice, quantityTotal, images: string[], rentalTerms, status: 'available'|'under_maintenance', createdAt, updatedAt }`.
Note: there is no live "quantityAvailable" column — always call the `/availability` endpoint for a specific date
range before letting a customer commit to a quantity; the catalog list endpoint does NOT factor in date-based
availability.

## Bookings (`/bookings`) — all require auth
- `POST /bookings` `{ eventDate, returnDate, deliveryAddress?, notes?, items: [{ itemId, quantity }] }` → `201 { booking }`.
  Returns `409` with `{ error: { message, details: { itemId, requested, remaining } } }` if any line can't be
  satisfied for those dates (double-booking prevention) — show this inline, it's an expected/recoverable state,
  not a generic error toast.
- `GET /bookings/mine` (customer) → `{ bookings: Booking[] }`
- `GET /bookings` (admin/staff) `?status=` → `{ bookings: Booking[] }` (includes `customer` summary)
- `GET /bookings/:id` (owner or admin/staff) → `{ booking }` (includes `items`, `customer`, `payments`, `deliveries`)
- `PUT /bookings/:id/status` (admin/staff) `{ status }` → `{ booking }`. Valid transitions:
  `pending → approved|rejected|cancelled`, `approved → reserved|cancelled`, `reserved → out_for_delivery|cancelled`,
  `out_for_delivery → in_use`, `in_use → returned`, `returned → completed`. Anything else is `400`.
- `PUT /bookings/:id/cancel` (customer, own booking) → `{ booking }`. Only works while status is `pending` or `approved`.

`Booking` shape: `{ id, bookingReference, customerId, eventDate, returnDate, status, deliveryAddress, deliveryFee,
reservationFee, totalAmount, notes, items: BookingItem[], createdAt, updatedAt }`. `deliveryFee` is a flat 200 if
`deliveryAddress` was provided at creation (else 0); `reservationFee` is 20% of `totalAmount`, both computed
server-side — the client should just display them, not recompute.

Status badge color suggestion (for consistent UI across web/mobile): pending=amber, approved=blue, reserved=blue,
out_for_delivery=purple, in_use=teal, returned=slate, completed=green, rejected/cancelled=red.

## Payments (`/payments`) — all require auth
- `POST /payments` `{ bookingId, method: 'cod'|'pickup_cash'|'bank_transfer'|'gcash'|'maya', type: 'reservation'|'balance', amount, referenceNo? }` → `201 { payment }`.
  `cod`/`pickup_cash`/`bank_transfer` come back `status: 'pending'` (needs admin confirmation); `gcash`/`maya` come
  back `status: 'paid'` immediately (mock mode — see backend `services/paymentService.js`).
- `GET /payments/booking/:bookingId` (owner or admin/staff) → `{ payments: Payment[] }`
- `PUT /payments/:id/confirm` (admin/staff) → `{ payment }` (marks a pending cash/bank payment as paid)
- `POST /payments/:id/refund` (admin) → `{ refund: Payment }`

`Payment` shape: `{ id, bookingId, method, type, amount, status: 'pending'|'paid'|'failed'|'refunded', referenceNo, receiptNumber, paidAt }`.

## Notifications (`/notifications`) — all require auth
- `GET /notifications/mine` → `{ notifications: Notification[] }` (newest first, max 100)
- `PUT /notifications/:id/read` → `{ notification }`
- `PUT /notifications/read-all` → `{ message }`

`Notification` shape: `{ id, userId, bookingId, type, message, isRead, createdAt }`.

## Admin (`/admin`) — all require admin/staff
- `GET /admin/dashboard` → `{ todaysBookings, pendingRequests, activeRentals, availableInventoryItems, monthlyRevenue, mostRentedItems: [{ itemId, name, category, totalRented }] }`
- `GET /admin/customers` → `{ customers: User[] }`
- `GET /admin/customers/:id` → `{ customer, outstandingBalance }` (customer includes `bookings[]` with nested `payments[]`)
- `GET /admin/calendar?month=YYYY-MM` → `{ month, deliveries: Delivery[], reservedDates: Booking[] }`
- `GET /admin/deliveries?date=YYYY-MM-DD` → `{ deliveries: Delivery[] }`
- `POST /admin/deliveries` `{ bookingId, type: 'delivery'|'pickup', scheduledDate, address?, assignedPersonnel? }` → `201 { delivery }`
- `PUT /admin/deliveries/:id` partial `{ scheduledDate?, address?, assignedPersonnel?, status? }` → `{ delivery }`
- `GET /admin/reports/{bookings|revenue|inventory-usage|cancelled}?format=csv|excel|pdf|json` — `bookings` also takes
  `?period=daily|weekly|monthly`. `format=json` (default) returns `{ title, rows }` for an in-page preview table;
  the other three trigger a file download (set `window.location = url` with the token as a query/header per your
  HTTP client's capability, or fetch+blob).

## Error shape (all non-2xx responses)
```json
{ "error": { "message": "...", "details": [ ... ] | { ... } | undefined } }
```
`400` = validation error (`details` is an array of `express-validator` issues), `401` = auth required/invalid,
`403` = wrong role, `404` = not found, `409` = conflict (mainly the availability check).

## Theme
Light blue across web and mobile. Suggested palette (hex): primary `#2F86D6`, primary-dark `#1D5FA3`,
primary-light `#EAF4FC` (page background), accent `#5FB3E8`, surface `#FFFFFF`, text `#1E2A38`,
muted text `#5B6B7C`, border `#D6E8F7`, success `#2FA84F`, warning `#E0A100`, danger `#D64545`.
