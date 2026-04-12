const path = require('node:path');
const validator = require('validator');
const commerceService = require('./commerce.service');
const nodemailerConfig = require('../../config/nodemailer');
const orderService = require('../../shared/order.service');

/**
 * GET /shop — Public storefront homepage.
 * Displays available products with real inventory counts.
 */
async function index(req, res, next) {
  try {
    const products = await commerceService.getStorefrontProducts();
    res.render(path.join(__dirname, 'views/storefront'), {
      title: 'Outta Town Donuts',
      currentPage: 'home',
      products,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/pickup — Public ordering page (pickup orders).
 * Shows available products with quantity selectors.
 */
async function pickupPage(req, res, next) {
  try {
    const settings = await orderService.getSettings();
    if (!settings.preordersEnabled) {
      return res.render(path.join(__dirname, 'views/order'), {
        title: 'Pickup Orders — Outta Town Donuts',
        currentPage: 'pickup',
        products: [],
        cancelled: false,
        preordersDisabled: true,
      });
    }
    const products = await commerceService.getStorefrontProducts();
    res.render(path.join(__dirname, 'views/order'), {
      title: 'Pickup Orders — Outta Town Donuts',
      currentPage: 'pickup',
      products,
      cancelled: req.query.cancelled === 'true',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /shop/custom-boxes — Coming soon page.
 */
function customBoxes(req, res) {
  res.render(path.join(__dirname, 'views/custom-boxes'), {
    title: 'Custom Boxes — Outta Town Donuts',
    currentPage: 'custom-boxes',
  });
}

/**
 * GET /shop/about — About Us page.
 */
function about(req, res) {
  res.render(path.join(__dirname, 'views/about'), {
    title: 'About Us — Outta Town Donuts',
    currentPage: 'about',
  });
}

/**
 * GET /shop/contact — Contact form page.
 */
function getContact(req, res) {
  const unknownUser = !req.user;
  res.render(path.join(__dirname, 'views/contact'), {
    title: 'Contact — Outta Town Donuts',
    currentPage: 'contact',
    sitekey: process.env.GOOGLE_RECAPTCHA_SITE_KEY || null,
    unknownUser,
  });
}

/**
 * POST /shop/contact — Handle contact form submission.
 */
async function postContact(req, res, next) {
  const validationErrors = [];
  let fromName;
  let fromEmail;

  if (!req.user) {
    if (validator.isEmpty(req.body.name || '')) validationErrors.push({ msg: 'Please enter your name' });
    if (!validator.isEmail(req.body.email || '')) validationErrors.push({ msg: 'Please enter a valid email address.' });
  }
  if (validator.isEmpty(req.body.message || '')) validationErrors.push({ msg: 'Please enter your message.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/shop/contact');
  }

  if (req.user) {
    fromName = req.user.profile.name || 'No name supplied';
    fromEmail = req.user.email;
  } else {
    fromName = validator.escape(req.body.name);
    fromEmail = req.body.email;
  }

  try {
    const mailOptions = {
      to: process.env.SITE_CONTACT_EMAIL,
      from: `${fromName} <${fromEmail}>`,
      subject: `[Outta Town Donuts] Contact from ${fromName}`,
      text: req.body.message,
    };

    await nodemailerConfig.sendMail({
      successfulType: 'success',
      successfulMsg: 'Your message has been sent. Thank you!',
      loggingError: 'ERROR: Could not send commerce contact email after security downgrade.\n',
      errorType: 'errors',
      errorMsg: 'There was a problem sending your message. Please try again later.',
      mailOptions,
      req,
    });
  } catch (err) {
    console.error('[Commerce] Contact email error:', err.message);
  }
  return res.redirect('/shop/contact');
}

/**
 * POST /shop/api/order — Create a pending online order.
 * Expects JSON: { items: [{ refId, quantity }], idempotencyKey? }
 */
async function createOrder(req, res, next) {
  try {
    const { items, idempotencyKey, pickupName } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    if (!pickupName || !pickupName.trim()) {
      return res.status(400).json({ error: 'Please enter a name for pickup' });
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
      currentPage: 'pickup',
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
  pickupPage,
  customBoxes,
  about,
  getContact,
  postContact,
  createOrder,
  confirmation,
  stripeWebhook,
};
