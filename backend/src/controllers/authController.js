const { User } = require('../db/models');
const authService = require('../services/authService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    address: user.address,
  };
}

function issueTokenPair(user) {
  return {
    accessToken: authService.issueAccessToken(user),
    refreshToken: authService.issueRefreshToken(user),
  };
}

// POST /api/auth/register - customers self-register; admin/staff accounts
// are created separately (seed data or an existing admin), never via this
// public endpoint, to avoid privilege escalation.
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, address } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await authService.hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    address,
    passwordHash,
    role: 'customer',
  });

  await auditService.record(user.id, 'register', 'User', user.id);

  res.status(201).json({ user: toPublicUser(user), ...issueTokenPair(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const ok = await authService.verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.json({ user: toPublicUser(user), ...issueTokenPair(user) });
});

// POST /api/auth/refresh - exchanges a valid refresh token for a new access
// token, so the client doesn't force a re-login every 15 minutes.
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  let payload;
  try {
    payload = authService.verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');

  res.json({ accessToken: authService.issueAccessToken(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

// PUT /api/auth/me - profile management (name, phone, address). Email/role
// are intentionally not editable here: email changes would need
// re-verification and role changes must go through an admin action.
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address !== undefined) req.user.address = address;
  await req.user.save();

  await auditService.record(req.user.id, 'update_profile', 'User', req.user.id);
  res.json({ user: toPublicUser(req.user) });
});

// POST /api/auth/forgot-password - always responds 200 even if the email
// doesn't exist, so the endpoint can't be used to enumerate registered
// accounts.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    const token = authService.issuePasswordResetToken(user);
    const resetMessage = `Password reset requested. Token (valid 30 min): ${token}`;
    await notificationService.sendEmail(user.email, 'Password Reset', resetMessage);
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  let payload;
  try {
    payload = authService.verifyPasswordResetToken(token);
  } catch (err) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = await User.findByPk(payload.sub);
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = await authService.hashPassword(newPassword);
  await user.save();
  await auditService.record(user.id, 'password_reset', 'User', user.id);

  res.json({ message: 'Password updated successfully' });
});

module.exports = { register, login, refresh, me, updateMe, forgotPassword, resetPassword };
