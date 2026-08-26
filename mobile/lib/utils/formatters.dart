import 'package:intl/intl.dart';

/// Shared formatting helpers so currency/date rendering is consistent
/// across every screen instead of each widget rolling its own.
class Formatters {
  Formatters._();

  static final _currency = NumberFormat.currency(locale: 'en_PH', symbol: 'PHP ', decimalDigits: 2);
  static final _shortDate = DateFormat('MMM d, yyyy');
  static final _dateTime = DateFormat('MMM d, yyyy • h:mm a');

  static String currency(double amount) => _currency.format(amount);

  /// Formats an ISO date string (`YYYY-MM-DD` or full timestamp) for
  /// display. Falls back to the raw string if parsing fails so a malformed
  /// value never crashes a screen.
  static String date(String isoDate) {
    try {
      return _shortDate.format(DateTime.parse(isoDate));
    } catch (_) {
      return isoDate;
    }
  }

  static String dateTime(String isoDateTime) {
    try {
      return _dateTime.format(DateTime.parse(isoDateTime).toLocal());
    } catch (_) {
      return isoDateTime;
    }
  }

  /// `YYYY-MM-DD`, the date format the API expects on bookings/availability
  /// requests.
  static String apiDate(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }
}
