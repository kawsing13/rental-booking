import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/booking_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/state_views.dart';
import '../../widgets/status_badge.dart';
import 'booking_detail_screen.dart';

/// Customer's booking history tab. Cache-first like the catalog (see
/// BookingProvider.loadMyBookings), so a previous session's bookings are
/// still visible while a fresh fetch is in flight.
class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().loadMyBookings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final booking = context.watch<BookingProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')),
      body: Column(
        children: [
          if (booking.mineFromCache) const CacheBanner(),
          Expanded(child: _buildBody(booking)),
        ],
      ),
    );
  }

  Widget _buildBody(BookingProvider booking) {
    if (booking.isLoadingMine && booking.myBookings.isEmpty) return const LoadingView();
    if (booking.mineError != null && booking.myBookings.isEmpty) {
      return ErrorView(message: booking.mineError!, onRetry: () => booking.loadMyBookings(forceRefresh: true));
    }
    if (booking.myBookings.isEmpty) {
      return const EmptyView(message: "You haven't made any bookings yet.", icon: Icons.event_note_outlined);
    }
    // Newest first.
    final sorted = [...booking.myBookings]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return RefreshIndicator(
      onRefresh: () => booking.loadMyBookings(forceRefresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sorted.length,
        itemBuilder: (context, index) {
          final b = sorted[index];
          return Card(
            child: ListTile(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => BookingDetailScreen(bookingId: b.id)),
              ),
              title: Text(b.bookingReference, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${Formatters.date(b.eventDate)} → ${Formatters.date(b.returnDate)}\n'
                  '${b.items.length} item(s) • ${Formatters.currency(b.totalAmount)}',
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 12),
                ),
              ),
              isThreeLine: true,
              trailing: StatusBadge(status: b.status),
            ),
          );
        },
      ),
    );
  }
}
