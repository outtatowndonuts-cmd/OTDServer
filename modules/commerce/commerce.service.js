const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const catalogService = require('../../shared/catalog.service');
const orderService = require('../../shared/order.service');
const inventoryService = require('../../shared/inventory.service');
const { CustomBoxConfig } = require('./custom-box.model');

/**
 * Get products with real-time availability for storefront display.
 * Availability is read directly from each product's display-case inventory.
 * For bundles, availability is the minimum across all component products.
 */
async function getStorefrontProducts() {
  const products = await catalogService.getProducts();
  const inventory = await inventoryService.getInventory({ kind: 'product' });

  // Build lookup: refId string → quantity (display-case stock only)
  const stockMap = {};
  for (const item of inventory) {
    stockMap[item.refId.toString()] = item.quantity;
  }

  return products
    .map((p) => {
      const product = p.toObject ? p.toObject() : p;
      let available = 0;

      if (product.productType === 'bundle') {
        // Bundle availability = minimum component display-case stock (accounting for qty per bundle)
        let minAvail = Infinity;
        for (const bi of product.bundleItems || []) {
          const stock = stockMap[bi.product ? bi.product.toString() : ''] || 0;
          const canFulfill = Math.max(0, Math.floor(stock / (bi.quantity || 1)));
          minAvail = Math.min(minAvail, canFulfill);
        }
        available = minAvail === Infinity ? 0 : minAvail;
      } else {
        // Simple product: direct display-case stock lookup
        available = stockMap[product._id.toString()] || 0;
      }

      product.available = available;
      return product;
    })
    .filter((p) => p.price != null && p.price > 0 && p.isActive !== false);
}

/**
 * Create a pending online sale order.
 * Validates server-side availability before creation.
 */
async function createOnlineOrder({ items, idempotencyKey, pickupName }) {
  // Validate availability at the component level
  const availability = await inventoryService.checkAvailability(items);
  if (!availability.available) {
    const err = new Error('Insufficient stock for one or more items');
    err.shortages = availability.shortages;
    err.status = 409;
    throw err;
  }

  // Build order items with price snapshots from catalog (server-authoritative)
  const orderItems = [];
  for (const item of items) {
    const product = await catalogService.getProductById(item.refId);
    if (!product) {
      throw new Error(`Product not found: ${item.refId}`);
    }
    if (!product.price || product.price <= 0) {
      throw new Error(`Product not available for sale: ${product.name}`);
    }
    orderItems.push({
      kind: 'product',
      refId: product._id,
      nameSnapshot: product.name,
      quantity: Number(item.quantity),
      priceSnapshot: product.price,
    });
  }

  return orderService.createOrder({
    type: 'sale',
    source: 'online',
    items: orderItems,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    status: 'pending',
    idempotencyKey,
    pickupName: pickupName ? String(pickupName).trim().slice(0, 100) : undefined,
  });
}

/**
 * Create a Stripe Checkout Session for a pending order.
 */
async function createCheckoutSession(order) {
  if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SKEY.');

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.nameSnapshot },
      unit_amount: Math.round(item.priceSnapshot * 100),
    },
    quantity: item.quantity,
  }));

  // Include tax as a separate line item so Stripe total matches order total
  if (order.tax && order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Sales Tax' },
        unit_amount: Math.round(order.tax * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/shop/confirmation?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/shop/pickup?cancelled=true`,
    metadata: { orderId: order._id.toString() },
  });

  return session;
}

/**
 * Handle Stripe checkout.session.completed webhook.
 * Idempotent: completing an already-completed order is a safe no-op
 * (order.service.markPaidAndComplete only transitions pending → completed).
 */
async function handleStripeWebhook(rawBody, signature) {
  if (!stripe) throw new Error('Stripe is not configured');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      try {
        await orderService.markPaidAndComplete(orderId, {
          stripePaymentIntentId: session.payment_intent,
        });
      } catch (err) {
        // "Order is already completed" is expected in duplicate webhook delivery
        if (!err.message.includes('already completed')) throw err;
      }
    }
  }

  return { received: true };
}

/**
 * Reconcile an order on the confirmation page.
 * If the frontend redirect fired but the webhook hasn't arrived yet,
 * verify with Stripe and complete the order.
 */
async function reconcileOrder(orderId, stripeSessionId) {
  const order = await orderService.getOrderById(orderId);
  if (!order) return null;

  // Already completed — nothing to do
  if (order.status === 'completed' && order.paymentStatus === 'paid') {
    return order;
  }

  // Try to verify with Stripe if we have a session ID
  if (stripe && stripeSessionId && order.status === 'pending') {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      if (session.payment_status === 'paid' && session.metadata?.orderId === orderId) {
        return orderService.markPaidAndComplete(orderId, {
          stripePaymentIntentId: session.payment_intent,
        });
      }
    } catch (err) {
      // Stripe retrieval failed — fall through and show current state
      console.error('[Commerce] Stripe reconciliation failed:', err.message);
    }
  }

  return order;
}

/**
 * Get order for confirmation page display.
 */
async function getOrderForConfirmation(orderId) {
  return orderService.getOrderById(orderId);
}

// ─── Custom Box Builder ───────────────────────────────────────────────────────

/**
 * Return active box configurations for the storefront.
 */
async function getActiveCustomBoxConfigs() {
  return CustomBoxConfig.find({ isActive: true }).sort({ size: 1 });
}

/**
 * Create an online order for a custom box selection.
 *
 * selections: [{ refId, quantity }]  — individual simple products the customer picked.
 * boxConfigId: ObjectId of the CustomBoxConfig chosen.
 * pickupName: string.
 * idempotencyKey: optional string.
 *
 * The discount from the box config is applied as a single negative line item
 * so the real product prices are preserved in order history.
 */
async function createCustomBoxOrder({ boxConfigId, selections, pickupName, idempotencyKey }) {
  const boxConfig = await CustomBoxConfig.findById(boxConfigId).populate('packagingSupply');
  if (!boxConfig || !boxConfig.isActive) {
    throw new Error('Box configuration not found or inactive');
  }

  const totalSelected = selections.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  if (totalSelected !== boxConfig.size) {
    throw new Error(`A ${boxConfig.name} requires exactly ${boxConfig.size} items (you selected ${totalSelected})`);
  }

  // Validate each selection is a real, available, simple product
  const orderItems = [];

  for (const sel of selections) {
    const qty = Math.max(1, Math.floor(Number(sel.quantity) || 0));
    const product = await catalogService.getProductById(sel.refId);
    if (!product) throw new Error(`Product not found: ${sel.refId}`);
    if (product.productType !== 'simple') throw new Error(`Only individual products can be added to a custom box (${product.name})`);
    if (!product.price || product.price <= 0) throw new Error(`Product not available for sale: ${product.name}`);
    if (product.isActive === false) throw new Error(`Product is not active: ${product.name}`);

    // Check display-case stock
    const inv = await inventoryService.getInventoryItem(product._id);
    const available = inv ? inv.quantity : 0;
    if (available < qty) {
      throw Object.assign(new Error(`Insufficient stock for ${product.name}`), {
        status: 409,
        shortages: [{ name: product.name, needed: qty, available }],
      });
    }

    orderItems.push({
      kind: 'product',
      refId: product._id,
      nameSnapshot: product.name,
      quantity: qty,
      priceSnapshot: product.price,
    });
  }

  // Apply bundle discount: multiply each item's priceSnapshot by the discount factor.
  // Prices are rounded to the nearest cent before being stored.
  // Doing it per-item (rather than a single negative line) keeps all Stripe amounts positive
  // and lets the server-side total calculation work without special cases.
  if (boxConfig.discountPct > 0) {
    const factor = 1 - boxConfig.discountPct / 100;
    for (const item of orderItems) {
      item.priceSnapshot = Math.round(item.priceSnapshot * factor * 100) / 100;
    }
  }

  // After discount: add packaging fee as a separate line item if a supply is linked.
  if (boxConfig.packagingSupply && boxConfig.packagingSupply.costPerUnit > 0) {
    orderItems.push({
      kind: 'fee',
      refId: boxConfig.packagingSupply._id,
      nameSnapshot: `${boxConfig.name} Packaging`,
      quantity: 1,
      priceSnapshot: Math.round(boxConfig.packagingSupply.costPerUnit * 100) / 100,
    });
  }

  const order = await orderService.createOrder({
    type: 'sale',
    source: 'online',
    items: orderItems,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    status: 'pending',
    idempotencyKey,
    pickupName: pickupName ? String(pickupName).trim().slice(0, 100) : undefined,
  });

  return order;
}

module.exports = {
  getStorefrontProducts,
  createOnlineOrder,
  createCheckoutSession,
  handleStripeWebhook,
  reconcileOrder,
  getOrderForConfirmation,
  getActiveCustomBoxConfigs,
  createCustomBoxOrder,
};
