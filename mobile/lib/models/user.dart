/// Mirrors the `user` shape from API_CONTRACT.md:
/// `{ id, name, email, phone, role, address }`.
class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? address;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.address,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String,
      address: json['address'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'address': address,
      };

  User copyWith({String? name, String? phone, String? address}) => User(
        id: id,
        name: name ?? this.name,
        email: email,
        phone: phone ?? this.phone,
        role: role,
        address: address ?? this.address,
      );
}
