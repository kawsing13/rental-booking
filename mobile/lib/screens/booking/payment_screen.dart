import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/booking.dart';
import '../../providers/payment_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';

const _methods = [
  (value: 'gcash', label: 'GCash', subtitle: 'Instant confirmation (mock)'),
  (value: 'maya', label: 'Maya', subtitle: 'Instant confirmation (mock)'),
  (value: 'bank_transfer', label: 'Bank Transfer', subtitle: 'Pending until admin confirms'),
  (value: 'cod', label: 'Cash on Delivery', subtitle: 'Pending until admin confirms'),
  (value: 'pickup_cash', label: 'Cash on Pickup', subtitle: 'Pending until admin confirms'),
];
const _cashMethods = {'cod', 'pickup_cash'};

/// Pays a booking's reservation or balance fee via `POST /payments`.
/// `amount` is passed in by the caller (BookingDetailScreen) straight from
/// the booking's server-computed fees — never recomputed here. The backend
/// re-validates the balance itself regardless (see paymentController.js),
/// so this screen can't be tricked into a double-payment even if it were
/// opened twice in a row with a stale amount.
class PaymentScreen extends StatefulWidget {
  final Booking booking;
  final String type; // reservation | balance
  final double amount;
  const PaymentScreen({super.key, required this.booking, required this.type, required this.amount});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _method = 'gcash';
  final _referenceController = TextEditingController();
  final _cashTenderedController = TextEditingController();

  @override
  void dispose() {
    _referenceController.dispose();
    _cashTenderedController.dispose();
    super.dispose();
  }

  bool get _isCash => _cashMethods.contains(_method);

  double? get _tendered => double.tryParse(_cashTenderedController.text.trim());

  double? get _change {
    final tendered = _tendered;
    if (!_isCash || tendered == null) return null;
    // Cents-based subtraction so PHP 200.00 - PHP 150.00 can't render as
    // PHP 49.999999999999 due to binary float rounding.
    final cents = (tendered * 100).round() - (widget.amount * 100).round();
    return cents / 100;
  }

  bool get _cashInsufficient => _isCash && _tendered != null && _tendered! < widget.amount;

  Future<void> _submit() async {
    if (_cashInsufficient) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cash tendered is less than the amount due.')),
      );
      return;
    }
    final payments = context.read<PaymentProvider>();
    final payment = await payments.pay(
      bookingId: widget.booking.id,
      method: _method,
      type: widget.type,
      amount: widget.amount,
      referenceNo: _referenceController.text.trim(),
      cashTendered: _isCash ? _tendered : null,
    );
    if (!mounted) return;
    if (payment != null) {
      final instant = payment.status == 'paid';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(instant
            ? 'Payment received — receipt ${payment.receiptNumber}'
            : 'Payment recorded as pending. An admin will confirm it shortly.'),
      ));
      Navigator.of(context).pop(payment);
    } else if (payments.payError != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(payments.payError!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final payments = context.watch<PaymentProvider>();
    return Scaffold(
      appBar: AppBar(title: Text('Pay ${widget.type == 'reservation' ? 'Reservation' : 'Balance'}')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Booking ${widget.booking.bookingReference}', style: const TextStyle(color: AppColors.mutedText)),
                      const SizedBox(height: 4),
                      Text(
                        Formatters.currency(widget.amount),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Payment Method', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ..._methods.map((m) {
                final selected = _method == m.value;
                return Card(
                  color: selected ? AppColors.primaryLight : null,
                  child: ListTile(
                    onTap: () => setState(() {
                      _method = m.value;
                      _cashTenderedController.clear();
                    }),
                    leading: Icon(
                      selected ? Icons.check_circle : Icons.circle_outlined,
                      color: selected ? AppColors.primary : AppColors.mutedText,
                    ),
                    title: Text(m.label),
                    subtitle: Text(m.subtitle, style: const TextStyle(fontSize: 12)),
                  ),
                );
              }),
              const SizedBox(height: 8),
              if (_isCash) ...[
                TextField(
                  controller: _cashTenderedController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Cash tendered (optional)',
                    helperText: 'How much cash will be handed over — we\'ll work out the change.',
                    prefixText: 'PHP ',
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                if (_cashTenderedController.text.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: _cashInsufficient ? AppColors.danger.withValues(alpha: 0.12) : AppColors.success.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      _cashInsufficient
                          ? 'Short by ${Formatters.currency(widget.amount - (_tendered ?? 0))}'
                          : 'Change: ${Formatters.currency(_change ?? 0)}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _cashInsufficient ? AppColors.danger : AppColors.success,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
              ],
              TextField(
                controller: _referenceController,
                decoration: const InputDecoration(
                  labelText: 'Reference No. (optional)',
                  helperText: 'e.g. bank transfer slip number',
                ),
              ),
              if (payments.payError != null) ...[
                const SizedBox(height: 12),
                Text(payments.payError!, style: const TextStyle(color: AppColors.danger)),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (payments.isPaying || _cashInsufficient) ? null : _submit,
                  child: payments.isPaying
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Pay ${Formatters.currency(widget.amount)}'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
