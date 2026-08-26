import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/notification.dart';
import '../../providers/notification_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/state_views.dart';
import '../booking/booking_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notifications = context.watch<NotificationProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifications.unreadCount > 0)
            TextButton(
              onPressed: () => notifications.markAllRead(),
              child: const Text('Mark all read', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: _buildBody(notifications),
    );
  }

  Widget _buildBody(NotificationProvider notifications) {
    if (notifications.isLoading && notifications.notifications.isEmpty) return const LoadingView();
    if (notifications.errorMessage != null && notifications.notifications.isEmpty) {
      return ErrorView(message: notifications.errorMessage!, onRetry: () => notifications.loadNotifications());
    }
    if (notifications.notifications.isEmpty) {
      return const EmptyView(message: 'No notifications yet.', icon: Icons.notifications_none);
    }
    return RefreshIndicator(
      onRefresh: () => notifications.loadNotifications(),
      child: ListView.separated(
        itemCount: notifications.notifications.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final n = notifications.notifications[index];
          return _NotificationTile(notification: n, onTap: () => _handleTap(context, notifications, n));
        },
      ),
    );
  }

  void _handleTap(BuildContext context, NotificationProvider notifications, AppNotification n) {
    if (!n.isRead) notifications.markRead(n.id);
    if (n.bookingId != null) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => BookingDetailScreen(bookingId: n.bookingId!)),
      );
    }
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: notification.isRead ? null : AppColors.primaryLight,
      leading: Icon(
        notification.isRead ? Icons.notifications_none : Icons.notifications_active,
        color: notification.isRead ? AppColors.mutedText : AppColors.primary,
      ),
      title: Text(
        notification.message,
        style: TextStyle(fontWeight: notification.isRead ? FontWeight.normal : FontWeight.w600),
      ),
      subtitle: Text(Formatters.dateTime(notification.createdAt), style: const TextStyle(fontSize: 12)),
    );
  }
}
