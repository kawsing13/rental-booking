/// Mirrors the `Category` shape from API_CONTRACT.md. Categories are
/// admin-managed (via the web app) rather than a fixed set, so the mobile
/// app just fetches and displays whatever the backend currently has -
/// see CatalogProvider.loadCategories().
class RentalCategory {
  final String id;
  final String slug;
  final String label;
  final String? icon;

  const RentalCategory({required this.id, required this.slug, required this.label, this.icon});

  factory RentalCategory.fromJson(Map<String, dynamic> json) {
    return RentalCategory(
      id: json['id'] as String,
      slug: json['slug'] as String,
      label: json['label'] as String,
      icon: json['icon'] as String?,
    );
  }
}
