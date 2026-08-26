import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/api_exception.dart';
import '../services/api_service.dart';
import '../services/cache_service.dart';
import '../services/token_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Owns the current session: the logged-in [User], the token pair (via
/// [TokenStorage]), and every auth-related API call. Screens read
/// [status]/[currentUser]/[errorMessage] and call the action methods, which
/// all return a bool so a screen can decide what to do next without needing
/// try/catch of its own.
class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api) {
    // If the refresh token itself turns out to be expired/invalid, ApiService
    // has no way to update app state directly (that would be a service ->
    // provider dependency cycle) so it calls this callback instead.
    _api.onForcedLogout = _handleForcedLogout;
  }

  final ApiService _api;
  final TokenStorage _tokens = TokenStorage.instance;

  AuthStatus status = AuthStatus.unknown;
  User? currentUser;
  bool isLoading = false;
  String? errorMessage;

  /// Called once at app startup: if a token pair is already stored, verify
  /// it's still good by calling `/auth/me` rather than trusting it blindly.
  Future<void> tryAutoLogin() async {
    // Wrapped in one try/catch (rather than just around the /auth/me call)
    // because reading from secure storage itself can throw on some
    // platforms/environments — any failure here just means "start logged
    // out", never a crash.
    try {
      final accessToken = await _tokens.readAccessToken();
      if (accessToken == null) {
        status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }
      final data = await _api.get('/auth/me');
      currentUser = User.fromJson(data['user'] as Map<String, dynamic>);
      status = AuthStatus.authenticated;
    } catch (_) {
      // ApiService already attempted a silent refresh internally; if we're
      // still here with an error, the session really is dead.
      await _tokens.clear();
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? address,
  }) {
    return _runAuthCall(() => _api.post('/auth/register', body: {
          'name': name,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (address != null && address.isNotEmpty) 'address': address,
        }));
  }

  Future<bool> login({required String email, required String password}) {
    return _runAuthCall(() => _api.post('/auth/login', body: {
          'email': email,
          'password': password,
        }));
  }

  Future<bool> _runAuthCall(Future<dynamic> Function() call) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await call();
      await _tokens.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      currentUser = User.fromJson(data['user'] as Map<String, dynamic>);
      status = AuthStatus.authenticated;
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (e) {
      // Raw network exceptions (dropped WiFi, DNS hiccup) aren't
      // ApiExceptions - without this, errorMessage stays null and the
      // screen shows no feedback at all after a failed request.
      errorMessage = 'Network error. Please check your connection and try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> forgotPassword(String email) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _api.post('/auth/forgot-password', body: {'email': email});
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (e) {
      // Raw network exceptions (dropped WiFi, DNS hiccup) aren't
      // ApiExceptions - without this, errorMessage stays null and the
      // screen shows no feedback at all after a failed request.
      errorMessage = 'Network error. Please check your connection and try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword({required String token, required String newPassword}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _api.post('/auth/reset-password', body: {
        'token': token,
        'newPassword': newPassword,
      });
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (e) {
      // Raw network exceptions (dropped WiFi, DNS hiccup) aren't
      // ApiExceptions - without this, errorMessage stays null and the
      // screen shows no feedback at all after a failed request.
      errorMessage = 'Network error. Please check your connection and try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Updates name/phone/address via `PUT /auth/me`. This route isn't listed
  /// in API_CONTRACT.md but exists and works in the live backend
  /// (verified directly) — the plan explicitly calls for profile editing,
  /// and this is the only endpoint that provides it.
  Future<bool> updateProfile({String? name, String? phone, String? address}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await _api.put('/auth/me', body: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (address != null) 'address': address,
      });
      currentUser = User.fromJson(data['user'] as Map<String, dynamic>);
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (e) {
      // Raw network exceptions (dropped WiFi, DNS hiccup) aren't
      // ApiExceptions - without this, errorMessage stays null and the
      // screen shows no feedback at all after a failed request.
      errorMessage = 'Network error. Please check your connection and try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _tokens.clear();
    await CacheService.instance.clearAll();
    currentUser = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void _handleForcedLogout() {
    _tokens.clear();
    CacheService.instance.clearAll();
    currentUser = null;
    status = AuthStatus.unauthenticated;
    errorMessage = 'Your session expired. Please log in again.';
    notifyListeners();
  }

  void clearError() {
    errorMessage = null;
    notifyListeners();
  }
}
