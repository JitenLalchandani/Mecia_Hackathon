const AuditLog = require('../models/AuditLog.model');
const crypto = require('crypto');

const SECRET = process.env.AUDIT_LOG_SECRET || 'default_audit_secret';

const computeHash = (payload, prevHash) => {
  const h = crypto.createHmac('sha256', SECRET);
  h.update(JSON.stringify(payload));
  if (prevHash) h.update(prevHash);
  return h.digest('hex');
};

// Generic audit logger middleware. Attaches a listener to response finish.
const auditLogger = () => {
  return async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
      try {
        // only log authenticated users to reduce noise
        if (!req.user) return;

        const prev = await AuditLog.findOne().sort({ createdAt: -1 }).lean();
        const prevHash = prev ? prev.hash : null;

        const payload = {
          user: req.user._id,
          action: `${req.method} ${req.originalUrl}`,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          ip: req.ip,
          meta: {
            params: req.params || {},
            query: req.query || {},
            body: req.body || {},
            durationMs: Date.now() - start
          },
          prevHash
        };

        const hash = computeHash(payload, prevHash);
        payload.hash = hash;

        // Create entry (strip prevHash from stored payload since it's duplicated)
        await AuditLog.create({
          user: payload.user,
          action: payload.action,
          method: payload.method,
          path: payload.path,
          statusCode: payload.statusCode,
          ip: payload.ip,
          meta: payload.meta,
          prevHash,
          hash
        });
      } catch (err) {
        // do not break request flow for logging errors
        console.error('Audit log error', err.message || err);
      }
    });

    next();
  };
};

module.exports = { auditLogger, computeHash };
