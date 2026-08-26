const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../db/models');

// Verifies the Bearer access token on protected routes and attaches the
// authenticated user (fresh from the DB, not just the token payload, so a
// deactivated account is rejected immediately) as req.user.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.accessSecret);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or disabled');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
