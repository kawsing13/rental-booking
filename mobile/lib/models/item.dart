/// Mirrors the `Item` shape from API_CONTRACT.md.
///
/// `rentalPrice` comes back from the API as a string (Postgres numeric type
/// serialized by the ORM), so it's parsed defensively here rather than cast.
class Item {
  final String id;
  final String name;
  final String category; // a categories.slug value - admin-editable, not a fixed set
  final String? description;
  final double rentalPrice;
  final int quantityTotal;
  final List<String> images;
  final String? rentalTerms;
  final String status; // available | under_maintenance
  final String createdAt;
  final String updatedAt;

  const Item({
    required this.id,
    required this.name,
    required this.category,
    this.description,
    required this.rentalPrice,
    required this.quantityTotal,
    required this.images,
    this.rentalTerms,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      description: json['description'] as String?,
      rentalPrice: _toDouble(json['rentalPrice']),
      quantityTotal: json['quantityTotal'] is int
          ? json['quantityTotal'] as int
          : int.tryParse('${json['quantityTotal']}') ?? 0,
      images: (json['images'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      rentalTerms: json['rentalTerms'] as String?,
      status: json['status'] as String? ?? 'available',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'category': category,
        'description': description,
        'rentalPrice': rentalPrice,
        'quantityTotal': quantityTotal,
        'images': images,
        'rentalTerms': rentalTerms,
        'status': status,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
