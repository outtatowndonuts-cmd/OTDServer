const path = require('node:path');
const commerceService = require('./commerce.service');

/**
 * GET /shop — Public storefront homepage.
 * Displays available products with real inventory counts.
 */
async function index(req, res, next) {
  try {
    const products = await commerceService.getStorefrontProducts();
    res.render(path.join(__dirname, 'views/storefront'), {
      title: 'Outta Town Donuts',
      products,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/order — Public ordering page.
 * Shows available products with quantity selectors.
 */
async function orderPage(req, res, next) {
  try {
    const products = await commerceService.getStorefrontProducts();
    res.render(path.join(__dirname, 'views/order'), {
      title: 'Order — Outta Town Donuts',
      products,
      cancelled: req.query.cancelled === 'true',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /shop/api/order — Create a pending online order.
 * Expects JSON: { items: [{ refId, quantity }], idempotencyKey? }
 */
async function createOrder(req, res, next) {
  try {
    const { items, idempotencyKey } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Sanitize: only allow refId and positive integer quantity
    const sanitized = items.map((item) => ({
      refId: String(item.refId),
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 0)),
    }));

    const order = await commerceService.createOnlineOrder({
      items: sanitized,
      idempotencyKey,
    });

    // Create Stripe Checkout Session
    const session = await commerceService.createCheckoutSession(order);

    return res.json({ orderId: order._id, checkoutUrl: session.url });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ error: err.message, shortages: err.shortages });
    }
    next(err);
  }
}

/**
 * GET /shop/confirmation — Order confirmation / status page.
 * Handles reconciliation if webhook hasn't fired yet.
 */
async function confirmation(req, res, next) {
  try {
    const { orderId, session_id: sessionId } = req.query;
    if (!orderId) {
      return res.redirect('/shop');
    }

    // Reconcile: verify with Stripe if order is still pending
    const order = await commerceService.reconcileOrder(orderId, sessionId);
    if (!order) {
      return res.redirect('/shop');
    }

    res.render(path.join(__dirname, 'views/confirmation'), {
      title: 'Order Confirmation — Outta Town Donuts',
      order: order.toObject(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /shop/webhook/stripe — Stripe webhook handler.
 * Uses raw body (not JSON-parsed) for signature verification.
 * No CSRF, no session — server-to-server only.
 */
async function stripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    await commerceService.handleStripeWebhook(req.rawBody, signature);
    return res.json({ received: true });
  } catch (err) {
    console.error('[Commerce] Webhook error:', err.message);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }
}

module.exports = {
  index,
  orderPage,
  createOrder,
  confirmation,
  stripeWebhook,
};
