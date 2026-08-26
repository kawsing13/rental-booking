import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

import 'api_exception.dart';
import 'token_storage.dart';

/// Resolves the backend base URL per-platform.
///
/// The backend always listens on `localhost:4000` on the host machine, but
/// "localhost" means something different depending on where the Flutter
/// engine actually runs:
///  - Android emulator: the emulator is its own virtual device, so
///    `localhost` would point at the emulator itself. `10.0.2.2` is the
///    special alias Android emulators provide for the host loopback.
///  - iOS simulator / desktop / web: these share the host's network stack,
///    so plain `localhost` reaches the backend directly.
class ApiConfig {
  ApiConfig._();

  /// Optional override for the backend base URL, e.g. when running on a
  /// physical device that can't reach the host via `localhost`/`10.0.2.2`
  /// and needs the host's LAN IP instead:
  ///
  ///   flutter run --dart-define=API_BASE_URL=http://192.168.1.23:4000/api
  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    if (kIsWeb) return 'http://localhost:4000/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:4000/api';
    return 'http://localhost:4000/api';
  }
}

/// Thin HTTP client wrapper around the REST API.
///
/// Centralizes three things every screen would otherwise duplicate:
///  1. Attaching the `Authorization: Bearer <token>` header.
///  2. Decoding the `{ error: { message, details } }` envelope into
///     [ApiException] so callers can `catch (e) { e.message }` directly.
///  3. Silent token refresh: on a 401 (other than from the auth endpoints
///     themselves), call `/auth/refresh` once and retry the original
///     request before giving up and forcing a logout.
class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  final TokenStorage _tokens = TokenStorage.instance;

  /// Set by AuthProvider so ApiService can clear app-level auth state when
  /// a refresh attempt ultimately fails (expired/invalid refresh token).
  /// Kept as a simple callback instead of a direct AuthProvider dependency
  /// to avoid a service -> provider import cycle.
  void Function()? onForcedLogout;

  /// Guards against multiple concurrent requests each independently trying
  /// to refresh the token when they all hit a 401 at roughly the same time.
  Future<String?>? _refreshInFlight;

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final cleanQuery = <String, String>{};
    query?.forEach((key, value) {
      if (value != null) cleanQuery[key] = value.toString();
    });
    return Uri.parse('${ApiConfig.baseUrl}$path')
        .replace(queryParameters: cleanQuery.isEmpty ? null : cleanQuery);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send('GET', path, query: query);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) {
    return _send('POST', path, body: body);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) {
    return _send('PUT', path, body: body);
  }

  Future<dynamic> delete(String path) {
    return _send('DELETE', path);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
    bool isRetry = false,
  }) async {
    final uri = _uri(path, query);
    final headers = <String, String>{'Content-Type': 'application/json'};

    // /auth/* routes either don't need a token or are the refresh call
    // itself, so skip attaching one and skip the 401-refresh dance for them.
    final isAuthRoute = path.startsWith('/auth/');
    if (!isAuthRoute) {
      final token = await _tokens.readAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    late http.Response response;
    final encodedBody = body != null ? jsonEncode(body) : null;
    switch (method) {
      case 'GET':
        response = await _client.get(uri, headers: headers);
      case 'POST':
        response = await _client.post(uri, headers: headers, body: encodedBody);
      case 'PUT':
        response = await _client.put(uri, headers: headers, body: encodedBody);
      case 'DELETE':
        response = await _client.delete(uri, headers: headers);
      default:
        throw ArgumentError('Unsupported method $method');
    }

    if (response.statusCode == 401 && !isAuthRoute && !isRetry) {
      final refreshed = await _attemptRefresh();
      if (refreshed != null) {
        // Retry exactly once with the new token, per the contract's
        // "retry once, then force logout" rule.
        return _send(method, path, query: query, body: body, isRetry: true);
      }
      onForcedLogout?.call();
      throw ApiException(statusCode: 401, message: 'Session expired. Please log in again.');
    }

    return _decode(response);
  }

  /// Calls `/auth/refresh` with the stored refresh token. Returns the new
  /// access token on success, or null if refresh failed (expired/invalid
  /// refresh token, network error, etc.) — callers treat null as "force
  /// logout".
  Future<String?> _attemptRefresh() {
    // If a refresh is already underway (triggered by a different concurrent
    // request), piggyback on it instead of firing a second refresh call.
    _refreshInFlight ??= _doRefresh();
    return _refreshInFlight!.whenComplete(() => _refreshInFlight = null);
  }

  Future<String?> _doRefresh() async {
    final refreshToken = await _tokens.readRefreshToken();
    if (refreshToken == null) return null;
    try {
      final uri = _uri('/auth/refresh');
      final response = await _client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
      if (response.statusCode != 200) {
        await _tokens.clear();
        return null;
      }
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final newAccessToken = decoded['accessToken'] as String?;
      if (newAccessToken == null) {
        await _tokens.clear();
        return null;
      }
      await _tokens.saveAccessToken(newAccessToken);
      return newAccessToken;
    } catch (_) {
      // Network failure during refresh: don't wipe tokens, just fail this
      // round so the caller surfaces a normal error (the user may just be
      // offline, not logged out).
      return null;
    }
  }

  dynamic _decode(http.Response response) {
    final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    Map<String, dynamic>? decoded;
    if (response.body.isNotEmpty) {
      try {
        decoded = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        // Non-JSON body (rare, e.g. a proxy error page). Fall through and
        // let the status-code check below produce a sensible message.
      }
    }

    if (isSuccess) return decoded;

    final error = decoded?['error'] as Map<String, dynamic>?;
    throw ApiException(
      statusCode: response.statusCode,
      message: error?['message'] as String? ?? 'Request failed (${response.statusCode})',
      details: error?['details'],
    );
  }
}
