const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const validator = require('validator');
const commerceService = require('./commerce.service');
const orderService = require('../../shared/order.service');
const ContactMessage = require('../../models/ContactMessage');

// ─── React Shell ──────────────────────────────────────────────────────────────

const SHELL_PATH = path.join(__dirname, 'public', 'index.html');
let _shellCache = null;

async function _getShell() {
  if (!_shellCache || process.env.NODE_ENV !== 'production') {
    _shellCache = await fs.promises.readFile(SHELL_PATH, 'utf8');
  }
  return _shellCache;
}

/**
 * Serve the React shell HTML with server-injected meta tags.
 * Used by all commerce page routes.
 */
async function serveShell(req, res, next) {
  try {
    const html = await _getShell();
    const csrf = res.locals._csrf || '';

    const tags = [
      `<meta name="csrf-token" content="${validator.escape(String(csrf))}">`,
      process.env.FACEBOOK_ID ? `<meta property="fb:app_id" content="${validator.escape(String(process.env.FACEBOOK_ID))}">` : '',
      process.env.GOOGLE_ANALYTICS_ID ? `<meta name="ga-id" content="${validator.escape(String(process.env.GOOGLE_ANALYTICS_ID))}">` : '',
      process.env.GOOGLE_RECAPTCHA_SITE_KEY ? `<meta name="recaptcha-sitekey" content="${validator.escape(String(process.env.GOOGLE_RECAPTCHA_SITE_KEY))}">` : '',
      req.user ? `<meta name="is-known-user" content="true">` : '',
    ]
      .filter(Boolean)
      .join('\n    ');

    const injected = html.replace('</head>', `    ${tags}\n  </head>`);
    res.type('html').send(injected);
  } catch (err) {
    next(err);
  }
}

// ─── Data API endpoints ───────────────────────────────────────────────────────

/**
 * GET /shop/api/storefront — Products for the homepage.
 */
async function apiStorefront(req, res, next) {
  try {
    const products = await commerceService.getStorefrontProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/api/pickup — Products + ordering status for the pickup page.
 */
async function apiPickup(req, res, next) {
  try {
    const settings = await orderService.getSettings();
    if (!settings.preordersEnabled) {
      return res.json({ products: [], preordersEnabled: false });
    }
    const products = await commerceService.getStorefrontProducts();
    res.json({ products, preordersEnabled: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/api/custom-boxes — Box configs + products for the custom boxes page.
 */
async function apiCustomBoxes(req, res, next) {
  try {
    const [boxConfigs, products, settings] = await Promise.all([commerceService.getActiveCustomBoxConfigs(), commerceService.getStorefrontProducts(), orderService.getSettings()]);
    res.json({
      boxConfigs: boxConfigs.map((c) => c.toObject()),
      products,
      preordersEnabled: settings.preordersEnabled !== false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/api/order-status — Order detail for the confirmation page.
 * Reconciles with Stripe if session_id is provided and order is still pending.
 */
async function apiOrderStatus(req, res, next) {
  try {
    const { orderId, session_id: sessionId } = req.query;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }
    const order = await commerceService.reconcileOrder(orderId, sessionId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order: order.toObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /shop/api/contact — Contact form submission (returns JSON).
 */
async function apiContact(req, res, next) {
  const validationErrors = [];
  let fromName;
  let fromEmail;

  if (!req.user) {
    if (validator.isEmpty(req.body.name || '')) {
      validationErrors.push({ msg: 'Please enter your name' });
    }
    if (!validator.isEmail(req.body.email || '')) {
      validationErrors.push({ msg: 'Please enter a valid email address.' });
    }
  }
  if (validator.isEmpty(req.body.message || '')) {
    validationErrors.push({ msg: 'Please enter your message.' });
  }

  if (validationErrors.length) {
    return res.status(400).json({ errors: validationErrors });
  }

  if (req.user) {
    fromName = req.user.profile.name || 'No name supplied';
    fromEmail = req.user.email;
  } else {
    fromName = validator.escape(String(req.body.name).trim());
    fromEmail = req.body.email;
  }

  try {
    // Save to database first (non-blocking failure is OK)
    ContactMessage.create({ name: fromName, email: fromEmail, message: String(req.body.message) }).catch((err) => console.error('[Commerce] Contact save error:', err.message));

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    await transporter.sendMail({
      to: process.env.SITE_CONTACT_EMAIL,
      from: `Outta Town Donuts <${process.env.TRANSACTION_EMAIL || process.env.SITE_CONTACT_EMAIL}>`,
      replyTo: `${fromName} <${fromEmail}>`,
      subject: `[Outta Town Donuts] Contact from ${fromName}`,
      text: String(req.body.message),
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Commerce] Contact email error:', err.message);
    return res.status(500).json({
      errors: [{ msg: 'There was a problem sending your message. Please try again later.' }],
    });
  }
}

/**
 * POST /shop/api/order — Create a pending online order.
 * Expects JSON: { items: [{ refId, quantity }], idempotencyKey? }
 */
async function createOrder(req, res, next) {
  try {
    const { items, idempotencyKey, pickupName, customerEmail } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    if (!pickupName || !pickupName.trim()) {
      return res.status(400).json({ error: 'Please enter a name for pickup' });
    }

    // Validate email if provided (optional)
    let sanitizedEmail;
    if (customerEmail && customerEmail.trim()) {
      if (!validator.isEmail(String(customerEmail).trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
      sanitizedEmail = String(customerEmail).trim().toLowerCase().slice(0, 254);
    }

    // Sanitize: only allow refId and positive integer quantity
    const sanitized = items.map((item) => ({
      refId: String(item.refId),
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 0)),
    }));

    const order = await commerceService.createOnlineOrder({
      items: sanitized,
      idempotencyKey,
      pickupName: validator.escape(String(pickupName).trim()),
      customerEmail: sanitizedEmail,
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

/**
 * POST /shop/api/custom-box-order — Create a pending custom box order.
 * Expects JSON: { boxConfigId, selections: [{ refId, quantity }], pickupName, idempotencyKey? }
 */
async function createCustomBoxOrder(req, res, next) {
  try {
    const { boxConfigId, selections, pickupName, idempotencyKey, customerEmail } = req.body;

    if (!boxConfigId) {
      return res.status(400).json({ error: 'boxConfigId is required' });
    }
    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ error: 'selections must be a non-empty array' });
    }
    if (!pickupName || !String(pickupName).trim()) {
      return res.status(400).json({ error: 'Please enter a name for pickup' });
    }

    // Validate email if provided (optional)
    let sanitizedEmail;
    if (customerEmail && customerEmail.trim()) {
      if (!validator.isEmail(String(customerEmail).trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
      sanitizedEmail = String(customerEmail).trim().toLowerCase().slice(0, 254);
    }

    const sanitizedSelections = selections.map((s) => ({
      refId: String(s.refId),
      quantity: Math.max(1, Math.floor(Number(s.quantity) || 0)),
    }));

    const order = await commerceService.createCustomBoxOrder({
      boxConfigId: String(boxConfigId),
      selections: sanitizedSelections,
      pickupName: validator.escape(String(pickupName).trim()),
      idempotencyKey,
      customerEmail: sanitizedEmail,
    });

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
 * GET /shop/api/order-lookup — Look up an order by confirmation number.
 * Returns limited order info (no internal IDs exposed beyond confirmation number).
 */
async function apiOrderLookup(req, res, next) {
  try {
    const { confirmationNumber } = req.query;
    if (!confirmationNumber || typeof confirmationNumber !== 'string') {
      return res.status(400).json({ error: 'confirmationNumber is required' });
    }
    const order = await commerceService.getOrderByConfirmationNumber(confirmationNumber.toUpperCase().trim());
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const obj = order.toObject();
    res.json({
      order: {
        confirmationNumber: obj.confirmationNumber,
        status: obj.status,
        paymentStatus: obj.paymentStatus,
        pickupName: obj.pickupName,
        items: obj.items,
        subtotal: obj.subtotal,
        tax: obj.tax,
        total: obj.total,
        createdAt: obj.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  serveShell,
  apiStorefront,
  apiPickup,
  apiCustomBoxes,
  apiOrderStatus,
  apiOrderLookup,
  apiContact,
  createOrder,
  createCustomBoxOrder,
  stripeWebhook,
};
