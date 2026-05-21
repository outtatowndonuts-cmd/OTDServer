const express = require('express');
const path = require('path');
const passportConfig = require('../../config/passport');
const { requireRole } = require('../../shared/requireRole');
const controller = require('./special-orders.controller');

const router = express.Router();

// ─── Static Assets (React bundle) ─────────────────────────────────────────────
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));
router.use('/css', express.static(path.join(__dirname, 'public', 'css')));
router.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// No-cache for dynamic pages
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ─── Stripe Webhook (must come before CSRF — exempt in app.js) ────────────────
router.post('/webhook/stripe', controller.stripeWebhook);

// ─── Customer Pages → React Shell ────────────────────────────────────────────
router.get('/', controller.serveShell);
router.get('/confirmation', controller.serveShell);
router.get('/order-lookup', controller.serveShell);

// ─── Customer API (public, CSRF-protected via lusca) ─────────────────────────
router.get('/api/csrf', controller.apiGetCsrf);
router.get('/api/config', controller.apiGetConfig);
router.get('/api/address-autocomplete', controller.apiAddressAutocomplete);
router.post('/api/verify-address', controller.apiVerifyAddress);
router.post('/api/estimate-price', controller.apiEstimatePrice);
router.post('/api/order', controller.apiCreateOrder);
router.get('/api/order-status', controller.apiOrderStatus);
router.get('/api/order-lookup', controller.apiOrderLookup);

// ─── Admin Section ────────────────────────────────────────────────────────────
const adminAuth = [passportConfig.isAuthenticated, requireRole('admin', 'manager')];

router.get('/admin', ...adminAuth, controller.adminShell);
router.get('/admin/fragments/config', ...adminAuth, controller.fragmentConfig);
router.get('/admin/fragments/orders', ...adminAuth, controller.fragmentOrders);
router.get('/admin/fragments/orders/:id', ...adminAuth, controller.fragmentOrderDetail);
router.post('/admin/config', ...adminAuth, controller.adminUpdateConfig);
router.post('/admin/options', ...adminAuth, controller.adminAddOption);
router.post('/admin/option-toggle-filled', ...adminAuth, controller.adminToggleFilled);
router.delete('/admin/options/:type/:optionId', ...adminAuth, controller.adminRemoveOption);
router.post('/admin/orders/:id/confirm', ...adminAuth, controller.adminConfirmOrder);
router.post('/admin/orders/:id/cancel', ...adminAuth, controller.adminCancelOrder);

// ─── Driver Dashboard ─────────────────────────────────────────────────────────
const driverAuth = [passportConfig.isAuthenticated, requireRole('admin', 'manager')];

router.get('/driver', ...driverAuth, controller.driverShell);
router.get('/driver/api/deliveries', ...driverAuth, controller.apiDriverDeliveries);
router.post('/driver/orders/:id/filling', ...driverAuth, controller.driverMarkFilling);
router.post('/driver/orders/:id/out-for-delivery', ...driverAuth, controller.driverMarkOutForDelivery);
router.post('/driver/orders/:id/delivered', ...driverAuth, controller.driverMarkDelivered);

module.exports = {
  basePath: '/special-orders',
  router,
};
