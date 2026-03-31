const stripe = process.env.STRIPE_SKEY ? require('stripe')(process.env.STRIPE_SKEY) : null;
const catalogService = require('../../shared/catalog.service');
const orderService = require('../../shared/order.service');
const { Order, OrderSettings } = require('../orders/orders.model');

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
  let s = await OrderSettings.findOne();
  if (!s) s = await OrderSettings.create({});
  return s;
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
    paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
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
  return Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' }, { new: true });
}

/**
 * Verify a Payment Intent succeeded with Stripe.
 */
async function verifyPaymentIntent(paymentIntentId) {
  if (!stripe) throw new Error('Stripe is not configured');
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return pi.status === 'succeeded';
}

module.exports = {
  getCatalog,
  getSettings,
  createSaleOrder,
  completeOrder,
  createPaymentIntent,
  markOrderPaid,
  verifyPaymentIntent,
};
