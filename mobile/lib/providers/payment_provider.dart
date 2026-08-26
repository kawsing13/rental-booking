import 'package:flutter/foundation.dart';

import '../models/payment.dart';
import '../services/api_exception.dart';
import '../services/api_service.dart';

/// Handles paying a booking (`POST /payments`) and loading its payment
/// history (`GET /payments/booking/:bookingId`). Amounts are always
/// whatever the caller passes in (reservation/balance fee from the
/// [Booking] the payment is for) — this provider never invents an amount.
class PaymentProvider extends ChangeNotifier {
  PaymentProvider(this._api);

  final ApiService _api;

  List<Payment> paymentsForBooking = [];
  bool isLoadingHistory = false;
  String? historyError;

  bool isPaying = false;
  String? payError;

  Future<void> loadPayments(String bookingId) async {
    isLoadingHistory = true;
    historyError = null;
    notifyListeners();
    try {
      final data = await _api.get('/payments/booking/$bookingId');
      paymentsForBooking = (data['payments'] as List<dynamic>)
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      historyError = e.message;
    } catch (e) {
      historyError = 'Network error. Please check your connection and try again.';
    } finally {
      isLoadingHistory = false;
      notifyListeners();
    }
  }

  /// Submits a payment. `gcash`/`maya` resolve to `status: 'paid'`
  /// immediately in the current mock backend; `cod`/`pickup_cash`/
  /// `bank_transfer` come back `pending` until an admin confirms them —
  /// the caller should surface that difference rather than assume success
  /// means "paid".
  Future<Payment?> pay({
    required String bookingId,
    required String method,
    required String type,
    required double amount,
    String? referenceNo,
    double? cashTendered,
  }) async {
    isPaying = true;
    payError = null;
    notifyListeners();
    try {
      final data = await _api.post('/payments', body: {
        'bookingId': bookingId,
        'method': method,
        'type': type,
        'amount': amount,
        if (referenceNo != null && referenceNo.isNotEmpty) 'referenceNo': referenceNo,
        if (cashTendered != null) 'cashTendered': cashTendered,
      });
      final payment = Payment.fromJson(data['payment'] as Map<String, dynamic>);
      paymentsForBooking = [payment, ...paymentsForBooking];
      return payment;
    } on ApiException catch (e) {
      payError = e.message;
      return null;
    } catch (e) {
      payError = 'Network error. Please check your connection and try again.';
      return null;
    } finally {
      isPaying = false;
      notifyListeners();
    }
  }
}
