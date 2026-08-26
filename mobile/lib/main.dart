import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/payment_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/booking/my_bookings_screen.dart';
import 'screens/catalog/catalog_list_screen.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';
import 'widgets/state_views.dart';

void main() {
  runApp(const RentalBookingApp());
}

class RentalBookingApp extends StatelessWidget {
  const RentalBookingApp({super.key});

  @override
  Widget build(BuildContext context) {
    // One ApiService instance shared by every provider so there's a single
    // token-refresh pipeline and a single "force logout" callback for the
    // whole app, rather than each provider talking to the backend
    // independently.
    final apiService = ApiService();

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(apiService)),
        ChangeNotifierProvider(create: (_) => CatalogProvider(apiService)),
        ChangeNotifierProvider(create: (_) => BookingProvider(apiService)),
        ChangeNotifierProvider(create: (_) => PaymentProvider(apiService)),
        ChangeNotifierProvider(create: (_) => NotificationProvider(apiService)),
      ],
      child: MaterialApp(
        title: 'RentTa',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const AuthGate(),
      ),
    );
  }
}

/// Root-level switch between the unauthenticated and authenticated app.
/// Runs `tryAutoLogin` once on startup to silently restore a session from
/// stored tokens (verified against `/auth/me`, not just trusted blindly).
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().tryAutoLogin();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: LoadingView());
      case AuthStatus.unauthenticated:
        return const LoginScreen();
      case AuthStatus.authenticated:
        return const HomeShell();
    }
  }
}

/// Authenticated app shell: bottom-tab navigation across the four main
/// customer-facing sections. Uses IndexedStack so switching tabs doesn't
/// tear down (and re-fetch) each screen's state.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _screens = [
    CatalogListScreen(),
    MyBookingsScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationProvider>().unreadCount;
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryLight,
        destinations: [
          const NavigationDestination(
              icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Browse'),
          const NavigationDestination(
              icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: 'Bookings'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: const Icon(Icons.notifications),
            label: 'Alerts',
          ),
          const NavigationDestination(
              icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
