import 'package:flutter/material.dart';

/// Single source of truth for the app's light-blue palette and [ThemeData].
///
/// The hex values below are copied verbatim from the "Theme" section of
/// API_CONTRACT.md so the mobile app stays visually consistent with the
/// React web frontend, which uses the same palette as CSS variables.
class AppColors {
  AppColors._();

  static const primary = Color(0xFF2F86D6);
  static const primaryDark = Color(0xFF1D5FA3);
  static const primaryLight = Color(0xFFEAF4FC); // page background
  static const accent = Color(0xFF5FB3E8);
  static const surface = Color(0xFFFFFFFF);
  static const text = Color(0xFF1E2A38);
  static const mutedText = Color(0xFF5B6B7C);
  static const border = Color(0xFFD6E8F7);
  static const success = Color(0xFF2FA84F);
  static const warning = Color(0xFFE0A100);
  static const danger = Color(0xFFD64545);

  // Brand mark accent - the RentTa logo is a blue-to-green gradient, kept
  // separate from the functional palette above (which stays blue-only) so
  // the rest of the UI doesn't turn green, just the logo/wordmark.
  static const brandGreen = Color(0xFF3FB751);
  static const brandGradient = LinearGradient(
    colors: [primary, brandGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Extra colors used only by the booking-status badges (see StatusBadge
  // widget). Purple/teal/slate aren't part of the core palette above but are
  // called out explicitly by API_CONTRACT.md's "Status badge color
  // suggestion" so the mapping is fixed here rather than invented per-screen.
  static const statusPurple = Color(0xFF8B5FBF);
  static const statusTeal = Color(0xFF2FA89E);
  static const statusSlate = Color(0xFF6B7A8F);
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      onSurface: AppColors.text,
      error: AppColors.danger,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.primaryLight,
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 2,
        shadowColor: AppColors.primary.withValues(alpha: 0.15),
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: const TextStyle(color: AppColors.mutedText),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          elevation: 2,
          shadowColor: AppColors.primaryDark.withValues(alpha: 0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.1),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryDark,
          side: const BorderSide(color: AppColors.primary, width: 1.4),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: AppColors.primary),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: AppColors.text,
        contentTextStyle: TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: AppColors.text),
        bodyMedium: TextStyle(color: AppColors.text),
        bodySmall: TextStyle(color: AppColors.mutedText),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.border),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.mutedText,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
