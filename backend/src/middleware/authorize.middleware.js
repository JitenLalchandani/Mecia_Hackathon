// Simple RBAC authorization middleware
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

      const roles = Array.isArray(user.roles) ? user.roles : [];
      const allowed = roles.some(r => allowedRoles.includes(r));
      if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authorize };
