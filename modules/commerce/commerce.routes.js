const express = require('express');
const controller = require('./commerce.controller');

const router = express.Router();

// ─── Public Pages (no auth required) ──────────────────────────────────────────
router.get('/', controller.index);
router.get('/order', controller.orderPage);
router.get('/confirmation', controller.confirmation);

// ─── API (CSRF-protected, no auth) ───────────────────────────────────────────
router.post('/api/order', controller.createOrder);

// ─── Stripe Webhook (no CSRF, no auth, raw body) ─────────────────────────────
// CSRF is explicitly skipped for this route in app.js.
// Raw body is preserved via the express.json verify callback in app.js.
router.post('/webhook/stripe', controller.stripeWebhook);

module.exports = {
  basePath: '/shop',
  router,
};
