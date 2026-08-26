import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/booking.dart';
import '../../models/payment.dart';
import '../../providers/booking_provider.dart';
import '../../providers/payment_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/state_views.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/status_timeline.dart';
import 'payment_screen.dart';

/// Full booking detail: status timeline, line items, server-computed fees,
/// payment history + "pay now" action, and cancel (only while
/// pending/approved, per API_CONTRACT.md's cancel rule).
class BookingDetailScreen extends StatefulWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().loadBookingDetail(widget.bookingId);
      context.read<PaymentProvider>().loadPayments(widget.bookingId);
    });
  }

  Future<void> _confirmCancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel booking?'),
        content: const Text('This cannot be undone. Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('No')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Yes, Cancel', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final ok = await context.read<BookingProvider>().cancelBooking(widget.bookingId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Booking cancelled.' : (context.read<BookingProvider>().detailError ?? 'Could not cancel.')),
    ));
  }

  Future<void> _openPayment(String type, double amount) async {
    final booking = context.read<BookingProvider>().selectedBooking!;
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PaymentScreen(booking: booking, type: type, amount: amount)),
    );
    if (!mounted) return;
    // Awaited (not fire-and-forget) so the payment history / balance-due
    // figure is actually fresh by the time this returns and the "Pay Now"
    // button's visibility is recomputed - otherwise there's a brief window
    // where the old (pre-payment) balance is still on screen and a fast
    // second tap could re-open PaymentScreen with a stale amount. The
    // backend rejects that regardless (see paymentController.js), but this
    // keeps the UI itself from ever suggesting it's possible.
    await context.read<PaymentProvider>().loadPayments(widget.bookingId);
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = context.watch<BookingProvider>();
    final booking = bookingState.selectedBooking;

    return Scaffold(
      appBar: AppBar(title: Text(booking?.bookingReference ?? 'Booking')),
      body: bookingState.isLoadingDetail && booking == null
          ? const LoadingView()
          : booking == null
              ? ErrorView(
                  message: bookingState.detailError ?? 'Booking not found.',
                  onRetry: () => bookingState.loadBookingDetail(widget.bookingId),
                )
              : _buildBody(context, booking),
    );
  }

  Widget _buildBody(BuildContext context, Booking booking) {
    final payments = context.watch<PaymentProvider>();
    // Cents-based sum - Dart doubles have the same binary-float rounding
    // issue JS does, and a balance that's off by a fraction of a centavo
    // could leave "Pay Now" visible (or hidden) incorrectly.
    final paidCents = payments.paymentsForBooking
        .where((p) => p.status == 'paid')
        .fold(0, (sum, p) => sum + (p.amount * 100).round());
    final totalCents = (booking.totalAmount * 100).round();
    final balanceDueCents = (totalCents - paidCents).clamp(0, 1 << 62);
    final balanceDue = balanceDueCents / 100;
    final totalPaid = paidCents / 100;

    return RefreshIndicator(
      onRefresh: () async {
        await context.read<BookingProvider>().loadBookingDetail(widget.bookingId);
        await payments.loadPayments(widget.bookingId);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatusBadge(status: booking.status),
              Text(Formatters.date(booking.createdAt), style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: StatusTimeline(currentStatus: booking.status),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Event Details',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _kv('Event date', Formatters.date(booking.eventDate)),
                _kv('Return date', Formatters.date(booking.returnDate)),
                _kv('Delivery address', booking.deliveryAddress ?? 'Pickup (no delivery)'),
                if ((booking.notes ?? '').isNotEmpty) _kv('Notes', booking.notes!),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Items',
            child: Column(
              children: [
                for (final line in booking.items)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text('${line.item?.name ?? 'Item'}  x${line.quantity}'),
                        ),
                        Text(Formatters.currency(line.subtotal)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Charges',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _kv('Delivery fee', Formatters.currency(booking.deliveryFee)),
                _kv('Reservation fee (20%)', Formatters.currency(booking.reservationFee)),
                const Divider(),
                _kv('Total', Formatters.currency(booking.totalAmount), emphasize: true),
                _kv('Paid so far', Formatters.currency(totalPaid)),
                _kv('Balance due', Formatters.currency(balanceDue.toDouble()), emphasize: true),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Payments',
            trailing: balanceDue > 0
                ? TextButton(
                    onPressed: () => _openPayment(
                      payments.paymentsForBooking.any((p) => p.type == 'reservation' && p.status == 'paid')
                          ? 'balance'
                          : 'reservation',
                      balanceDue.toDouble(),
                    ),
                    child: const Text('Pay Now'),
                  )
                : null,
            child: payments.isLoadingHistory
                ? const Padding(padding: EdgeInsets.all(12), child: LoadingView())
                : payments.paymentsForBooking.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Text('No payments yet.', style: TextStyle(color: AppColors.mutedText)),
                      )
                    : Column(children: payments.paymentsForBooking.map(_PaymentRow.new).toList()),
          ),
          const SizedBox(height: 20),
          if (booking.isCancellable)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: context.watch<BookingProvider>().isCancelling ? null : _confirmCancel,
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger, side: const BorderSide(color: AppColors.danger)),
                child: Text(context.watch<BookingProvider>().isCancelling ? 'Cancelling...' : 'Cancel Booking'),
              ),
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _kv(String label, String value, {bool emphasize = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.mutedText)),
          Text(
            value,
            style: TextStyle(
              fontWeight: emphasize ? FontWeight.bold : FontWeight.normal,
              color: emphasize ? AppColors.primaryDark : AppColors.text,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;
  const _SectionCard({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final Payment payment;
  const _PaymentRow(this.payment);

  @override
  Widget build(BuildContext context) {
    final color = payment.status == 'paid'
        ? AppColors.success
        : payment.status == 'pending'
            ? AppColors.warning
            : AppColors.danger;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(Icons.receipt_long_outlined, color: color, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${payment.method.toUpperCase()} • ${payment.type}', style: const TextStyle(fontSize: 13)),
                Text(payment.status, style: TextStyle(fontSize: 11, color: color)),
                if (payment.cashTendered != null)
                  Text(
                    'Tendered ${Formatters.currency(payment.cashTendered!)} • Change ${Formatters.currency(payment.changeDue ?? 0)}',
                    style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                  ),
              ],
            ),
          ),
          Text(Formatters.currency(payment.amount), style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
