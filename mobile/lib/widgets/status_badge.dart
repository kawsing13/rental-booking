import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Renders a booking status as a colored pill, using the exact color
/// mapping suggested in API_CONTRACT.md so the mobile app's badges match
/// the web frontend's.
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  static Color colorFor(String status) {
    switch (status) {
      case 'pending':
        return AppColors.warning;
      case 'approved':
      case 'reserved':
        return AppColors.primary;
      case 'out_for_delivery':
        return AppColors.statusPurple;
      case 'in_use':
        return AppColors.statusTeal;
      case 'returned':
        return AppColors.statusSlate;
      case 'completed':
        return AppColors.success;
      case 'rejected':
      case 'cancelled':
        return AppColors.danger;
      default:
        return AppColors.mutedText;
    }
  }

  static String labelFor(String status) {
    // "out_for_delivery" -> "Out For Delivery"
    return status
        .split('_')
        .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final color = colorFor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(
            labelFor(status),
            style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
