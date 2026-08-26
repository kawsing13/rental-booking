/// Response of `GET /items/:id/availability`.
///
/// This is the only reliable source of "how many are left" for a specific
/// date range — the catalog list endpoint deliberately does not include it
/// (see API_CONTRACT.md note under the `Item` shape).
class Availability {
  final String itemId;
  final String name;
  final int quantityTotal;
  final int reserved;
  final int available;

  const Availability({
    required this.itemId,
    required this.name,
    required this.quantityTotal,
    required this.reserved,
    required this.available,
  });

  factory Availability.fromJson(Map<String, dynamic> json) {
    return Availability(
      itemId: json['itemId'] as String,
      name: json['name'] as String? ?? '',
      quantityTotal: json['quantityTotal'] as int? ?? 0,
      reserved: json['reserved'] as int? ?? 0,
      available: json['available'] as int? ?? 0,
    );
  }
}
