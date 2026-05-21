const express = require('express');
const path = require('path');
const router = express.Router();
const posController = require('./pos.controller');
const passportConfig = require('../../config/passport');
const { requireRole } = require('../../shared/requireRole');

// Serve built React assets (JS, CSS) from the pos public folder
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));

// ── Clerk SPA ──────────────────────────────────────────────────────────────
// Requires login + staff role or above
router.get('/', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.index);

// ── Customer Display ───────────────────────────────────────────────────────
// No auth — this is a physical display screen facing the customer.
// The displayId query parameter acts as a non-guessable session token.
router.get('/display', posController.getCustomerDisplay);
router.get('/api/display/:id/stream', posController.streamDisplay);
router.get('/api/display/:id', posController.getDisplayState);
router.post('/api/display/:id/cart', passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff'), posController.updateDisplayCart);

// ── Stripe Checkout success / cancel redirects ─────────────────────────────
// Called from the customer's browser after payment — no auth required.
router.get('/checkout/success', posController.checkoutSuccess);
router.get('/checkout/cancel', posController.checkoutCancel);

// ── Clerk API routes ───────────────────────────────────────────────────────
const staffAuth = [passportConfig.isAuthenticated, requireRole('admin', 'manager', 'staff')];
const managerAuth = [passportConfig.isAuthenticated, requireRole('admin', 'manager')];

router.get('/api/csrf', passportConfig.isAuthenticated, posController.getCsrf);
router.get('/api/catalog', ...staffAuth, posController.getCatalog);
router.get('/api/settings', ...staffAuth, posController.getSettings);
router.get('/api/bundles', ...staffAuth, posController.getCustomBoxConfigs);
router.post('/api/orders', ...staffAuth, posController.createOrder);
router.post('/api/orders/:id/complete', ...staffAuth, posController.completeOrder);
router.get('/api/orders/pending', ...staffAuth, posController.getPendingQueue);
router.get('/api/orders/:id/status', ...staffAuth, posController.getOrderStatus);
router.post('/api/orders/:id/fill', ...staffAuth, posController.fillOrder);
router.post('/api/orders/:id/deliver', ...staffAuth, posController.deliverOrder);
router.post('/api/orders/:id/cancel', ...managerAuth, posController.cancelOrder);
router.post('/api/orders/:id/refund', ...managerAuth, posController.refundOrder);
router.post('/api/stripe/payment-intent', ...staffAuth, posController.createPaymentIntent);
router.post('/api/stripe/confirm', ...staffAuth, posController.confirmStripePayment);
router.post('/api/stripe/checkout-session', ...staffAuth, posController.createCheckoutSession);

module.exports = {
  basePath: '/pos',
  router,
};
