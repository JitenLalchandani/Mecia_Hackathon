const AuditLog = require('../models/AuditLog.model');

const getLogs = async (req, res, next) => {
  try {
    const limit = Math.min(1000, parseInt(req.query.limit, 10) || 100);
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email roles')
      .lean();

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
