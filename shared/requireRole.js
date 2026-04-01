/**
 * Role enforcement middleware factory.
 *
 * Usage:
 *   const { requireRole } = require('../../shared/requireRole');
 *   router.post('/admin-action', requireRole('admin'), handler);
 *   router.get('/read-data', requireRole('admin', 'manager'), handler);
 *
 * Responds 403 JSON for API routes, redirects for HTML routes.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // JSON response for API / AJAX calls
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json')) || req.path.startsWith('/api')) {
        return res.status(403).json({ ok: false, error: 'Forbidden: insufficient role' });
      }
      // HTML redirect for page requests
      return res.status(403).send('Forbidden');
    }
    next();
  };
}

module.exports = { requireRole };
