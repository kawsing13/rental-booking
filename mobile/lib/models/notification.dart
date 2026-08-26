/// Mirrors the `Notification` shape from API_CONTRACT.md.
///
/// Named `AppNotification` (not `Notification`) to avoid colliding with
/// Flutter's own `Notification` widget-tree class.
class AppNotification {
  final String id;
  final String userId;
  final String? bookingId;
  final String type;
  final String message;
  final bool isRead;
  final String createdAt;

  const AppNotification({
    required this.id,
    required this.userId,
    this.bookingId,
    required this.type,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      bookingId: json['bookingId'] as String?,
      type: json['type'] as String? ?? '',
      message: json['message'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        userId: userId,
        bookingId: bookingId,
        type: type,
        message: message,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
      );
}
