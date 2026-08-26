const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

// Express recognizes this as an error handler because it has 4 params.
// Every thrown/next(err) error in the app funnels through here, so response
// shape stays consistent and stack traces never leak in production.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (!isApiError) {
    logger.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: isApiError ? err.message : 'Internal server error',
      details: isApiError ? err.details : undefined,
      stack: env.nodeEnv === 'development' ? err.stack : undefined,
    },
  });
}

module.exports = errorHandler;
