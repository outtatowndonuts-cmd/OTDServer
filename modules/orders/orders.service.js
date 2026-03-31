const { Order, OrderSettings } = require('./orders.model');
const eventBus = require('../../shared/eventBus');

/**
 * Create a new order after validating required fields by type.
 */
async function createOrder(orderData) {
  const { type, items } = orderData;

  if (!items || !items.length) {
    throw new Error('Order must have at least one item');
  }

  if (type === 'sale') {
    if (orderData.total == null) {
      throw new Error('Sale orders require a total');
    }
    if (!orderData.paymentMethod || orderData.paymentMethod === 'none') {
      throw new Error('Sale orders require a paymentMethod');
    }
    for (const item of items) {
      if (item.priceSnapshot == null) {
        throw new Error('Sale order items require a priceSnapshot');
      }
    }
    // Defaults for sales
    if (orderData.paymentStatus == null) orderData.paymentStatus = 'pending';
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

  if (!orderData.status) orderData.status = 'pending';

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
 */
async function completeOrder(orderId) {
  const order = await Order.findByIdAndUpdate(orderId, { status: 'completed' }, { new: true });
  if (!order) throw new Error('Order not found');
  eventBus.emit('order.completed', order);
  return order;
}

/**
 * Get order settings (singleton).
 */
async function getSettings() {
  let s = await OrderSettings.findOne();
  if (!s) s = await OrderSettings.create({});
  return s;
}

/**
 * Update order settings.
 */
async function updateSettings(data) {
  const update = {};
  if (data.taxRate != null) update.taxRate = parseFloat(data.taxRate) || 0;
  if (data.defaultPaymentMethod) update.defaultPaymentMethod = data.defaultPaymentMethod;
  if (data.defaultSource) update.defaultSource = data.defaultSource;
  return OrderSettings.findOneAndUpdate({}, update, { upsert: true, new: true, setDefaultsOnInsert: true });
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  completeOrder,
  getSettings,
  updateSettings,
};
