import 'package:flutter/material.dart';

import '../models/item.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

// Categories are admin-editable (see RentalCategory / Category Management
// on the web app), so this only special-cases the ones with an obvious
// matching Material icon - anything else, including brand-new categories
// an admin just added, falls back to a generic tag icon rather than
// guessing.
IconData iconForCategory(String category) {
  switch (category) {
    case 'chair':
      return Icons.chair_outlined;
    case 'table':
      return Icons.table_restaurant_outlined;
    case 'karaoke':
      return Icons.mic_external_on_outlined;
    case 'tent':
    case 'tents':
      return Icons.cabin_outlined;
    case 'decor':
    case 'decorations':
      return Icons.auto_awesome_outlined;
    case 'catering':
      return Icons.restaurant_outlined;
    default:
      return Icons.sell_outlined;
  }
}

/// Catalog list tile. Shows the first image if present, otherwise a
/// category icon placeholder — the current seed data has empty `images`
/// arrays, so the fallback is the common case, not an edge case.
class ItemCard extends StatelessWidget {
  final Item item;
  final VoidCallback onTap;
  const ItemCard({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final underMaintenance = item.status == 'under_maintenance';
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              _Thumbnail(item: item),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.text),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${Formatters.currency(item.rentalPrice)} / rental',
                      style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    if (underMaintenance)
                      const Text('Under maintenance', style: TextStyle(color: AppColors.danger, fontSize: 12))
                    else
                      Text('${item.quantityTotal} in fleet', style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.mutedText),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  final Item item;
  const _Thumbnail({required this.item});

  @override
  Widget build(BuildContext context) {
    const size = 64.0;
    if (item.images.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          item.images.first,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder(size),
        ),
      );
    }
    return _placeholder(size);
  }

  Widget _placeholder(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.accent, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 3)),
        ],
      ),
      child: Icon(iconForCategory(item.category), color: Colors.white, size: 28),
    );
  }
}
