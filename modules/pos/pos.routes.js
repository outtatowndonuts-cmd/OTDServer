const express = require('express');
const path = require('path');
const router = express.Router();
const posController = require('./pos.controller');
const passportConfig = require('../../config/passport');
const { requireRole } = require('../../shared/requireRole');

// Serve built React assets (JS, CSS) from the pos public folder
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));

// SPA shell — requires login + staff role or above
router.get('/', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.index);

// API routes — all require auth + staff role or above
router.get('/api/csrf', passportConfig.isAuthenticated, posController.getCsrf);
router.get('/api/catalog', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.getCatalog);
router.get('/api/settings', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.getSettings);
router.post('/api/orders', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.createOrder);
router.post('/api/orders/:id/complete', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.completeOrder);
router.post('/api/orders/:id/cancel', passportConfig.isAuthenticated, requireRole('admin', 'manager'), posController.cancelOrder);
router.post('/api/orders/:id/refund', passportConfig.isAuthenticated, requireRole('admin', 'manager'), posController.refundOrder);
router.post('/api/stripe/payment-intent', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.createPaymentIntent);
router.post('/api/stripe/confirm', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.confirmStripePayment);

module.exports = {
  basePath: '/pos',
  router,
};
