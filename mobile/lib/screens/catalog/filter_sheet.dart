import 'package:flutter/material.dart';

/// Bottom sheet for the price-range filter. Returns the chosen
/// (min, max) via [Navigator.pop] rather than mutating provider state
/// directly, so the caller decides when to actually trigger a refetch.
class PriceFilterSheet extends StatefulWidget {
  final double? initialMin;
  final double? initialMax;
  const PriceFilterSheet({super.key, this.initialMin, this.initialMax});

  @override
  State<PriceFilterSheet> createState() => _PriceFilterSheetState();
}

class _PriceFilterSheetState extends State<PriceFilterSheet> {
  late final _minController =
      TextEditingController(text: widget.initialMin?.toStringAsFixed(0) ?? '');
  late final _maxController =
      TextEditingController(text: widget.initialMax?.toStringAsFixed(0) ?? '');

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Price Range (PHP)', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _minController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Min'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _maxController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Max'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop((null, null)),
                  child: const Text('Clear'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    final min = double.tryParse(_minController.text.trim());
                    final max = double.tryParse(_maxController.text.trim());
                    Navigator.of(context).pop((min, max));
                  },
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
