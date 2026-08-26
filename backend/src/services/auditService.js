const { AuditLog } = require('../db/models');
const logger = require('../utils/logger');

// Fire-and-forget audit trail for inventory/booking mutations (PDF security
// requirement: "Audit logs for inventory and booking updates"). Failures
// here are logged but never block the primary request.
async function record(userId, action, entityType, entityId, details = null) {
  try {
    await AuditLog.create({ userId, action, entityType, entityId: String(entityId), details });
  } catch (err) {
    logger.warn('Failed to write audit log', err.message);
  }
}

module.exports = { record };
