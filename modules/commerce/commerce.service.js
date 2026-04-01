const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const catalogService = require('../../shared/catalog.service');
const orderService = require('../../shared/order.service');
const inventoryService = require('../../shared/inventory.service');

/**
 * Get products with real-time availability for storefront display.
 * Derives available quantity from inventory stock of each product's components.
 */
async function getStorefrontProducts() {
  const products = await catalogService.getProducts();
  const inventory = await inventoryService.getInventory();

  // Build lookup: refId string → quantity
  const stockMap = {};
  for (const item of inventory) {
    stockMap[item.refId.toString()] = item.quantity;
  }

  return products
    .map((p) => {
      const product = p.toObject();
      let maxAvailable = Infinity;

      if (product.components && product.components.length) {
        for (const comp of product.components) {
          const stock = stockMap[comp.ref.toString()] || 0;
          const canFulfill = Math.floor(stock / comp.quantity);
          maxAvailable = Math.min(maxAvailable, canFulfill);
        }
      } else {
        maxAvailable = 0;
      }

      product.available = maxAvailable === Infinity ? 0 : Math.max(0, maxAvailable);
      return product;
    })
    .filter((p) => p.price != null && p.price > 0);
}

/**
 * Create a pending online sale order.
 * Validates server-side availability before creation.
 */
async function createOnlineOrder({ items, idempotencyKey }) {
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

module.exports = {
  getStorefrontProducts,
  createOnlineOrder,
  createCheckoutSession,
  handleStripeWebhook,
  reconcileOrder,
  getOrderForConfirmation,
};
