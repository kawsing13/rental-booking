import 'dart:async' show unawaited;

import 'package:flutter/foundation.dart';

import '../models/booking.dart';
import '../models/item.dart';
import '../services/api_exception.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';
import '../utils/formatters.dart';

/// One line in the booking draft (an item + how many the customer wants).
/// Kept separate from [BookingItem] (the server's response shape) since the
/// draft only needs an id/quantity/item-for-display before it's submitted.
class DraftLine {
  final Item item;
  int quantity;
  DraftLine({required this.item, required this.quantity});
}

/// Carries a 409 "not enough stock" response so the booking review screen
/// can show exactly which item and how many are actually available, instead
/// of a generic error toast (per API_CONTRACT.md, this is an expected,
/// recoverable state).
class BookingConflict {
  final String itemId;
  final int requested;
  final int remaining;
  final String message;
  BookingConflict({
    required this.itemId,
    required this.requested,
    required this.remaining,
    required this.message,
  });
}

/// Manages both the in-progress booking draft (dates + cart) and the
/// customer's booking history (list/detail/cancel). Kept as one provider
/// since a submitted draft immediately becomes part of the history list.
class BookingProvider extends ChangeNotifier {
  BookingProvider(this._api);

  final ApiService _api;
  final CacheService _cache = CacheService.instance;

  // --- Draft state ---------------------------------------------------------

  DateTime? eventDate;
  DateTime? returnDate;
  String? deliveryAddress;
  String? notes;
  final Map<String, DraftLine> _draftLines = {};

  List<DraftLine> get draftLines => _draftLines.values.toList();
  bool get hasDraftItems => _draftLines.isNotEmpty;

  double get draftSubtotal => _draftLines.values
      .fold(0.0, (sum, line) => sum + line.item.rentalPrice * line.quantity);

  void setDates({required DateTime event, required DateTime returnD}) {
    eventDate = event;
    returnDate = returnD;
    notifyListeners();
  }

  void setDeliveryAddress(String? address) {
    deliveryAddress = (address == null || address.trim().isEmpty) ? null : address.trim();
    notifyListeners();
  }

  void setNotes(String? value) {
    notes = (value == null || value.trim().isEmpty) ? null : value.trim();
    notifyListeners();
  }

  void addOrUpdateLine(Item item, int quantity) {
    if (quantity <= 0) {
      _draftLines.remove(item.id);
    } else {
      _draftLines[item.id] = DraftLine(item: item, quantity: quantity);
    }
    notifyListeners();
  }

  void removeLine(String itemId) {
    _draftLines.remove(itemId);
    notifyListeners();
  }

  void clearDraft() {
    eventDate = null;
    returnDate = null;
    deliveryAddress = null;
    notes = null;
    _draftLines.clear();
    notifyListeners();
  }

  bool isSubmitting = false;
  String? submitError;
  BookingConflict? submitConflict;

  /// Submits the draft. Returns the created [Booking] on success; on a 409
  /// it populates [submitConflict] and returns null so the review screen
  /// can show an inline "only N left" message and let the customer adjust
  /// the quantity, rather than treating it like an unexpected failure.
  Future<Booking?> submitBooking() async {
    if (eventDate == null || returnDate == null || _draftLines.isEmpty) {
      submitError = 'Pick your dates and add at least one item first.';
      notifyListeners();
      return null;
    }

    isSubmitting = true;
    submitError = null;
    submitConflict = null;
    notifyListeners();

    try {
      final data = await _api.post('/bookings', body: {
        'eventDate': Formatters.apiDate(eventDate!),
        'returnDate': Formatters.apiDate(returnDate!),
        if (deliveryAddress != null) 'deliveryAddress': deliveryAddress,
        if (notes != null) 'notes': notes,
        'items': _draftLines.values
            .map((line) => {'itemId': line.item.id, 'quantity': line.quantity})
            .toList(),
      });
      final booking = Booking.fromJson(data['booking'] as Map<String, dynamic>);
      clearDraft();
      // Refresh the "mine" list in the background so it's ready when the
      // customer navigates to My Bookings next.
      unawaited(loadMyBookings(forceRefresh: true));
      return booking;
    } on ApiException catch (e) {
      if (e.isConflict && e.details is Map) {
        final details = e.details as Map;
        submitConflict = BookingConflict(
          itemId: details['itemId'] as String? ?? '',
          requested: details['requested'] as int? ?? 0,
          remaining: details['remaining'] as int? ?? 0,
          message: e.message,
        );
      } else {
        submitError = e.message;
      }
      return null;
    } catch (e) {
      submitError = 'Network error. Please check your connection and try again.';
      return null;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  // --- Booking history -------------------------------------------------

  List<Booking> myBookings = [];
  bool isLoadingMine = false;
  bool mineFromCache = false;
  String? mineError;

  Future<void> loadMyBookings({bool forceRefresh = false}) async {
    if (!forceRefresh && myBookings.isEmpty) {
      final cached = await _cache.loadBookings();
      if (cached.isNotEmpty) {
        myBookings = cached;
        mineFromCache = true;
        notifyListeners();
      }
    }

    isLoadingMine = true;
    mineError = null;
    notifyListeners();
    try {
      final data = await _api.get('/bookings/mine');
      myBookings = (data['bookings'] as List<dynamic>)
          .map((e) => Booking.fromJson(e as Map<String, dynamic>))
          .toList();
      mineFromCache = false;
      await _cache.saveBookings(myBookings);
    } on ApiException catch (e) {
      mineError = e.message;
    } catch (e) {
      mineError = 'Network error. Please check your connection and try again.';
    } finally {
      isLoadingMine = false;
      notifyListeners();
    }
  }

  Booking? selectedBooking;
  bool isLoadingDetail = false;
  String? detailError;

  Future<void> loadBookingDetail(String id) async {
    isLoadingDetail = true;
    detailError = null;
    notifyListeners();
    try {
      final data = await _api.get('/bookings/$id');
      selectedBooking = Booking.fromJson(data['booking'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      detailError = e.message;
    } catch (e) {
      detailError = 'Network error. Please check your connection and try again.';
    } finally {
      isLoadingDetail = false;
      notifyListeners();
    }
  }

  bool isCancelling = false;

  Future<bool> cancelBooking(String id) async {
    isCancelling = true;
    notifyListeners();
    try {
      final data = await _api.put('/bookings/$id/cancel');
      final updated = Booking.fromJson(data['booking'] as Map<String, dynamic>);
      selectedBooking = updated;
      final idx = myBookings.indexWhere((b) => b.id == id);
      if (idx != -1) myBookings[idx] = updated;
      await _cache.saveBookings(myBookings);
      return true;
    } on ApiException catch (e) {
      detailError = e.message;
      return false;
    } catch (e) {
      detailError = 'Network error. Please check your connection and try again.';
      return false;
    } finally {
      isCancelling = false;
      notifyListeners();
    }
  }
}
