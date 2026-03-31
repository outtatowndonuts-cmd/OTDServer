const express = require('express');
const path = require('path');
const router = express.Router();
const adminController = require('./admin.controller');
const passportConfig = require('../../config/passport');

/**
 * Role-based access middleware.
 * Allows admin for all routes; manager for read-only routes.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Serve built React assets
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));

// SPA shell — admin or manager
router.get('/', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.index);

// Allow client-side routing: any non-API, non-asset GET → serve SPA shell
router.get(/^\/(?!api\/)(?!assets\/)(.+)/, passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.index);

// API routes — read endpoints are accessible to admin + manager
router.get('/api/csrf', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getCsrf);
router.get('/api/dashboard', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getDashboard);
router.get('/api/orders', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getOrders);
router.get('/api/inventory', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getInventory);
router.get('/api/employees', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getEmployees);

// Write endpoints — admin only
router.post('/api/employees/:id/role', passportConfig.isAuthenticated, requireRole('admin'), adminController.updateEmployeeRole);
router.post('/api/inventory/adjust', passportConfig.isAuthenticated, requireRole('admin'), adminController.adjustInventory);

module.exports = {
  basePath: '/admin',
  router,
};
