import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/item.dart';
import '../../providers/booking_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/item_card.dart';
import '../../widgets/state_views.dart';
import '../booking/booking_draft_screen.dart';

/// Item detail page: photos/description/price/terms, plus a live
/// availability check once the customer picks event + return dates (the
/// catalog/detail endpoints never carry date-based availability — only
/// `GET /items/:id/availability` does).
class ItemDetailScreen extends StatefulWidget {
  final String itemId;
  const ItemDetailScreen({super.key, required this.itemId});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  DateTime? _eventDate;
  DateTime? _returnDate;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final catalog = context.read<CatalogProvider>();
      catalog.resetAvailability();
      catalog.loadItemDetail(widget.itemId);
    });
  }

  Future<void> _pickDate({required bool isEvent}) async {
    final now = DateTime.now();
    final initial = (isEvent ? _eventDate : _returnDate) ?? now.add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null || !mounted) return;
    setState(() {
      if (isEvent) {
        _eventDate = picked;
        // Keep the return date sane: it can't be before the event date.
        if (_returnDate != null && _returnDate!.isBefore(_eventDate!)) {
          _returnDate = null;
        }
      } else {
        _returnDate = picked;
      }
    });
    context.read<CatalogProvider>().resetAvailability();
  }

  Future<void> _checkAvailability() async {
    if (_eventDate == null || _returnDate == null) return;
    await context.read<CatalogProvider>().checkAvailability(
          itemId: widget.itemId,
          eventDate: Formatters.apiDate(_eventDate!),
          returnDate: Formatters.apiDate(_returnDate!),
        );
  }

  void _addToBooking() {
    final catalog = context.read<CatalogProvider>();
    final booking = context.read<BookingProvider>();
    final item = catalog.selectedItem;
    if (item == null || _eventDate == null || _returnDate == null) return;

    booking.setDates(event: _eventDate!, returnD: _returnDate!);
    booking.addOrUpdateLine(item, _quantity);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added ${item.name} x$_quantity to your booking'),
        action: SnackBarAction(
          label: 'VIEW CART',
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const BookingDraftScreen()),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final item = catalog.selectedItem;

    return Scaffold(
      appBar: AppBar(title: Text(item?.name ?? 'Item Details')),
      body: item == null
          ? (catalog.isLoadingDetail
              ? const LoadingView()
              : ErrorView(
                  message: catalog.errorMessage ?? 'Item not found.',
                  onRetry: () => catalog.loadItemDetail(widget.itemId),
                ))
          : _buildBody(context, catalog, item),
    );
  }

  Widget _buildBody(BuildContext context, CatalogProvider catalog, Item item) {
    final underMaintenance = item.status == 'under_maintenance';
    final available = catalog.availability;
    final canAddToBooking = !underMaintenance &&
        _eventDate != null &&
        _returnDate != null &&
        available != null &&
        available.available >= _quantity;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Gallery(images: item.images, category: item.category),
          const SizedBox(height: 16),
          Text(item.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            '${Formatters.currency(item.rentalPrice)} / rental',
            style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w600, fontSize: 18),
          ),
          if (underMaintenance) ...[
            const SizedBox(height: 8),
            const Text('Currently under maintenance — not bookable.', style: TextStyle(color: AppColors.danger)),
          ],
          const SizedBox(height: 16),
          if ((item.description ?? '').isNotEmpty) ...[
            Text('Description', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(item.description!, style: const TextStyle(color: AppColors.text)),
            const SizedBox(height: 16),
          ],
          if ((item.rentalTerms ?? '').isNotEmpty) ...[
            Text('Rental Terms', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(item.rentalTerms!, style: const TextStyle(color: AppColors.mutedText)),
            const SizedBox(height: 16),
          ],
          const Divider(),
          const SizedBox(height: 8),
          Text('Check Availability', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.event_outlined, size: 18),
                  onPressed: underMaintenance ? null : () => _pickDate(isEvent: true),
                  label: Text(_eventDate == null ? 'Event date' : Formatters.date(Formatters.apiDate(_eventDate!))),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.event_available_outlined, size: 18),
                  onPressed: (underMaintenance || _eventDate == null) ? null : () => _pickDate(isEvent: false),
                  label: Text(_returnDate == null ? 'Return date' : Formatters.date(Formatters.apiDate(_returnDate!))),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_eventDate != null && _returnDate != null)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: catalog.isCheckingAvailability ? null : _checkAvailability,
                child: catalog.isCheckingAvailability
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Check Availability'),
              ),
            ),
          if (catalog.availabilityError != null) ...[
            const SizedBox(height: 8),
            Text(catalog.availabilityError!, style: const TextStyle(color: AppColors.danger)),
          ],
          if (available != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: available.available > 0 ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                available.available > 0
                    ? '${available.available} of ${available.quantityTotal} available for these dates'
                    : 'None available for these dates (${available.reserved} already reserved)',
                style: TextStyle(
                  color: available.available > 0 ? AppColors.success : AppColors.danger,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (available.available > 0) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Quantity:', style: TextStyle(color: AppColors.text)),
                  const SizedBox(width: 12),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                  ),
                  Text('$_quantity', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: _quantity < available.available ? () => setState(() => _quantity++) : null,
                  ),
                ],
              ),
            ],
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: canAddToBooking ? _addToBooking : null,
              child: const Text('Add to Booking'),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _Gallery extends StatelessWidget {
  final List<String> images;
  final String category;
  const _Gallery({required this.images, required this.category});

  @override
  Widget build(BuildContext context) {
    const height = 200.0;
    if (images.isEmpty) {
      return Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
        child: Icon(iconForCategory(category), size: 64, color: AppColors.primary),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: height,
        child: PageView.builder(
          itemCount: images.length,
          itemBuilder: (context, index) => Image.network(
            images[index],
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              color: AppColors.primaryLight,
              child: Icon(iconForCategory(category), size: 64, color: AppColors.primary),
            ),
          ),
        ),
      ),
    );
  }
}
