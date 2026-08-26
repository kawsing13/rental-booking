/// Thrown by [ApiService] for any non-2xx response.
///
/// Mirrors the error envelope from API_CONTRACT.md:
/// `{ error: { message, details } }`. `details` is either a list of
/// express-validator issues (400) or a conflict payload
/// `{ itemId, requested, remaining }` (409) — callers that care about the
/// shape (like the booking flow's 409 handler) read [details] themselves.
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic details;

  ApiException({
    required this.statusCode,
    required this.message,
    this.details,
  });

  bool get isUnauthorized => statusCode == 401;
  bool get isConflict => statusCode == 409;
  bool get isValidation => statusCode == 400;

  @override
  String toString() => message;
}
