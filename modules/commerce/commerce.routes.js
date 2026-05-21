const express = require('express');
const path = require('path');
const controller = require('./commerce.controller');

const router = express.Router();

// ─── Static assets for the React bundle ───────────────────────────────────────
router.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: 31557600000 }));

// Prevent browser from caching dynamic storefront pages (live inventory data)
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ─── Public Pages → serve React shell ─────────────────────────────────────────
router.get('/', controller.serveShell);
router.get('/pickup', controller.serveShell);
router.get('/bundles', controller.serveShell);
router.get('/about', controller.serveShell);
router.get('/contact', controller.serveShell);
router.get('/confirmation', controller.serveShell);
router.get('/order-lookup', controller.serveShell);

// ─── Data API (CSRF-protected, no auth) ───────────────────────────────────────
router.get('/api/storefront', controller.apiStorefront);
router.get('/api/pickup', controller.apiPickup);
router.get('/api/bundles', controller.apiCustomBoxes);
router.get('/api/order-status', controller.apiOrderStatus);
router.get('/api/order-lookup', controller.apiOrderLookup);
router.post('/api/contact', controller.apiContact);
router.post('/api/order', controller.createOrder);
router.post('/api/bundle-order', controller.createCustomBoxOrder);

// ─── Stripe Webhook (no CSRF, no auth, raw body) ─────────────────────────────
// CSRF is explicitly skipped for this route in app.js.
// Raw body is preserved via the express.json verify callback in app.js.
router.post('/webhook/stripe', controller.stripeWebhook);

module.exports = {
  basePath: '/shop',
  router,
};
