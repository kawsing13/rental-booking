// Central place that loads and validates environment variables.
// Every other module should read config from here instead of process.env
// directly, so we have one spot to see what the app depends on.
require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'rental_booking',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  jwt: {
    // In production these MUST be overridden via real env vars - the
    // fallbacks only exist so local dev doesn't crash before .env is set up.
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_only_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_only_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Rental Booking App <no-reply@example.com>',
  },

  payments: {
    mockMode: (process.env.PAYMENTS_MOCK_MODE || 'true') === 'true',
    gcashApiKey: process.env.GCASH_API_KEY || '',
    mayaApiKey: process.env.MAYA_API_KEY || '',
  },
};
