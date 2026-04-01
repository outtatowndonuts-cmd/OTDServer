const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String },
    targetType: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Record an audit log entry.
 *
 * @param {string} action     - e.g. 'order.cancelled', 'order.refunded', 'inventory.adjusted', 'employee.roleChanged'
 * @param {object} actor      - User object (must have _id, email) or null for system actions
 * @param {object} [opts]
 * @param {string} [opts.targetType] - e.g. 'Order', 'InventoryItem', 'User'
 * @param {string} [opts.targetId]   - ObjectId of the target document
 * @param {object} [opts.details]    - Freeform details about the action
 */
async function log(action, actor, opts = {}) {
  try {
    await AuditLog.create({
      action,
      actor: actor ? actor._id : null,
      actorEmail: actor ? actor.email : 'system',
      targetType: opts.targetType,
      targetId: opts.targetId,
      details: opts.details,
    });
  } catch (err) {
    console.error('[Audit] Failed to write audit log:', err);
  }
}

/**
 * Query audit logs with optional filters.
 */
async function getAuditLogs(filters = {}) {
  const query = {};
  if (filters.action) query.action = filters.action;
  if (filters.actor) query.actor = filters.actor;
  if (filters.targetType) query.targetType = filters.targetType;
  if (filters.targetId) query.targetId = filters.targetId;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      query.createdAt.$lte = to;
    }
  }
  const limit = Math.min(parseInt(filters.limit, 10) || 100, 500);
  return AuditLog.find(query).sort({ createdAt: -1 }).limit(limit);
}

module.exports = { AuditLog, log, getAuditLogs };
