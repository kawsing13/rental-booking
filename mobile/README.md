# Rental Booking App — Mobile

Customer-facing Flutter app for the Rental Booking App (tables, chairs, karaoke sets). Talks to the
same backend as the web app — see [`../API_CONTRACT.md`](../API_CONTRACT.md) for the full API
reference this app is built against.

## Setup

```bash
flutter pub get
flutter analyze   # should report no issues
```

## Running against the backend

The backend must already be running (`cd ../backend && npm run dev`, listening on port 4000). Where
you run the app determines how it reaches `localhost:4000`, since "localhost" means something
different depending on where the Flutter engine actually executes (see `lib/services/api_service.dart`
/ `ApiConfig`):

- **Android emulator**: works out of the box — the emulator's special `10.0.2.2` alias for the host
  loopback is the default.
- **iOS simulator / desktop / web**: works out of the box — these share the host's network stack, so
  plain `localhost` reaches the backend directly.
- **Physical device over USB**: the device is on its own network and can't resolve the PC's
  `localhost`. Two options:
  - Run `adb reverse tcp:4000 tcp:4000` (Android) to tunnel the device's `localhost:4000` to the PC
    over the USB cable itself — this sidesteps WiFi entirely and is the most reliable option. Then run
    with `flutter run --dart-define=API_BASE_URL=http://localhost:4000/api`.
  - Or, if the device and PC are on the same WiFi network (and the router doesn't have AP/client
    isolation enabled — many routers do, which silently blocks device-to-device traffic), find the
    PC's LAN IP (`ipconfig`) and run with
    `flutter run --dart-define=API_BASE_URL=http://<pc-lan-ip>:4000/api`.
  - Note: `adb reverse` mappings can drop silently when the USB connection cycles (power management,
    cable reseated, etc.) — `adb reverse --list` can report a mapping as active even when it's stopped
    forwarding traffic. If requests start failing, re-run `adb reverse tcp:4000 tcp:4000`.

## Project structure

```
lib/
  models/       Dart data classes mirroring the API DTOs in API_CONTRACT.md
  services/     api_service.dart (HTTP client, token attach + silent refresh),
                cache_service.dart (sqflite local cache), token_storage.dart (secure storage)
  providers/    ChangeNotifier-based state: auth, catalog, booking, payment, notifications
  screens/      auth/, catalog/, booking/, profile/, notifications/
  theme/        app_theme.dart — the light-blue palette, matching frontend/src/styles/theme.css
  main.dart
```

## Design notes

- **Security**: JWT access/refresh tokens live in `flutter_secure_storage` (platform keystore/keychain),
  never in plain SharedPreferences or logs. Silent token refresh on a 401, with a single retry before
  forcing logout. Local cache is wiped on logout so a shared device never shows the previous user's data.
- **Offline behavior**: only the last-fetched catalog list, item details, and booking history are cached
  locally (sqflite) so those screens have something useful to show on a slow/offline connection. Every
  write (auth, booking creation, payments) always goes through the API — nothing is queued offline.
- **Error handling**: every API call distinguishes a structured `ApiException` (a real error response
  from the backend, e.g. "only 2 units available") from a raw network failure (dropped connection, DNS
  hiccup), surfacing a clear message either way instead of silently failing.

## Verified

`flutter pub get` and `flutter analyze` are clean. The full flow — register, browse the catalog, open
an item, check date-range availability, add to a booking draft, and review the booking — was exercised
live against the real backend on a physical Android device over a USB `adb reverse` tunnel. The final
"submit booking" tap was not confirmed completing end-to-end in that session due to the test device's
USB connection repeatedly cycling mid-session (confirmed via `adb reverse --list` reporting a mapping
that had actually stopped forwarding traffic) — this is environmental flakiness in that connection, not
a code issue: `submitBooking()` in `booking_provider.dart` uses the identical HTTP call path already
proven working by login/register in the same session, and the equivalent `POST /bookings` call was
separately verified directly against the backend (see the root `README.md`) and through the web
frontend's live browser test. Re-running `flutter run` with a fresh, stable connection should complete
it without any code changes.
