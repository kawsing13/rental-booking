import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/booking_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/item_card.dart';
import '../../widgets/state_views.dart';
import '../booking/booking_draft_screen.dart';
import 'filter_sheet.dart';
import 'item_detail_screen.dart';

/// Browse/search/filter screen — the customer's landing tab. Loads
/// cache-first (see CatalogProvider.loadItems) so it's never a blank
/// screen on a slow connection.
class CatalogListScreen extends StatefulWidget {
  const CatalogListScreen({super.key});

  @override
  State<CatalogListScreen> createState() => _CatalogListScreenState();
}

class _CatalogListScreenState extends State<CatalogListScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final catalog = context.read<CatalogProvider>();
      catalog.loadItems();
      catalog.loadCategories();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openPriceFilter(CatalogProvider catalog) async {
    final result = await showModalBottomSheet<(double?, double?)>(
      context: context,
      isScrollControlled: true,
      builder: (_) => PriceFilterSheet(initialMin: catalog.minPrice, initialMax: catalog.maxPrice),
    );
    if (result == null) return;
    catalog.setFilters(
      category: catalog.category,
      search: catalog.search,
      minPrice: result.$1,
      maxPrice: result.$2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final booking = context.watch<BookingProvider>();
    final priceFilterActive = catalog.minPrice != null || catalog.maxPrice != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Rentals'),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                tooltip: 'Booking cart',
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const BookingDraftScreen()),
                ),
              ),
              if (booking.hasDraftItems)
                Positioned(
                  top: 8, right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '${booking.draftLines.length}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search items...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () {
                                _searchController.clear();
                                catalog.setFilters(
                                  category: catalog.category,
                                  minPrice: catalog.minPrice,
                                  maxPrice: catalog.maxPrice,
                                );
                              },
                            ),
                    ),
                    onSubmitted: (value) => catalog.setFilters(
                      category: catalog.category,
                      search: value,
                      minPrice: catalog.minPrice,
                      maxPrice: catalog.maxPrice,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  icon: Icon(Icons.tune, color: priceFilterActive ? AppColors.primary : null),
                  tooltip: 'Price filter',
                  onPressed: () => _openPriceFilter(catalog),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 40,
            child: Builder(builder: (context) {
              // "All" (null filter) plus whatever categories the backend
              // currently has - admin-added ones (see the web app's
              // Category Management page) show up here automatically.
              final chips = <(String label, String? value)>[
                ('All', null),
                for (final c in catalog.categories) (c.label, c.slug),
              ];
              return ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: chips.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final c = chips[index];
                  final selected = catalog.category == c.$2;
                  return ChoiceChip(
                    label: Text(c.$1),
                    selected: selected,
                    onSelected: (_) => catalog.setFilters(
                      category: c.$2,
                      search: catalog.search,
                      minPrice: catalog.minPrice,
                      maxPrice: catalog.maxPrice,
                    ),
                  );
                },
              );
            }),
          ),
          const SizedBox(height: 8),
          if (catalog.isFromCache) const CacheBanner(),
          Expanded(child: _buildBody(catalog)),
        ],
      ),
    );
  }

  Widget _buildBody(CatalogProvider catalog) {
    if (catalog.isLoading && catalog.items.isEmpty) return const LoadingView();
    if (catalog.errorMessage != null && catalog.items.isEmpty) {
      return ErrorView(message: catalog.errorMessage!, onRetry: () => catalog.loadItems(forceRefresh: true));
    }
    if (catalog.items.isEmpty) {
      return const EmptyView(message: 'No items match your search/filters.', icon: Icons.search_off);
    }
    return RefreshIndicator(
      onRefresh: () => catalog.loadItems(forceRefresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: catalog.items.length,
        itemBuilder: (context, index) {
          final item = catalog.items[index];
          return ItemCard(
            item: item,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ItemDetailScreen(itemId: item.id)),
            ),
          );
        },
      ),
    );
  }
}
