const ApiError = require('../utils/ApiError');

// Route guard factory: requireRole('admin') or requireRole('admin', 'staff').
// Must run after `authenticate` so req.user is already populated.
function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = requireRole;
