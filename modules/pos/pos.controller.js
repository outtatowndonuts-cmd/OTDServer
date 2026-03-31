const path = require('path');
const fs = require('fs');
const posService = require('./pos.service');

// Cache the HTML template in memory (the base HTML without dynamic values)
let htmlTemplate = null;
function getHtml() {
  if (!htmlTemplate || process.env.NODE_ENV !== 'production') {
    htmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  }
  return htmlTemplate;
}

/**
 * GET /pos
 * Serve the React SPA shell with Stripe key + CSRF injected.
 */
exports.index = (req, res) => {
  let html = getHtml();
  const stripePkey = process.env.STRIPE_PKEY || '';
  const csrf = res.locals._csrf || '';
  // Inject meta tags before </head>
  const meta = `<meta name="stripe-pkey" content="${stripePkey}"><meta name="csrf-token" content="${csrf}">`;
  html = html.replace('</head>', `${meta}\n</head>`);
  res.type('html').send(html);
};

/**
 * GET /pos/api/csrf
 * Return the CSRF token so the React app can include it in POST requests.
 */
exports.getCsrf = (req, res) => {
  res.json({ csrfToken: res.locals._csrf });
};

/**
 * GET /pos/api/catalog
 * Return products for the POS grid.
 */
exports.getCatalog = async (req, res) => {
  try {
    const products = await posService.getCatalog();
    res.json({ ok: true, products });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /pos/api/settings
 * Return tax rate and defaults.
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await posService.getSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders
 * Create a sale order from POS.
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, subtotal, tax, total, paymentMethod } = req.body;
    const order = await posService.createSaleOrder({ items, subtotal, tax, total, paymentMethod });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders/:id/complete
 * Complete (finalize) an order.
 */
exports.completeOrder = async (req, res) => {
  try {
    const order = await posService.completeOrder(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/stripe/payment-intent
 * Create a Stripe Payment Intent for card payments.
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amountCents, orderId } = req.body;
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ ok: false, error: 'Amount must be at least $0.50' });
    }
    const paymentIntent = await posService.createPaymentIntent(amountCents, orderId);
    res.json({ ok: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/stripe/confirm
 * Verify payment with Stripe, then mark order as paid.
 */
exports.confirmStripePayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ ok: false, error: 'Missing paymentIntentId' });
    }
    // Verify with Stripe that the payment actually succeeded
    const verified = await posService.verifyPaymentIntent(paymentIntentId);
    if (!verified) {
      return res.status(400).json({ ok: false, error: 'Payment not confirmed by Stripe' });
    }
    const order = await posService.markOrderPaid(orderId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    const completed = await posService.completeOrder(orderId);
    res.json({ ok: true, order: completed });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
