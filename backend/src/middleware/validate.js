const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an array of express-validator checks on a route; collects any
// validation failures into one consistent 400 response shape.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest('Validation failed', errors.array()));
  }
  next();
}

module.exports = validate;
