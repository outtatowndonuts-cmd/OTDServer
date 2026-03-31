const express = require('express');
const path = require('path');
const router = express.Router();
const posController = require('./pos.controller');
const passportConfig = require('../../config/passport');

// Serve built React assets (JS, CSS) from the pos public folder
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));

// SPA shell — requires login
router.get('/', passportConfig.isAuthenticated, posController.index);

// API routes — all require auth
router.get('/api/csrf', passportConfig.isAuthenticated, posController.getCsrf);
router.get('/api/catalog', passportConfig.isAuthenticated, posController.getCatalog);
router.get('/api/settings', passportConfig.isAuthenticated, posController.getSettings);
router.post('/api/orders', passportConfig.isAuthenticated, posController.createOrder);
router.post('/api/orders/:id/complete', passportConfig.isAuthenticated, posController.completeOrder);
router.post('/api/stripe/payment-intent', passportConfig.isAuthenticated, posController.createPaymentIntent);
router.post('/api/stripe/confirm', passportConfig.isAuthenticated, posController.confirmStripePayment);

module.exports = {
  basePath: '/pos',
  router,
};
