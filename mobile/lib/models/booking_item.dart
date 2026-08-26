import 'item.dart';

/// A line item within a [Booking]. The backend always nests the full [Item]
/// under `item` (confirmed live against `POST /bookings` and `GET
/// /bookings/:id`), which lets the UI show the item name/photo without an
/// extra round trip.
class BookingItem {
  final String id;
  final String bookingId;
  final String itemId;
  final int quantity;
  final double unitPrice;
  final double subtotal;
  final Item? item;

  const BookingItem({
    required this.id,
    required this.bookingId,
    required this.itemId,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
    this.item,
  });

  factory BookingItem.fromJson(Map<String, dynamic> json) {
    return BookingItem(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String? ?? '',
      itemId: json['itemId'] as String,
      quantity: json['quantity'] as int? ?? 0,
      unitPrice: _toDouble(json['unitPrice']),
      subtotal: _toDouble(json['subtotal']),
      item: json['item'] != null
          ? Item.fromJson(json['item'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'bookingId': bookingId,
        'itemId': itemId,
        'quantity': quantity,
        'unitPrice': unitPrice,
        'subtotal': subtotal,
        'item': item?.toJson(),
      };

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
