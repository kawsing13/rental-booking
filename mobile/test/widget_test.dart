// Minimal smoke test: the app boots to its splash/loading state without
// throwing. Deeper flows (login, booking, etc.) all depend on a live
// backend and platform-channel plugins (secure storage, sqflite) that
// aren't available under the plain widget-test harness, so those are
// verified by actually running the app instead (see project README/report).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots and shows the splash/loading state', (WidgetTester tester) async {
    await tester.pumpWidget(const RentalBookingApp());

    // First frame, before AuthGate's post-frame auto-login attempt resolves:
    // should be showing the loading spinner, not crashing.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
