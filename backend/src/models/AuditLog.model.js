const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String },
  method: { type: String },
  path: { type: String },
  resourceType: { type: String },
  resourceId: { type: String },
  statusCode: { type: Number },
  ip: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  prevHash: { type: String },
  hash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
