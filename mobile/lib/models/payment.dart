/// Mirrors the `Payment` shape from API_CONTRACT.md.
class Payment {
  final String id;
  final String bookingId;
  final String method; // cod | pickup_cash | bank_transfer | gcash | maya
  final String type; // reservation | balance | refund
  final double amount;
  final String status; // pending | paid | failed | refunded
  final String? referenceNo;
  final String? receiptNumber;
  final String? paidAt;
  // Cash-only ("pay with cash, get change") - null for every other method.
  final double? cashTendered;
  final double? changeDue;

  const Payment({
    required this.id,
    required this.bookingId,
    required this.method,
    required this.type,
    required this.amount,
    required this.status,
    this.referenceNo,
    this.receiptNumber,
    this.paidAt,
    this.cashTendered,
    this.changeDue,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as String,
      bookingId: json['bookingId'] as String,
      method: json['method'] as String,
      type: json['type'] as String,
      amount: _toDouble(json['amount']),
      status: json['status'] as String,
      referenceNo: json['referenceNo'] as String?,
      receiptNumber: json['receiptNumber'] as String?,
      paidAt: json['paidAt'] as String?,
      cashTendered: json['cashTendered'] == null ? null : _toDouble(json['cashTendered']),
      changeDue: json['changeDue'] == null ? null : _toDouble(json['changeDue']),
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
