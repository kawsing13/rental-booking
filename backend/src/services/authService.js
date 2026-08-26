const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const SALT_ROUNDS = 10;

// All password hashing / JWT issuing lives here so controllers never touch
// bcrypt or jsonwebtoken directly - keeps the crypto surface area small and
// easy to audit.
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

function issueAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function issueRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// One-time token used for the "forgot password" email link. Short-lived and
// signed with the access secret + a purpose claim so it can't be reused as
// a normal access token.
function issuePasswordResetToken(user) {
  return jwt.sign({ sub: user.id, purpose: 'password_reset' }, env.jwt.accessSecret, {
    expiresIn: '30m',
  });
}

function verifyPasswordResetToken(token) {
  const payload = jwt.verify(token, env.jwt.accessSecret);
  if (payload.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }
  return payload;
}

module.exports = {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  issuePasswordResetToken,
  verifyPasswordResetToken,
};
