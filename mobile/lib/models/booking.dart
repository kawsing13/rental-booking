import 'booking_item.dart';
import 'payment.dart';

/// The full set of statuses a booking can be in, in the order defined by the
/// workflow in API_CONTRACT.md. Used to build the status timeline UI.
const List<String> kBookingStatusFlow = [
  'pending',
  'approved',
  'reserved',
  'out_for_delivery',
  'in_use',
  'returned',
  'completed',
];

/// Statuses that count as a "dead end" off the happy path.
const List<String> kBookingTerminalNegative = ['rejected', 'cancelled'];

/// Minimal customer info nested in a booking detail response.
class BookingCustomer {
  final String id;
  final String name;
  final String email;
  final String? phone;

  const BookingCustomer({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  factory BookingCustomer.fromJson(Map<String, dynamic> json) =>
      BookingCustomer(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
      );
}

/// Mirrors the `Booking` shape from API_CONTRACT.md. `customer`, `payments`
/// and `deliveries` are only populated by `GET /bookings/:id`; the list
/// endpoints (`/bookings/mine`) only return `items`.
class Booking {
  final String id;
  final String bookingReference;
  final String customerId;
  final String eventDate;
  final String returnDate;
  final String status;
  final String? deliveryAddress;
  final double deliveryFee;
  final double reservationFee;
  final double totalAmount;
  final String? notes;
  final List<BookingItem> items;
  final String createdAt;
  final String updatedAt;
  final BookingCustomer? customer;
  final List<Payment>? payments;

  const Booking({
    required this.id,
    required this.bookingReference,
    required this.customerId,
    required this.eventDate,
    required this.returnDate,
    required this.status,
    this.deliveryAddress,
    required this.deliveryFee,
    required this.reservationFee,
    required this.totalAmount,
    this.notes,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
    this.customer,
    this.payments,
  });

  /// Whether the customer is still allowed to cancel (server enforces this
  /// too, but the client checks it up front to disable the button rather
  /// than let the user hit a 400).
  bool get isCancellable => status == 'pending' || status == 'approved';

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as String,
      bookingReference: json['bookingReference'] as String? ?? '',
      customerId: json['customerId'] as String? ?? '',
      eventDate: json['eventDate'] as String? ?? '',
      returnDate: json['returnDate'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      deliveryAddress: json['deliveryAddress'] as String?,
      deliveryFee: _toDouble(json['deliveryFee']),
      reservationFee: _toDouble(json['reservationFee']),
      totalAmount: _toDouble(json['totalAmount']),
      notes: json['notes'] as String?,
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => BookingItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      customer: json['customer'] != null
          ? BookingCustomer.fromJson(json['customer'] as Map<String, dynamic>)
          : null,
      payments: json['payments'] != null
          ? (json['payments'] as List<dynamic>)
              .map((e) => Payment.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'bookingReference': bookingReference,
        'customerId': customerId,
        'eventDate': eventDate,
        'returnDate': returnDate,
        'status': status,
        'deliveryAddress': deliveryAddress,
        'deliveryFee': deliveryFee,
        'reservationFee': reservationFee,
        'totalAmount': totalAmount,
        'notes': notes,
        'items': items.map((e) => e.toJson()).toList(),
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
