const mongoose = require('mongoose');

// One record per admin action (who did what, to whom, when).
const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String },
    action: { type: String, required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetEmail: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);