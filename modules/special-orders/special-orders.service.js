const https = require('node:https');
const nodemailer = require('nodemailer');
const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const { SpecialOrder, SpecialOrderConfig } = require('./special-orders.model');
const { CustomBoxConfig } = require('../commerce/custom-box.model');
const orderService = require('../../shared/order.service');

// In-memory cache for store geocode result (cleared when storeAddress changes)
let _storeGeoCache = null;

// ─── Config (singleton) ───────────────────────────────────────────────────────

async function getConfig() {
  let config = await SpecialOrderConfig.findOne();
  if (!config) {
    config = await SpecialOrderConfig.create({});
  }
  return config;
}

async function updateConfig(data) {
  const allowed = ['inCityDeliveryFee', 'outsideCityFlatFee', 'perMileRate', 'storeAddress', 'orderCutoffHour', 'assortedDonutBasePrice'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (data.storeHours !== undefined) {
    const hours = typeof data.storeHours === 'string' ? JSON.parse(data.storeHours) : data.storeHours;
    if (Array.isArray(hours)) update.storeHours = hours;
  }
  // Clear geocode cache when store address changes
  if (data.storeAddress !== undefined) _storeGeoCache = null;
  return SpecialOrderConfig.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
}

async function addOption(type, { refId, name, price, isFilled }) {
  const fieldMap = {
    baseRecipe: { field: 'availableBaseRecipes', idField: 'recipeId' },
    frosting: { field: 'availableFrostings', idField: 'recipeId' },
    topping: { field: 'availableToppings', idField: 'ingredientId' },
    filling: { field: 'availableFillings', idField: 'ingredientId' },
  };
  const mapping = fieldMap[type];
  if (!mapping) {
    const err = new Error(`Unknown option type: ${type}`);
    err.status = 400;
    throw err;
  }
  const entry = { name: String(name).trim(), price: Number(price) || 0, isActive: true };
  if (refId) entry[mapping.idField] = refId;
  if (type === 'baseRecipe') entry.isFilled = Boolean(isFilled);
  return SpecialOrderConfig.findOneAndUpdate({}, { $push: { [mapping.field]: entry } }, { upsert: true, new: true });
}

async function removeOption(type, optionId) {
  const fieldMap = {
    baseRecipe: 'availableBaseRecipes',
    frosting: 'availableFrostings',
    topping: 'availableToppings',
    filling: 'availableFillings',
  };
  const field = fieldMap[type];
  if (!field) {
    const err = new Error(`Unknown option type: ${type}`);
    err.status = 400;
    throw err;
  }
  return SpecialOrderConfig.findOneAndUpdate({}, { $pull: { [field]: { _id: optionId } } }, { new: true });
}

async function setOptionFilled(type, optionId, isFilled) {
  // Only base recipes have an isFilled flag
  if (type !== 'baseRecipe') {
    const err = new Error('isFilled is only applicable to base recipes');
    err.status = 400;
    throw err;
  }
  return SpecialOrderConfig.findOneAndUpdate({ 'availableBaseRecipes._id': optionId }, { $set: { 'availableBaseRecipes.$.isFilled': Boolean(isFilled) } }, { new: true });
}

// ─── Admin Order Management ───────────────────────────────────────────────────

async function getOrders(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.fulfillmentType) query.fulfillmentType = filters.fulfillmentType;
  if (filters.dateFrom || filters.dateTo) {
    query.scheduledDate = {};
    if (filters.dateFrom) query.scheduledDate.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.scheduledDate.$lte = new Date(filters.dateTo);
  }
  return SpecialOrder.find(query).sort({ scheduledDate: 1, createdAt: 1 }).lean();
}

async function getOrderById(id) {
  return SpecialOrder.findById(id).lean();
}

async function confirmOrder(id) {
  const order = await SpecialOrder.findOneAndUpdate({ _id: id, status: 'pending' }, { status: 'confirmed' }, { new: true });
  if (!order) {
    const err = new Error('Order not found or not in pending state');
    err.status = 404;
    throw err;
  }
  return order;
}

async function cancelOrder(id, { reason, cancelledBy } = {}) {
  const order = await SpecialOrder.findOneAndUpdate(
    { _id: id, status: { $nin: ['delivered', 'cancelled'] } },
    {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason || '',
      cancelledBy: cancelledBy || null,
    },
    { new: true },
  );
  if (!order) {
    const err = new Error('Order not found or cannot be cancelled');
    err.status = 404;
    throw err;
  }
  return order;
}

// ─── Customer: Public Config ──────────────────────────────────────────────────

async function getPublicConfig() {
  const config = await getConfig();
  return {
    availableBaseRecipes: config.availableBaseRecipes.filter((o) => o.isActive),
    availableFrostings: config.availableFrostings.filter((o) => o.isActive),
    availableToppings: config.availableToppings.filter((o) => o.isActive),
    availableFillings: config.availableFillings.filter((o) => o.isActive),
    inCityDeliveryFee: config.inCityDeliveryFee,
    outsideCityFlatFee: config.outsideCityFlatFee,
    perMileRate: config.perMileRate,
    orderCutoffHour: config.orderCutoffHour,
    storeHours: config.storeHours || [],
    assortedDonutBasePrice: config.assortedDonutBasePrice || 0,
  };
}

// ─── Bundle Discount (mirrors POS applyAutoBundles) ───────────────────────────
// Returns the total dollar discount for a set of variations given active box
// configs.  Higher-quantity bundles are applied greedily first (largest-tier
// first), then smaller tiers absorb any remainder — identical to the POS logic.
function _computeBundleDiscount(variations, boxConfigs) {
  const activeConfigs = (boxConfigs || []).filter((c) => c.isActive && c.discountPct > 0).sort((a, b) => b.size - a.size);

  if (!activeConfigs.length) return 0;

  // Expand every variation into individual units sorted by unit price desc
  const units = [];
  for (const v of variations) {
    const unitPrice = (v.baseRecipe?.price || 0) + (v.frosting?.price || 0) + (v.filling?.price || 0) + (v.toppings || []).reduce((s, t) => s + (t.price || 0), 0);
    for (let i = 0; i < v.quantity; i += 1) {
      units.push({ price: unitPrice, discountPct: 0 });
    }
  }
  units.sort((a, b) => b.price - a.price);

  // Greedy multi-tier pass
  let offset = 0;
  let remaining = units.length;
  for (const cfg of activeConfigs) {
    if (remaining < cfg.size) continue;
    const numBundles = Math.floor(remaining / cfg.size);
    const bundledCount = numBundles * cfg.size;
    for (let i = offset; i < offset + bundledCount; i += 1) {
      units[i].discountPct = cfg.discountPct;
    }
    offset += bundledCount;
    remaining -= bundledCount;
    if (remaining === 0) break;
  }

  let discount = 0;
  for (const u of units) {
    if (u.discountPct > 0) discount += u.price * (u.discountPct / 100);
  }
  return Math.round(discount * 100) / 100;
}

// ─── Customer: Order Window Validation ───────────────────────────────────────

function validateOrderWindow(scheduledDate, cutoffHour) {
  const now = new Date();
  // Parse YYYY-MM-DD as local midnight (not UTC) to avoid timezone shift
  const parts = String(scheduledDate).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 'Invalid scheduled date';
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(target.getTime())) return 'Invalid scheduled date';

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  // Cannot order for today (orders filled the next morning)
  if (targetMidnight.getTime() === todayMidnight.getTime()) {
    return 'Orders must be placed at least 1 day in advance';
  }

  // Cannot order for a past date
  if (targetMidnight < todayMidnight) {
    return 'Scheduled date cannot be in the past';
  }

  // Ordering for tomorrow: must be before the cutoff hour today
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  if (targetMidnight.getTime() === tomorrowMidnight.getTime() && now.getHours() >= cutoffHour) {
    return `Orders for tomorrow must be placed before ${cutoffHour}:00`;
  }

  return null; // valid
}

// ─── Customer: Delivery Fee Calculation ──────────────────────────────────────

async function calculateDeliveryFee(fulfillmentType, address, config) {
  if (fulfillmentType === 'store-early' || fulfillmentType === 'store-mid') {
    return { fee: 0, distanceMiles: null };
  }
  if (fulfillmentType === 'in-city') {
    return { fee: config.inCityDeliveryFee || 0, distanceMiles: null };
  }
  if (fulfillmentType === 'outside-city') {
    return { fee: config.outsideCityFlatFee || 0, distanceMiles: null };
  }
  if (fulfillmentType === 'outside-county') {
    if (!config.storeAddress) {
      const err = new Error('Store address is not configured in Special Orders settings');
      err.status = 500;
      throw err;
    }

    // Geocode store (cached) and customer address via Nominatim
    if (!_storeGeoCache) {
      const storeResult = await _nominatimGeocode(config.storeAddress);
      _storeGeoCache = _extractLocality(storeResult);
    }
    if (!_storeGeoCache) {
      const err = new Error('Could not locate store address. Please verify store settings.');
      err.status = 500;
      throw err;
    }

    const destStr = [address.street, address.city, address.state, address.zip].filter(Boolean).join(', ');
    const destResult = await _nominatimGeocode(destStr);
    if (!destResult) {
      const err = new Error('Could not locate delivery address. Please verify your address.');
      err.status = 422;
      throw err;
    }
    const destLoc = _extractLocality(destResult);

    // Get driving distance via OSRM (public, no key required, OpenStreetMap data)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${_storeGeoCache.lng},${_storeGeoCache.lat};${destLoc.lng},${destLoc.lat}?overview=false`;

    const osrmData = await _nominatimFetch(osrmUrl);
    const routeMeters = osrmData?.routes?.[0]?.distance;
    if (!routeMeters) {
      const err = new Error('Could not calculate driving distance to delivery address. Please verify your address.');
      err.status = 422;
      throw err;
    }

    const miles = routeMeters / 1609.344;
    const fee = Math.round(miles * (config.perMileRate || 0) * 100) / 100;
    return { fee, distanceMiles: Math.round(miles * 10) / 10 };
  }

  return { fee: 0, distanceMiles: null };
}

// ─── Customer: Compute Totals (server-authoritative) ─────────────────────────

function computeTotals(variations, deliveryFee, taxRate) {
  let subtotal = 0;
  for (const v of variations) {
    const basePrice = v.baseRecipe?.price || 0;
    const frostingPrice = v.frosting?.price || 0;
    const fillingPrice = v.filling?.price || 0;
    const toppingsPrice = (v.toppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
    const unitPrice = basePrice + frostingPrice + fillingPrice + toppingsPrice;
    v.lineTotal = Math.round(unitPrice * v.quantity * 100) / 100;
    subtotal += v.lineTotal;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  const fee = Math.round((deliveryFee || 0) * 100) / 100;
  // Tax applies to food subtotal only, not delivery fee
  const tax = Math.round(subtotal * (taxRate || 0) * 100) / 100;
  const total = Math.round((subtotal + fee + tax) * 100) / 100;
  return { subtotal, deliveryFee: fee, tax, total };
}

// ─── Customer: Estimate Price (no order created) ──────────────────────────────

async function estimateOrderPrice({ fulfillmentType, deliveryAddress, variations }) {
  const config = await getConfig();
  const settings = await orderService.getSettings();

  // Build lightweight variation price objects (no DB lookup strictness needed for estimate)
  const priceVariations = (variations || []).map((v) => {
    if (v.isAssorted) return { isAssorted: true, baseRecipe: { price: config.assortedDonutBasePrice || 0 }, frosting: { price: 0 }, filling: null, toppings: [], quantity: Number(v.quantity) || 1, lineTotal: 0 };
    const base = config.availableBaseRecipes.find((o) => o._id.toString() === String(v.baseRecipeOptionId));
    const frosting = config.availableFrostings.find((o) => o._id.toString() === String(v.frostingOptionId));
    const filling = v.fillingOptionId ? config.availableFillings.find((o) => o._id.toString() === String(v.fillingOptionId)) : null;
    const toppings = (v.toppingOptionIds || [])
      .map((id) => config.availableToppings.find((o) => o._id.toString() === String(id)))
      .filter(Boolean)
      .map((t) => ({ price: t.price }));
    return {
      baseRecipe: { price: base?.price || 0 },
      frosting: { price: frosting?.price || 0 },
      filling: filling ? { price: filling.price } : null,
      toppings,
      quantity: Number(v.quantity) || 1,
      lineTotal: 0,
    };
  });

  const { fee: deliveryFee, distanceMiles } = await calculateDeliveryFee(fulfillmentType, deliveryAddress || {}, config);
  const totals = computeTotals(priceVariations, deliveryFee, settings.taxRate);

  // Apply bundle discount (same greedy algorithm as the POS auto-bundle)
  const boxConfigs = await CustomBoxConfig.find({ isActive: true }).lean();
  const bundleDiscountAmount = _computeBundleDiscount(priceVariations, boxConfigs);
  const discountedSubtotal = Math.round((totals.subtotal - bundleDiscountAmount) * 100) / 100;
  const adjustedTax = Math.round(discountedSubtotal * (settings.taxRate || 0) * 100) / 100;
  const adjustedTotal = Math.round((discountedSubtotal + deliveryFee + adjustedTax) * 100) / 100;

  return {
    subtotal: totals.subtotal,
    bundleDiscountAmount,
    deliveryFee,
    distanceMiles,
    tax: adjustedTax,
    total: adjustedTotal,
    perMileRate: config.perMileRate,
  };
}

// ─── Customer: Create Order ───────────────────────────────────────────────────

async function createSpecialOrder({ customerName, customerEmail, customerPhone, fulfillmentType, scheduledDate, deliveryAddress, totalQuantity, variations }) {
  const config = await getConfig();
  const settings = await orderService.getSettings();

  // Validate order window
  const windowError = validateOrderWindow(scheduledDate, config.orderCutoffHour);
  if (windowError) {
    const err = new Error(windowError);
    err.status = 400;
    throw err;
  }

  // Validate variation quantities sum to totalQuantity
  const variationQtySum = variations.reduce((s, v) => s + Number(v.quantity || 0), 0);
  if (variationQtySum !== Number(totalQuantity)) {
    const err = new Error('Variation quantities must sum to the total order quantity');
    err.status = 400;
    throw err;
  }

  // Build server-authoritative variations (prices from config, not client)
  const validatedVariations = [];
  for (const v of variations) {
    // ── Assorted shortcut ────────────────────────────────────────────
    if (v.isAssorted) {
      validatedVariations.push({
        isAssorted: true,
        baseRecipe: { name: 'Assorted', price: config.assortedDonutBasePrice || 0, recipeId: null },
        frosting: { name: 'Assorted', price: 0, recipeId: null },
        filling: null,
        toppings: [],
        quantity: Number(v.quantity),
        lineTotal: 0,
      });
      continue;
    }

    // ── Specific variation ───────────────────────────────────────────
    const baseOption = config.availableBaseRecipes.find((o) => o._id.toString() === String(v.baseRecipeOptionId));
    if (!baseOption || !baseOption.isActive) {
      const err = new Error('Invalid or unavailable base recipe selection');
      err.status = 400;
      throw err;
    }

    const frostingOption = config.availableFrostings.find((o) => o._id.toString() === String(v.frostingOptionId));
    if (!frostingOption || !frostingOption.isActive) {
      const err = new Error('Invalid or unavailable frosting selection');
      err.status = 400;
      throw err;
    }

    // ── Filling (only when base is a filled recipe) ──────────────────
    let validatedFilling = null;
    if (baseOption.isFilled) {
      const fillingOption = config.availableFillings.find((o) => o._id.toString() === String(v.fillingOptionId));
      if (!fillingOption || !fillingOption.isActive) {
        const err = new Error(`Please select a filling for "${baseOption.name}"`);
        err.status = 400;
        throw err;
      }
      validatedFilling = {
        ingredientId: fillingOption.ingredientId || null,
        name: fillingOption.name,
        price: fillingOption.price,
      };
    }

    const validatedToppings = [];
    for (const tid of v.toppingOptionIds || []) {
      const toppingOption = config.availableToppings.find((o) => o._id.toString() === String(tid));
      if (!toppingOption || !toppingOption.isActive) {
        const err = new Error('Invalid or unavailable topping selection');
        err.status = 400;
        throw err;
      }
      validatedToppings.push({
        ingredientId: toppingOption.ingredientId,
        name: toppingOption.name,
        price: toppingOption.price,
      });
    }

    validatedVariations.push({
      isAssorted: false,
      baseRecipe: {
        recipeId: baseOption.recipeId,
        name: baseOption.name,
        price: baseOption.price,
      },
      frosting: {
        recipeId: frostingOption.recipeId,
        name: frostingOption.name,
        price: frostingOption.price,
      },
      filling: validatedFilling,
      toppings: validatedToppings,
      quantity: Number(v.quantity),
      lineTotal: 0, // recalculated in computeTotals
    });
  }

  // Calculate delivery fee (may call Google Maps API)
  const { fee: deliveryFee, distanceMiles } = await calculateDeliveryFee(fulfillmentType, deliveryAddress || {}, config);

  // Server-authoritative totals (pre-discount)
  const { subtotal } = computeTotals(validatedVariations, deliveryFee, settings.taxRate);

  // Apply bundle discount (same greedy algorithm as the POS auto-bundle)
  const boxConfigs = await CustomBoxConfig.find({ isActive: true }).lean();
  const bundleDiscountAmount = _computeBundleDiscount(validatedVariations, boxConfigs);
  const discountedSubtotal = Math.round((subtotal - bundleDiscountAmount) * 100) / 100;
  const tax = Math.round(discountedSubtotal * (settings.taxRate || 0) * 100) / 100;
  const total = Math.round((discountedSubtotal + deliveryFee + tax) * 100) / 100;

  // Persist the order
  const order = await SpecialOrder.create({
    customerName: String(customerName).trim().slice(0, 100),
    customerEmail: customerEmail ? String(customerEmail).trim().slice(0, 254) : null,
    customerPhone: customerPhone ? String(customerPhone).trim().slice(0, 30) : null,
    fulfillmentType,
    scheduledDate: new Date(scheduledDate),
    deliveryAddress: deliveryAddress || null,
    totalQuantity: Number(totalQuantity),
    variations: validatedVariations,
    subtotal,
    bundleDiscountAmount,
    deliveryFee,
    distanceMiles,
    tax,
    total,
    paymentStatus: 'pending',
    status: 'pending',
  });

  // Create Stripe Checkout Session
  if (!stripe) {
    const err = new Error('Stripe is not configured. Set STRIPE_SKEY.');
    err.status = 500;
    throw err;
  }

  const lineItems = [];
  for (const v of validatedVariations) {
    const unitPrice = (v.baseRecipe?.price || 0) + (v.frosting?.price || 0) + (v.toppings || []).reduce((s, t) => s + (t.price || 0), 0);
    const label = [v.baseRecipe?.name, v.frosting?.name, ...(v.toppings || []).map((t) => t.name)].filter(Boolean).join(' + ');
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: label },
        unit_amount: Math.round(unitPrice * 100),
      },
      quantity: v.quantity,
    });
  }
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }
  if (tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Sales Tax' },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });
  }

  // Apply bundle discount as a Stripe coupon so the checkout total matches the order total
  let stripeCouponId;
  if (bundleDiscountAmount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(bundleDiscountAmount * 100),
      currency: 'usd',
      duration: 'once',
      name: 'Bundle Discount',
      id: `so-bundle-${order._id}`,
    });
    stripeCouponId = coupon.id;
  }

  const sessionParams = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/special-orders/confirmation?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/special-orders?cancelled=true`,
    customer_email: order.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail) ? order.customerEmail : undefined,
    metadata: { specialOrderId: order._id.toString() },
  };
  if (stripeCouponId) sessionParams.discounts = [{ coupon: stripeCouponId }];

  const session = await stripe.checkout.sessions.create(sessionParams);

  order.stripeSessionId = session.id;
  await order.save();

  return { orderId: order._id.toString(), checkoutUrl: session.url };
}

// ─── Customer: Order Status & Lookup ─────────────────────────────────────────

async function _markPaid(orderId, paymentIntentId) {
  const order = await SpecialOrder.findOneAndUpdate({ _id: orderId, paymentStatus: 'pending' }, { paymentStatus: 'paid', status: 'confirmed', stripePaymentIntentId: paymentIntentId }, { new: true }).lean();
  if (order) {
    sendConfirmationEmail(order).catch((err) => console.error('[SpecialOrders] Confirmation email error:', err.message));
  }
  return order;
}

async function sendConfirmationEmail(order) {
  if (!order || !order.customerEmail) return;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[SpecialOrders] SMTP not configured — skipping confirmation email for', order.confirmationNumber);
    return;
  }

  const FULFILLMENT_LABELS = {
    'store-early': 'Store Pickup 5:30–7:30 AM',
    'store-mid': 'Store Pickup 9:00–10:00 AM',
    'in-city': 'Home Delivery — In City',
    'outside-city': 'Home Delivery — Outside City',
    'outside-county': 'Home Delivery — Outside County',
  };

  const dateStr = order.scheduledDate
    ? new Date(order.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const variationLines = (order.variations || []).map((v) => {
    const parts = [v.baseRecipe?.name, v.frosting?.name, ...(v.toppings || []).map((t) => t.name)].filter(Boolean);
    return `  ${v.quantity}x ${parts.join(' + ')}  $${(v.lineTotal || 0).toFixed(2)}`;
  });

  const lookupUrl = `${process.env.BASE_URL || ''}/special-orders/order-lookup`;

  const text = [
    `Hi ${order.customerName || 'there'},`,
    '',
    'Your special order has been confirmed and payment received.',
    '',
    `Confirmation Number: ${order.confirmationNumber}`,
    `Fulfillment: ${FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType}`,
    `Date: ${dateStr}`,
    '',
    'Items:',
    ...variationLines,
    '',
    `Subtotal: $${(order.subtotal || 0).toFixed(2)}`,
    order.deliveryFee > 0 ? `Delivery Fee: $${(order.deliveryFee || 0).toFixed(2)}` : null,
    order.tax > 0 ? `Tax: $${(order.tax || 0).toFixed(2)}` : null,
    `Total: $${(order.total || 0).toFixed(2)}`,
    '',
    'You can check your order status anytime:',
    lookupUrl,
    '',
    'Thank you — see you soon!',
    'Outta Town Donuts',
  ]
    .filter((l) => l !== null)
    .join('\n');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `Outta Town Donuts <${process.env.TRANSACTION_EMAIL || process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Special Order Confirmed — ${order.confirmationNumber}`,
      text,
    });
    console.log('[SpecialOrders] Confirmation email sent for', order.confirmationNumber);
  } catch (err) {
    console.error('[SpecialOrders] Confirmation email failed for', order.confirmationNumber, ':', err.message);
  }
}

async function getOrderStatus(orderId, stripeSessionId) {
  const order = await SpecialOrder.findById(orderId).lean();
  if (!order) return null;

  if (order.paymentStatus === 'paid') return order;

  // Attempt Stripe reconciliation if we have a session ID
  if (stripe && stripeSessionId && order.paymentStatus === 'pending') {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      if (session.payment_status === 'paid' && session.metadata?.specialOrderId === orderId) {
        return _markPaid(orderId, session.payment_intent);
      }
    } catch (err) {
      console.error('[SpecialOrders] Stripe reconciliation failed:', err.message);
    }
  }

  return order;
}

async function getOrderByConfirmation(confirmationNumber) {
  return SpecialOrder.findOne({ confirmationNumber: confirmationNumber.toUpperCase() }).lean();
}

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

async function handleStripeWebhook(rawBody, signature) {
  if (!stripe) throw new Error('Stripe is not configured');
  const secret = process.env.STRIPE_SO_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Stripe webhook secret not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.specialOrderId;
    if (orderId) {
      try {
        await _markPaid(orderId, session.payment_intent);
      } catch (err) {
        if (!err.message?.includes('already')) throw err;
      }
    }
  }

  return { received: true };
}

// ─── Driver ───────────────────────────────────────────────────────────────────

async function getTodayDeliveries() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return SpecialOrder.find({
    fulfillmentType: { $in: ['in-city', 'outside-city', 'outside-county'] },
    scheduledDate: { $gte: startOfDay, $lt: endOfDay },
    status: { $nin: ['delivered', 'cancelled'] },
    paymentStatus: 'paid',
  })
    .sort({ createdAt: 1 })
    .lean();
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortByProximity(orders, storeLat, storeLng) {
  const remaining = [...orders];
  const sorted = [];
  let curLat = storeLat;
  let curLng = storeLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const addr = remaining[i].deliveryAddress;
      if (!addr?.lat || !addr?.lng) {
        // Orders without coordinates go to end — use distance 0 so they slot in
        continue;
      }
      const dist = haversineKm(curLat, curLng, addr.lat, addr.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    sorted.push(next);
    const addr = next.deliveryAddress;
    if (addr?.lat && addr?.lng) {
      curLat = addr.lat;
      curLng = addr.lng;
    }
  }
  return sorted;
}

async function markFilling(id) {
  const order = await SpecialOrder.findOneAndUpdate({ _id: id, status: { $in: ['confirmed', 'pending'] } }, { status: 'filling' }, { new: true });
  if (!order) {
    const err = new Error('Order not found or not in a fillable state');
    err.status = 404;
    throw err;
  }
  return order;
}

async function markOutForDelivery(id) {
  const order = await SpecialOrder.findOneAndUpdate({ _id: id, status: 'filling' }, { status: 'out-for-delivery' }, { new: true });
  if (!order) {
    const err = new Error('Order not found or not in filling state');
    err.status = 404;
    throw err;
  }
  return order;
}

async function markDelivered(id) {
  const order = await SpecialOrder.findOneAndUpdate({ _id: id, status: 'out-for-delivery' }, { status: 'delivered' }, { new: true });
  if (!order) {
    const err = new Error('Order not found or not out for delivery');
    err.status = 404;
    throw err;
  }
  return order;
}

// ─── Address Verification & Autocomplete (Nominatim) ─────────────────────────

let _lastNominatimTs = 0;

const NOMINATIM_HEADERS = {
  'User-Agent': 'OuttaTownDonuts/1.0 (contact@otddonuts.com)',
  Accept: 'application/json',
};

// Raw HTTP GET → parsed JSON array; enforces 1.1s between requests (Nominatim policy)
function _nominatimFetch(url) {
  return new Promise((resolve, reject) => {
    const delay = Math.max(0, 1100 - (Date.now() - _lastNominatimTs));
    setTimeout(() => {
      _lastNominatimTs = Date.now();
      https
        .get(url, { headers: NOMINATIM_HEADERS }, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        })
        .on('error', reject);
    }, delay);
  });
}

async function _nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  const results = await _nominatimFetch(url);
  return results[0] || null;
}

const US_STATE_ABBR = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

async function addressAutocomplete(q) {
  if (!q || q.trim().length < 4) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=7&countrycodes=us&q=${encodeURIComponent(q.trim())}`;
  const results = await _nominatimFetch(url);
  return (results || [])
    .map((r) => {
      const a = r.address || {};
      const street = [a.house_number, a.road].filter(Boolean).join(' ');
      if (!street) return null; // skip non-street results (cities, POIs)
      const city = a.city || a.town || a.village || a.hamlet || a.suburb || '';
      const stateRaw = a.state || '';
      const state = US_STATE_ABBR[stateRaw] || stateRaw;
      const zip = a.postcode || '';
      return { display: r.display_name, street, city, state, zip };
    })
    .filter(Boolean);
}

function _extractLocality(geoResult) {
  if (!geoResult) return null;
  const a = geoResult.address || {};
  return {
    city: (a.city || a.town || a.village || a.hamlet || '').toLowerCase().trim(),
    county: (a.county || '')
      .toLowerCase()
      .replace(/\s+county$/i, '')
      .trim(),
    state: (a.state || '').toLowerCase().trim(),
    lat: parseFloat(geoResult.lat),
    lng: parseFloat(geoResult.lon),
  };
}

async function verifyDeliveryAddress(address, fulfillmentType) {
  const config = await getConfig();
  if (!config.storeAddress) {
    return { ok: true, suggestedTier: fulfillmentType, verified: false, reason: 'Store address not configured' };
  }

  // Geocode store address (cached)
  if (!_storeGeoCache) {
    const storeResult = await _nominatimGeocode(config.storeAddress);
    _storeGeoCache = _extractLocality(storeResult);
  }
  if (!_storeGeoCache) {
    return { ok: true, suggestedTier: fulfillmentType, verified: false, reason: 'Could not geocode store address' };
  }

  // Build full address string for geocoding
  const addrStr = [address.street, address.city, address.state || 'TN', address.zip].filter(Boolean).join(', ');
  const customerResult = await _nominatimGeocode(addrStr);
  if (!customerResult) {
    return { ok: true, suggestedTier: fulfillmentType, verified: false, reason: 'Address not found' };
  }

  const customerLoc = _extractLocality(customerResult);
  const storeCity = _storeGeoCache.city;
  const storeCounty = _storeGeoCache.county;

  let suggestedTier;
  if (customerLoc.city === storeCity) {
    suggestedTier = 'in-city';
  } else if (customerLoc.county === storeCounty) {
    suggestedTier = 'outside-city';
  } else {
    suggestedTier = 'outside-county';
  }

  const mismatch = suggestedTier !== fulfillmentType;
  const TIER_LABELS = {
    'in-city': 'Inside City Limits',
    'outside-city': 'Outside City / Inside County',
    'outside-county': 'Outside County',
  };

  return {
    ok: true,
    verified: true,
    suggestedTier,
    mismatch,
    customerCity: customerLoc.city,
    customerCounty: customerLoc.county,
    message: mismatch ? `Your address appears to be in "${customerLoc.city || customerLoc.county}" which is ${TIER_LABELS[suggestedTier]}. You selected ${TIER_LABELS[fulfillmentType]}. The delivery fee may be incorrect.` : null,
  };
}

module.exports = {
  getConfig,
  updateConfig,
  addOption,
  removeOption,
  setOptionFilled,
  getOrders,
  getOrderById,
  confirmOrder,
  cancelOrder,
  getPublicConfig,
  validateOrderWindow,
  calculateDeliveryFee,
  computeTotals,
  estimateOrderPrice,
  createSpecialOrder,
  getOrderStatus,
  getOrderByConfirmation,
  handleStripeWebhook,
  getTodayDeliveries,
  sortByProximity,
  markFilling,
  markOutForDelivery,
  markDelivered,
  verifyDeliveryAddress,
  addressAutocomplete,
};
