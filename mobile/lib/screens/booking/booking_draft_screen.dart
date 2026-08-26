import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/booking_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import 'booking_detail_screen.dart';

/// Booking cart / review screen. Shows the draft's items, lets the
/// customer set delivery address + notes, and submits via `POST
/// /bookings`. Only the item subtotal is computed here (quantity × unit
/// price) purely as a preview — delivery fee, reservation fee, and the
/// final total are server-computed and only known once the booking is
/// actually created (see BookingDetailScreen, which shows those from the
/// API response).
class BookingDraftScreen extends StatefulWidget {
  const BookingDraftScreen({super.key});

  @override
  State<BookingDraftScreen> createState() => _BookingDraftScreenState();
}

class _BookingDraftScreenState extends State<BookingDraftScreen> {
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final booking = context.read<BookingProvider>();
    _addressController.text = booking.deliveryAddress ?? '';
    _notesController.text = booking.notes ?? '';
  }

  @override
  void dispose() {
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final booking = context.read<BookingProvider>();
    booking.setDeliveryAddress(_addressController.text);
    booking.setNotes(_notesController.text);
    final created = await booking.submitBooking();
    if (!mounted) return;
    if (created != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => BookingDetailScreen(bookingId: created.id)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = context.watch<BookingProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Review Booking')),
      body: booking.hasDraftItems ? _buildForm(booking) : const _EmptyDraft(),
      bottomNavigationBar: booking.hasDraftItems ? _buildSubmitBar(booking) : null,
    );
  }

  Widget _buildForm(BookingProvider booking) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Event Dates', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            '${Formatters.date(Formatters.apiDate(booking.eventDate!))}  →  '
            '${Formatters.date(Formatters.apiDate(booking.returnDate!))}',
            style: const TextStyle(color: AppColors.mutedText),
          ),
          const SizedBox(height: 20),
          Text('Items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...booking.draftLines.map((line) => Card(
                child: ListTile(
                  title: Text(line.item.name),
                  subtitle: Text('${Formatters.currency(line.item.rentalPrice)} x ${line.quantity}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        Formatters.currency(line.item.rentalPrice * line.quantity),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                        onPressed: () => booking.removeLine(line.item.id),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              'Estimated subtotal: ${Formatters.currency(booking.draftSubtotal)}',
              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.primaryDark),
            ),
          ),
          const SizedBox(height: 4),
          const Align(
            alignment: Alignment.centerRight,
            child: Text(
              'Delivery fee, reservation fee (20%), and total are calculated after you submit.',
              style: TextStyle(fontSize: 11, color: AppColors.mutedText),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _addressController,
            decoration: const InputDecoration(
              labelText: 'Delivery Address (optional)',
              helperText: 'Leave blank for pickup — a PHP 200 delivery fee applies if provided',
              prefixIcon: Icon(Icons.local_shipping_outlined),
            ),
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(labelText: 'Notes (optional)', prefixIcon: Icon(Icons.notes_outlined)),
            maxLines: 3,
          ),
          if (booking.submitConflict != null) _ConflictBanner(conflict: booking.submitConflict!, booking: booking),
          if (booking.submitError != null) ...[
            const SizedBox(height: 12),
            Text(booking.submitError!, style: const TextStyle(color: AppColors.danger)),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildSubmitBar(BookingProvider booking) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: booking.isSubmitting ? null : _submit,
          child: booking.isSubmitting
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Submit Booking'),
        ),
      ),
    );
  }
}

/// Inline 409 handler: shows exactly which item and how many are actually
/// available (per API_CONTRACT.md, this is expected/recoverable, not a
/// generic error toast) and offers a one-tap fix.
class _ConflictBanner extends StatelessWidget {
  final BookingConflict conflict;
  final BookingProvider booking;
  const _ConflictBanner({required this.conflict, required this.booking});

  @override
  Widget build(BuildContext context) {
    final line = booking.draftLines.where((l) => l.item.id == conflict.itemId).firstOrNull;
    final itemName = line?.item.name ?? 'This item';
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '$itemName: only ${conflict.remaining} available for these dates (you requested ${conflict.requested}).',
                  style: const TextStyle(color: AppColors.text),
                ),
              ),
            ],
          ),
          if (line != null && conflict.remaining > 0) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => booking.addOrUpdateLine(line.item, conflict.remaining),
                child: Text('Adjust to ${conflict.remaining}'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

class _EmptyDraft extends StatelessWidget {
  const _EmptyDraft();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 48, color: AppColors.mutedText),
            SizedBox(height: 12),
            Text('Your booking cart is empty. Browse items and add one to get started.',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.mutedText)),
          ],
        ),
      ),
    );
  }
}
