import 'package:flutter/foundation.dart';

import '../models/availability.dart';
import '../models/category.dart';
import '../models/item.dart';
import '../services/api_exception.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';

/// Drives the catalog browse/search/filter screen and the item detail
/// screen (including its live availability check).
///
/// Cache-first behavior: [loadItems] immediately paints whatever was cached
/// from the last successful fetch (if any), then fires the real API call
/// in the background and swaps in fresh data when it lands. That way a
/// slow/offline connection shows stale-but-useful content instead of a
/// blank spinner.
class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._api);

  final ApiService _api;
  final CacheService _cache = CacheService.instance;

  List<Item> items = [];
  bool isLoading = false;
  bool isFromCache = false;
  String? errorMessage;

  // Admin-editable category list (see RentalCategory) - fetched once and
  // used to populate the catalog's filter chips instead of a hardcoded set.
  List<RentalCategory> categories = [];

  Future<void> loadCategories() async {
    try {
      final data = await _api.get('/categories');
      categories = (data['categories'] as List<dynamic>)
          .map((e) => RentalCategory.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    } catch (_) {
      // Non-fatal: the filter row just shows "All" until this succeeds
      // (e.g. on retry via loadItems' pull-to-refresh triggering a rebuild).
    }
  }

  // Active filters, kept here so the filter sheet and the list screen share
  // one source of truth.
  String? category;
  String? search;
  double? minPrice;
  double? maxPrice;

  Item? selectedItem;
  bool isLoadingDetail = false;

  Availability? availability;
  bool isCheckingAvailability = false;
  String? availabilityError;

  Future<void> loadItems({bool forceRefresh = false}) async {
    // Only the unfiltered "all items" list is cached (per the brief's
    // narrow caching scope), so skip the cache-first paint when filters are
    // active — those always go straight to the network.
    final noFiltersActive =
        category == null && (search == null || search!.isEmpty) && minPrice == null && maxPrice == null;

    if (noFiltersActive && !forceRefresh && items.isEmpty) {
      final cached = await _cache.loadCatalog();
      if (cached.isNotEmpty) {
        items = cached;
        isFromCache = true;
        notifyListeners();
      }
    }

    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await _api.get('/items', query: {
        if (category != null) 'category': category,
        if (search != null && search!.isNotEmpty) 'search': search,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
      });
      final list = (data['items'] as List<dynamic>)
          .map((e) => Item.fromJson(e as Map<String, dynamic>))
          .toList();
      items = list;
      isFromCache = false;
      if (noFiltersActive) {
        await _cache.saveCatalog(list);
      }
    } on ApiException catch (e) {
      errorMessage = e.message;
      // Keep whatever cached/previous items were already shown; a failed
      // refresh shouldn't blank out a screen that had content.
    } catch (e) {
      // Non-API failures (dropped WiFi mid-request, DNS hiccup, etc. throw
      // a raw SocketException/ClientException from package:http, not an
      // ApiException) must still surface as a real message - otherwise the
      // UI is left with no errorMessage and silently shows nothing useful.
      errorMessage = 'Network error. Please check your connection and try again.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void setFilters({String? category, String? search, double? minPrice, double? maxPrice}) {
    this.category = category;
    this.search = search;
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    loadItems(forceRefresh: true);
  }

  void clearFilters() {
    category = null;
    search = null;
    minPrice = null;
    maxPrice = null;
    loadItems(forceRefresh: true);
  }

  Future<void> loadItemDetail(String id) async {
    selectedItem = await _cache.loadItem(id);
    isLoadingDetail = selectedItem == null;
    notifyListeners();
    try {
      final data = await _api.get('/items/$id');
      selectedItem = Item.fromJson(data['item'] as Map<String, dynamic>);
      await _cache.saveItem(selectedItem!);
    } on ApiException catch (e) {
      if (selectedItem == null) errorMessage = e.message;
    } catch (e) {
      // See loadItems() - a raw network exception must not be silently
      // swallowed into a misleading "not found" state.
      if (selectedItem == null) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
    } finally {
      isLoadingDetail = false;
      notifyListeners();
    }
  }

  /// Calls `GET /items/:id/availability` for a chosen date range. This is
  /// the only source of truth for "how many can I actually book" — the
  /// catalog/detail endpoints don't factor in dates at all.
  Future<void> checkAvailability({
    required String itemId,
    required String eventDate,
    required String returnDate,
  }) async {
    isCheckingAvailability = true;
    availabilityError = null;
    availability = null;
    notifyListeners();
    try {
      final data = await _api.get('/items/$itemId/availability', query: {
        'eventDate': eventDate,
        'returnDate': returnDate,
      });
      availability = Availability.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      availabilityError = e.message;
    } catch (e) {
      availabilityError = 'Network error. Please check your connection and try again.';
    } finally {
      isCheckingAvailability = false;
      notifyListeners();
    }
  }

  void resetAvailability() {
    availability = null;
    availabilityError = null;
    notifyListeners();
  }
}
