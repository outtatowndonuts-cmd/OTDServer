const { Order, OrderSettings } = require('./orders.model');
const eventBus = require('../../shared/eventBus');
const audit = require('../../shared/audit');

const TOTAL_TOLERANCE = 0.02; // rounding tolerance for total validation

/**
 * Create a new order after validating required fields by type.
 */
async function createOrder(orderData) {
  const { type, items } = orderData;

  if (!items || !items.length) {
    throw new Error('Order must have at least one item');
  }

  if (type === 'sale') {
    if (!orderData.paymentMethod || orderData.paymentMethod === 'none') {
      throw new Error('Sale orders require a paymentMethod');
    }
    for (const item of items) {
      if (item.priceSnapshot == null) {
        throw new Error('Sale order items require a priceSnapshot');
      }
    }

    // Server-authoritative total calculation
    const settings = await getSettings();
    const calculatedSubtotal = items.reduce((sum, i) => sum + Number(i.priceSnapshot) * Number(i.quantity), 0);
    const taxRate = Number(settings.taxRate) || 0;
    const calculatedTax = Math.round(calculatedSubtotal * (taxRate / 100) * 100) / 100;
    const calculatedTotal = Math.round((calculatedSubtotal + calculatedTax) * 100) / 100;

    // Warn if client values diverge beyond tolerance (possible bug or tampering)
    if (orderData.total != null && Math.abs(orderData.total - calculatedTotal) > TOTAL_TOLERANCE) {
      console.warn('[Orders] Client total ($%s) differs from server total ($%s) — using server value', orderData.total, calculatedTotal);
    }

    // Always use server-calculated values
    orderData.subtotal = Math.round(calculatedSubtotal * 100) / 100;
    orderData.tax = calculatedTax;
    orderData.total = calculatedTotal;

    // Defaults for sales
    if (orderData.paymentStatus == null) orderData.paymentStatus = 'pending';

    // Donated orders are free — zero out all amounts and mark paid
    if (orderData.paymentMethod === 'donation') {
      orderData.subtotal = 0;
      orderData.tax = 0;
      orderData.total = 0;
      orderData.paymentStatus = 'paid';
    }
  }

  if (type === 'production') {
    const hasRecipe = items.some((i) => i.kind === 'recipe');
    if (!hasRecipe) {
      throw new Error('Production orders must include at least one recipe reference');
    }
    // Production orders have no payment
    orderData.paymentMethod = 'none';
    orderData.paymentStatus = 'none';
  }

  if (type === 'assembly') {
    const hasProduct = items.some((i) => i.kind === 'product');
    if (!hasProduct) {
      throw new Error('Assembly orders must include at least one product reference');
    }
    // Assembly orders have no payment; they move kitchen stock → display case
    orderData.paymentMethod = 'none';
    orderData.paymentStatus = 'none';
  }

  if (!orderData.status) orderData.status = 'pending';

  // Idempotency: if a key is provided, return existing order instead of creating duplicate
  if (orderData.idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey: orderData.idempotencyKey });
    if (existing) return existing;
  }

  const order = await Order.create(orderData);
  return order;
}

/**
 * Get orders with optional filters.
 */
async function getOrders(filters = {}) {
  const query = {};
  if (filters.type) query.type = filters.type;
  if (filters.source) query.source = filters.source;
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      query.createdAt.$lte = to;
    }
  }
  return Order.find(query).sort({ createdAt: -1 });
}

/**
 * Get a single order by ID.
 */
async function getOrderById(id) {
  return Order.findById(id);
}

/**
 * Mark an order as completed and emit event.
 * Only pending orders can be completed — prevents duplicate event emission.
 */
async function completeOrder(orderId) {
  const order = await Order.findOneAndUpdate({ _id: orderId, status: 'pending' }, { status: 'completed' }, { new: true });
  if (!order) {
    const exists = await Order.findById(orderId);
    if (!exists) throw new Error('Order not found');
    throw new Error('Order is already completed');
  }
  eventBus.emit('order.completed', order);
  return order;
}

/**
 * Get order settings (singleton, created atomically if missing).
 */
async function getSettings() {
  return OrderSettings.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

/**
 * Update order settings.
 */
async function updateSettings(data) {
  const update = {};
  if (data.taxRate != null) update.taxRate = parseFloat(data.taxRate) || 0;
  if (data.defaultPaymentMethod) update.defaultPaymentMethod = data.defaultPaymentMethod;
  if (data.defaultSource) update.defaultSource = data.defaultSource;
  if (data.preordersEnabled != null) update.preordersEnabled = Boolean(data.preordersEnabled);
  return OrderSettings.findOneAndUpdate({}, update, { upsert: true, new: true, setDefaultsOnInsert: true });
}

/**
 * Mark an order as paid (used by Stripe confirmation flow).
 */
async function markOrderPaid(orderId) {
  const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' }, { new: true });
  if (!order) throw new Error('Order not found');
  return order;
}

/**
 * Atomically mark an order as paid AND completed, then emit event.
 * Used by Stripe flow to avoid partial state between two writes.
 * Optionally stores stripePaymentIntentId for refund support.
 */
async function markPaidAndComplete(orderId, { stripePaymentIntentId } = {}) {
  const updateFields = { paymentStatus: 'paid', status: 'completed' };
  if (stripePaymentIntentId) updateFields.stripePaymentIntentId = stripePaymentIntentId;

  const order = await Order.findOneAndUpdate({ _id: orderId, status: 'pending' }, updateFields, { new: true });
  if (!order) {
    const exists = await Order.findById(orderId);
    if (!exists) throw new Error('Order not found');
    throw new Error('Order is already completed');
  }
  eventBus.emit('order.completed', order);
  return order;
}

/**
 * Cancel a pending order.
 * Only pending orders can be cancelled. Completed orders must be refunded instead.
 */
async function cancelOrder(orderId, { reason, user } = {}) {
  const updateFields = {
    status: 'cancelled',
    cancelledAt: new Date(),
  };
  if (reason) updateFields.cancellationReason = reason;
  if (user) updateFields.cancelledBy = user._id;

  const order = await Order.findOneAndUpdate({ _id: orderId, status: 'pending' }, updateFields, { new: true });
  if (!order) {
    const exists = await Order.findById(orderId);
    if (!exists) throw new Error('Order not found');
    if (exists.status === 'cancelled') throw new Error('Order is already cancelled');
    if (exists.status === 'completed') throw new Error('Cannot cancel a completed order — use refund instead');
    throw new Error('Order cannot be cancelled');
  }

  await audit.log('order.cancelled', user, {
    targetType: 'Order',
    targetId: order._id,
    details: { orderTotal: order.total, reason: reason || 'none', paymentMethod: order.paymentMethod },
  });
  eventBus.emit('order.cancelled', order);
  return order;
}

/**
 * Refund a completed, paid order.
 * Emits 'order.refunded' event for inventory reversal.
 * Stripe refund must be handled by the caller before invoking this.
 */
async function refundOrder(orderId, { user, stripeRefundId } = {}) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: 'completed', paymentStatus: 'paid' },
    {
      paymentStatus: 'refunded',
      status: 'cancelled',
      refundedAt: new Date(),
      refundedBy: user ? user._id : undefined,
      cancelledAt: new Date(),
      cancelledBy: user ? user._id : undefined,
    },
    { new: true },
  );
  if (!order) {
    const exists = await Order.findById(orderId);
    if (!exists) throw new Error('Order not found');
    if (exists.paymentStatus === 'refunded') throw new Error('Order is already refunded');
    if (exists.status !== 'completed') throw new Error('Only completed orders can be refunded');
    if (exists.paymentStatus !== 'paid') throw new Error('Only paid orders can be refunded');
    throw new Error('Order cannot be refunded');
  }

  await audit.log('order.refunded', user, {
    targetType: 'Order',
    targetId: order._id,
    details: {
      orderTotal: order.total,
      paymentMethod: order.paymentMethod,
      stripeRefundId: stripeRefundId || null,
    },
  });
  eventBus.emit('order.refunded', order);
  return order;
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  completeOrder,
  getSettings,
  updateSettings,
  markOrderPaid,
  markPaidAndComplete,
  cancelOrder,
  refundOrder,
};
