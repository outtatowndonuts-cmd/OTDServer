const express = require('express');
const path = require('path');
const router = express.Router();
const adminController = require('./admin.controller');
const passportConfig = require('../../config/passport');
const { requireRole } = require('../../shared/requireRole');

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
router.post('/api/employees/:id/status', passportConfig.isAuthenticated, requireRole('admin'), adminController.setEmployeeStatus);
router.post('/api/inventory/adjust', passportConfig.isAuthenticated, requireRole('admin'), adminController.adjustInventory);

// Audit log — admin only
router.get('/api/audit-logs', passportConfig.isAuthenticated, requireRole('admin'), adminController.getAuditLogs);

// Application management — list: admin+manager / approve+deny: admin only
router.get('/api/applications', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getApplications);
router.post('/api/applications/:id/approve', passportConfig.isAuthenticated, requireRole('admin'), adminController.approveApplication);
router.post('/api/applications/:id/deny', passportConfig.isAuthenticated, requireRole('admin'), adminController.denyApplication);

// Settings — read: admin+manager / write: admin only
router.get('/api/settings', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getSettings);
router.post('/api/settings', passportConfig.isAuthenticated, requireRole('admin'), adminController.updateSettings);

// Bundle Configs — read: admin+manager / write: admin only
router.get('/api/supplies', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getSupplies);
router.get('/api/bundles', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getCustomBoxConfigs);
router.post('/api/bundles', passportConfig.isAuthenticated, requireRole('admin'), adminController.createCustomBoxConfig);
router.post('/api/bundles/:id', passportConfig.isAuthenticated, requireRole('admin'), adminController.updateCustomBoxConfig);
router.delete('/api/bundles/:id', passportConfig.isAuthenticated, requireRole('admin'), adminController.deleteCustomBoxConfig);

// Contact messages — read/reply: admin+manager
router.get('/api/contacts', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.getContactMessages);
router.post('/api/contacts/:id/read', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.markContactRead);
router.post('/api/contacts/:id/reply', passportConfig.isAuthenticated, requireRole('admin', 'manager'), adminController.replyToContact);

module.exports = {
  basePath: '/admin',
  router,
};
