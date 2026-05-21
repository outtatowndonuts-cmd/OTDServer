const fs = require('node:fs');
const path = require('node:path');
const validator = require('validator');
const service = require('./special-orders.service');
const recipesService = require('../recipes/recipes.service');

const VIEWS = path.join(__dirname, 'views');

function csrf(req) {
  return req.csrfToken ? req.csrfToken() : '';
}

function frag(res, view, data, _csrf) {
  res.render(path.join(VIEWS, view), Object.assign({}, data, { layout: false, _csrf }));
}

// ─── Customer React Shell ─────────────────────────────────────────────────────

const SHELL_PATH = path.join(__dirname, 'public', 'index.html');
let _shellCache = null;

async function _getShell() {
  if (!_shellCache || process.env.NODE_ENV !== 'production') {
    _shellCache = await fs.promises.readFile(SHELL_PATH, 'utf8');
  }
  return _shellCache;
}

async function serveShell(req, res, next) {
  try {
    const html = await _getShell();
    const csrfToken = res.locals._csrf || '';
    const stripePkey = process.env.STRIPE_PKEY || '';
    const tags = [`<meta name="csrf-token" content="${validator.escape(String(csrfToken))}">`, stripePkey ? `<meta name="stripe-pkey" content="${validator.escape(stripePkey)}">` : ''].filter(Boolean).join('\n    ');

    const injected = html.replace('</head>', `    ${tags}\n  </head>`);
    res.type('html').send(injected);
  } catch (err) {
    next(err);
  }
}

// ─── Customer API ─────────────────────────────────────────────────────────────

async function apiGetCsrf(req, res) {
  res.json({ csrfToken: res.locals._csrf || '' });
}

async function apiGetConfig(req, res, next) {
  try {
    const config = await service.getPublicConfig();
    res.json({ ok: true, config });
  } catch (err) {
    next(err);
  }
}

async function apiVerifyAddress(req, res, next) {
  try {
    const { address, fulfillmentType } = req.body;
    if (!address || !fulfillmentType) {
      return res.status(400).json({ ok: false, error: 'address and fulfillmentType are required' });
    }
    const result = await service.verifyDeliveryAddress(address, fulfillmentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function apiAddressAutocomplete(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 4) return res.json({ ok: true, results: [] });
    const results = await service.addressAutocomplete(q);
    res.json({ ok: true, results });
  } catch (err) {
    next(err);
  }
}

async function apiEstimatePrice(req, res, next) {
  try {
    const { fulfillmentType, deliveryAddress, variations } = req.body;
    if (!fulfillmentType || !variations?.length) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    const estimate = await service.estimateOrderPrice({ fulfillmentType, deliveryAddress, variations });
    res.json({ ok: true, estimate });
  } catch (err) {
    next(err);
  }
}

async function apiCreateOrder(req, res, next) {
  try {
    const { customerName, customerEmail, customerPhone, fulfillmentType, scheduledDate, deliveryAddress, totalQuantity, variations } = req.body;

    if (!customerName || !fulfillmentType || !scheduledDate || !totalQuantity || !variations?.length) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Email is optional — if provided it must be valid (Stripe rejects malformed addresses)
    const sanitizedEmail = customerEmail && typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim() : null;
    if (sanitizedEmail && !validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address' });
    }

    const isDelivery = ['in-city', 'outside-city', 'outside-county'].includes(fulfillmentType);
    if (isDelivery && (!deliveryAddress?.street || !deliveryAddress?.city)) {
      return res.status(400).json({ ok: false, error: 'Delivery address is required for delivery orders' });
    }

    const result = await service.createSpecialOrder({
      customerName,
      customerEmail: sanitizedEmail,
      customerPhone,
      fulfillmentType,
      scheduledDate,
      deliveryAddress,
      totalQuantity,
      variations,
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function apiOrderStatus(req, res, next) {
  try {
    const { orderId, session_id: sessionId } = req.query;
    if (!orderId) return res.status(400).json({ ok: false, error: 'orderId is required' });
    const order = await service.getOrderStatus(orderId, sessionId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

async function apiOrderLookup(req, res, next) {
  try {
    const { confirmationNumber } = req.query;
    if (!confirmationNumber) {
      return res.status(400).json({ ok: false, error: 'confirmationNumber is required' });
    }
    const order = await service.getOrderByConfirmation(confirmationNumber.trim().toUpperCase());
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

async function stripeWebhook(req, res, next) {
  try {
    const sig = req.headers['stripe-signature'];
    await service.handleStripeWebhook(req.rawBody, sig);
    res.json({ received: true });
  } catch (err) {
    console.error('[SpecialOrders] Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

async function adminShell(req, res, next) {
  try {
    res.render(path.join(VIEWS, 'admin/dashboard.pug'), {
      title: 'Special Orders — Admin',
      _csrf: csrf(req),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Fragments ──────────────────────────────────────────────────────────

async function fragmentConfig(req, res, next) {
  try {
    const [config, allRecipes, allIngredients] = await Promise.all([service.getConfig(), recipesService.getRecipes(), recipesService.getIngredients()]);
    const recipes = allRecipes.map((r) => ({ _id: String(r._id), name: r.name }));
    const ingredients = allIngredients.map((i) => ({ _id: String(i._id), name: i.name }));
    frag(res, 'admin/config.pug', { config, recipes, ingredients }, csrf(req));
  } catch (err) {
    next(err);
  }
}

async function fragmentOrders(req, res, next) {
  try {
    const orders = await service.getOrders(req.query);
    frag(res, 'admin/orders-list.pug', { orders }, csrf(req));
  } catch (err) {
    next(err);
  }
}

async function fragmentOrderDetail(req, res, next) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).send('Order not found');
    frag(res, 'admin/order-detail.pug', { order }, csrf(req));
  } catch (err) {
    next(err);
  }
}

// ─── Admin Mutations ──────────────────────────────────────────────────────────

async function adminUpdateConfig(req, res, next) {
  try {
    const config = await service.updateConfig(req.body);
    res.json({ ok: true, config });
  } catch (err) {
    next(err);
  }
}

async function adminAddOption(req, res, next) {
  try {
    const { type, refId, name, price, isFilled } = req.body;
    if (!type || !name || price === undefined) {
      return res.status(400).json({ ok: false, error: 'type, name, and price are required' });
    }
    const config = await service.addOption(type, { refId, name, price, isFilled });
    res.json({ ok: true, config });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function adminToggleFilled(req, res, next) {
  try {
    const { type, optionId, isFilled } = req.body;
    if (!type || !optionId) {
      return res.status(400).json({ ok: false, error: 'type and optionId are required' });
    }
    const config = await service.setOptionFilled(type, optionId, Boolean(isFilled));
    res.json({ ok: true, config });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function adminRemoveOption(req, res, next) {
  try {
    const { type, optionId } = req.params;
    const config = await service.removeOption(type, optionId);
    res.json({ ok: true, config });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function adminConfirmOrder(req, res, next) {
  try {
    const order = await service.confirmOrder(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function adminCancelOrder(req, res, next) {
  try {
    const { reason } = req.body;
    const order = await service.cancelOrder(req.params.id, {
      reason,
      cancelledBy: req.user._id,
    });
    res.json({ ok: true, order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

// ─── Driver Dashboard ─────────────────────────────────────────────────────────

async function driverShell(req, res, next) {
  try {
    res.render(path.join(VIEWS, 'driver/dashboard.pug'), {
      title: 'Special Orders — Driver',
      _csrf: csrf(req),
    });
  } catch (err) {
    next(err);
  }
}

async function apiDriverDeliveries(req, res, next) {
  try {
    const orders = await service.getTodayDeliveries();
    const storeLat = parseFloat(process.env.STORE_LAT);
    const storeLng = parseFloat(process.env.STORE_LNG);
    const sorted = storeLat && storeLng ? service.sortByProximity(orders, storeLat, storeLng) : orders;
    res.json({ ok: true, orders: sorted });
  } catch (err) {
    next(err);
  }
}

async function driverMarkFilling(req, res, next) {
  try {
    const order = await service.markFilling(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function driverMarkOutForDelivery(req, res, next) {
  try {
    const order = await service.markOutForDelivery(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

async function driverMarkDelivered(req, res, next) {
  try {
    const order = await service.markDelivered(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
}

module.exports = {
  serveShell,
  apiGetCsrf,
  apiGetConfig,
  apiVerifyAddress,
  apiAddressAutocomplete,
  apiEstimatePrice,
  apiCreateOrder,
  apiOrderStatus,
  apiOrderLookup,
  stripeWebhook,
  adminShell,
  fragmentConfig,
  fragmentOrders,
  fragmentOrderDetail,
  adminUpdateConfig,
  adminAddOption,
  adminToggleFilled,
  adminRemoveOption,
  adminConfirmOrder,
  adminCancelOrder,
  driverShell,
  apiDriverDeliveries,
  driverMarkFilling,
  driverMarkOutForDelivery,
  driverMarkDelivered,
};
