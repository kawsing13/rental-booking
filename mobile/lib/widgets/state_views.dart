import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Small set of shared "screen state" widgets (loading/error/empty) so
/// every list screen doesn't reinvent its own spinner/retry layout.

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const ErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger, size: 40),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.text)),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  final String message;
  final IconData icon;
  const EmptyView({super.key, required this.message, this.icon = Icons.inbox_outlined});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.mutedText, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.mutedText)),
          ],
        ),
      ),
    );
  }
}

/// Thin banner shown above a list that's currently rendering cached data
/// while a fresh fetch is (or was) attempted — makes the "offline/stale"
/// state visible instead of silently showing old data as if it were live.
class CacheBanner extends StatelessWidget {
  const CacheBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.warning.withValues(alpha: 0.15),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: const Row(
        children: [
          Icon(Icons.cloud_off, size: 16, color: AppColors.warning),
          SizedBox(width: 6),
          Text(
            'Showing saved data — pull to refresh',
            style: TextStyle(fontSize: 12, color: AppColors.warning),
          ),
        ],
      ),
    );
  }
}
