// Minimal logger wrapper. Centralized so we can later swap console.* for a
// real logging library (pino/winston) without touching call sites.
module.exports = {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
};
