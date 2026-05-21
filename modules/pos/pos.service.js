const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const catalogService = require('../../shared/catalog.service');
const orderService = require('../../shared/order.service');
const inventoryService = require('../../shared/inventory.service');
const { CustomBoxConfig } = require('../commerce/custom-box.model');

/**
 * Fetch all products for the POS product grid, enriched with live display-case stock.
 */
async function getCatalog() {
  const products = await catalogService.getProducts();

  // Fetch all product-kind inventory items in one query and build a lookup map
  const invItems = await inventoryService.getInventory({ kind: 'product' });
  const stockMap = {};
  for (const item of invItems) {
    stockMap[item.refId.toString()] = item.quantity;
  }

  // Attach inventoryQty and exclude products with no stock
  return products
    .map((p) => {
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.inventoryQty = stockMap[p._id.toString()] ?? 0;
      return obj;
    })
    .filter((p) => p.inventoryQty > 0);
}

/**
 * Get order settings (tax rate, defaults).
 */
async function getSettings() {
  return orderService.getSettings();
}

/**
 * Create a sale order from POS.
 */
async function createSaleOrder({ items, subtotal, tax, total, paymentMethod }) {
  return orderService.createOrder({
    type: 'sale',
    source: 'pos',
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    paymentStatus: ['cash', 'donation'].includes(paymentMethod) ? 'paid' : 'pending',
    status: 'pending',
  });
}

/**
 * Complete an order (mark paid, emit events for inventory sync).
 */
async function completeOrder(orderId) {
  return orderService.completeOrder(orderId);
}

/**
 * Create a Stripe Payment Intent for card payments.
 */
async function createPaymentIntent(amountCents, orderId) {
  if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SKEY in your environment.');
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
}

/**
 * Mark a Stripe-paid order as paid.
 */
async function markOrderPaid(orderId) {
  return orderService.markOrderPaid(orderId);
}

/**
 * Mark a Stripe-paid order as paid and completed atomically.
 */
async function markPaidAndComplete(orderId, { stripePaymentIntentId } = {}) {
  return orderService.markPaidAndComplete(orderId, { stripePaymentIntentId });
}

/**
 * Verify a Payment Intent succeeded with Stripe.
 */
async function verifyPaymentIntent(paymentIntentId) {
  if (!stripe) throw new Error('Stripe is not configured');
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return pi.status === 'succeeded';
}

/**
 * Cancel a pending POS order.
 */
async function cancelOrder(orderId, { reason, user } = {}) {
  return orderService.cancelOrder(orderId, { reason, user });
}

/**
 * Refund a completed POS order.
 * Handles Stripe refund for card payments, then marks order as refunded.
 */
async function refundOrder(orderId, { user } = {}) {
  const order = await orderService.getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  let stripeRefundId = null;

  // Process Stripe refund for card payments
  if (order.paymentMethod === 'card' && order.stripePaymentIntentId) {
    if (!stripe) throw new Error('Stripe is not configured — cannot process refund');
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
    stripeRefundId = refund.id;
  }

  return orderService.refundOrder(orderId, { user, stripeRefundId });
}

/**
 * Create a Stripe Checkout Session for QR-based card payments.
 * The session hosts the payment page on Stripe's side — no card reader needed.
 */
async function createCheckoutSession({ lineItems, metadata, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SKEY in your environment.');
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

/**
 * Retrieve a Stripe Checkout Session to verify payment status.
 */
async function getCheckoutSession(sessionId) {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Get a single order by ID.
 */
async function getOrderById(orderId) {
  return orderService.getOrderById(orderId);
}

/**
 * Get orders that need action at the counter, in two groups:
 * - status 'completed' + paymentStatus 'paid'  → paid, needs to be bagged/filled
 * - status 'filled'                            → bagged, waiting for customer pickup
 * Both groups sorted oldest-first (FIFO).  Only last 24 h to avoid stale backlog.
 */
async function getPendingQueue() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [toFill, toDeliver] = await Promise.all([orderService.getOrders({ source: 'online', status: 'completed', paymentStatus: 'paid', dateFrom: cutoff }), orderService.getOrders({ source: 'online', status: 'filled', paymentStatus: 'paid', dateFrom: cutoff })]);
  const sort = (arr) => arr.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return [...sort(toFill), ...sort(toDeliver)];
}

/**
 * Mark a completed order as filled (bagged, waiting for pickup).
 */
async function fillOrder(orderId) {
  return orderService.fillOrder(orderId);
}

/**
 * Mark a filled order as delivered (handed off, out of queue).
 */
async function deliverOrder(orderId) {
  return orderService.deliverOrder(orderId);
}

module.exports = {
  getCatalog,
  getSettings,
  createSaleOrder,
  completeOrder,
  fillOrder,
  deliverOrder,
  createPaymentIntent,
  markOrderPaid,
  markPaidAndComplete,
  verifyPaymentIntent,
  cancelOrder,
  refundOrder,
  createCheckoutSession,
  getCheckoutSession,
  getOrderById,
  getPendingQueue,
  getCustomBoxConfigs,
};

/**
 * Return active bundle configurations for the POS box builder.
 */
async function getCustomBoxConfigs() {
  return CustomBoxConfig.find({ isActive: true }).sort({ size: 1 }).lean();
}
