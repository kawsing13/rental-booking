import 'package:flutter/foundation.dart';

import '../models/notification.dart';
import '../services/api_exception.dart';
import '../services/api_service.dart';

/// Drives the notifications list. Not cached locally (unlike catalog/
/// bookings) since notifications are inherently time-sensitive — showing a
/// stale unread count would be actively misleading rather than just stale.
class NotificationProvider extends ChangeNotifier {
  NotificationProvider(this._api);

  final ApiService _api;

  List<AppNotification> notifications = [];
  bool isLoading = false;
  String? errorMessage;

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  Future<void> loadNotifications() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await _api.get('/notifications/mine');
      notifications = (data['notifications'] as List<dynamic>)
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      errorMessage = e.message;
    } catch (e) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    // Optimistic update: notification read-state is low-stakes, so flip it
    // locally right away and let the API call happen underneath.
    final idx = notifications.indexWhere((n) => n.id == id);
    if (idx == -1 || notifications[idx].isRead) return;
    final previous = notifications[idx];
    notifications[idx] = previous.copyWith(isRead: true);
    notifyListeners();
    try {
      await _api.put('/notifications/$id/read');
    } catch (_) {
      // Any failure (API error or raw network exception) rolls back the
      // optimistic flip - both are equally "the write didn't happen".
      notifications[idx] = previous;
      notifyListeners();
    }
  }

  Future<void> markAllRead() async {
    final previous = notifications;
    notifications = notifications.map((n) => n.copyWith(isRead: true)).toList();
    notifyListeners();
    try {
      await _api.put('/notifications/read-all');
    } catch (_) {
      notifications = previous;
      notifyListeners();
    }
  }
}
