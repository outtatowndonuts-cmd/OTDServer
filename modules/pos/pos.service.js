const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const catalogService = require('../../shared/catalog.service');
const orderService = require('../../shared/order.service');

/**
 * Fetch all products for the POS product grid.
 */
async function getCatalog() {
  const products = await catalogService.getProducts();
  return products;
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

module.exports = {
  getCatalog,
  getSettings,
  createSaleOrder,
  completeOrder,
  createPaymentIntent,
  markOrderPaid,
  markPaidAndComplete,
  verifyPaymentIntent,
  cancelOrder,
  refundOrder,
};
