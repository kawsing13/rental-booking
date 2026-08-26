import 'package:flutter/material.dart';

import '../models/booking.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

/// Visual progress timeline through the booking workflow defined in
/// API_CONTRACT.md: pending -> approved -> reserved -> out_for_delivery ->
/// in_use -> returned -> completed. Cancelled/rejected bookings render as a
/// single "stopped here" state instead of a broken partial timeline.
class StatusTimeline extends StatelessWidget {
  final String currentStatus;
  const StatusTimeline({super.key, required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    if (kBookingTerminalNegative.contains(currentStatus)) {
      return Row(
        children: [
          Icon(Icons.cancel, color: StatusBadge.colorFor(currentStatus)),
          const SizedBox(width: 8),
          Text(
            'Booking ${StatusBadge.labelFor(currentStatus).toLowerCase()}',
            style: TextStyle(color: StatusBadge.colorFor(currentStatus), fontWeight: FontWeight.w600),
          ),
        ],
      );
    }

    final currentIndex = kBookingStatusFlow.indexOf(currentStatus);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < kBookingStatusFlow.length; i++)
          _TimelineStep(
            label: StatusBadge.labelFor(kBookingStatusFlow[i]),
            isDone: i < currentIndex,
            isCurrent: i == currentIndex,
            isLast: i == kBookingStatusFlow.length - 1,
          ),
      ],
    );
  }
}

class _TimelineStep extends StatelessWidget {
  final String label;
  final bool isDone;
  final bool isCurrent;
  final bool isLast;
  const _TimelineStep({
    required this.label,
    required this.isDone,
    required this.isCurrent,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final active = isDone || isCurrent;
    final color = active ? AppColors.primary : AppColors.border;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 16, height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active ? AppColors.primary : Colors.white,
                  border: Border.all(color: color, width: 2),
                ),
                child: isDone ? const Icon(Icons.check, size: 10, color: Colors.white) : null,
              ),
              if (!isLast) Expanded(child: Container(width: 2, color: color)),
            ],
          ),
          const SizedBox(width: 12),
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Text(
              label,
              style: TextStyle(
                color: active ? AppColors.text : AppColors.mutedText,
                fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
