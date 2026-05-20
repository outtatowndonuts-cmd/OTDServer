/**
 * Shared Order Service
 *
 * Wraps the orders module service for use by other modules (POS, future systems).
 * Other modules should require this file instead of importing directly from /modules/orders/.
 */
const ordersService = require('../modules/orders/orders.service');

module.exports = {
  createOrder: ordersService.createOrder,
  getOrders: ordersService.getOrders,
  getOrderById: ordersService.getOrderById,
  getOrderByConfirmationNumber: ordersService.getOrderByConfirmationNumber,
  completeOrder: ordersService.completeOrder,
  fillOrder: ordersService.fillOrder,
  deliverOrder: ordersService.deliverOrder,
  getSettings: ordersService.getSettings,
  updateSettings: ordersService.updateSettings,
  markOrderPaid: ordersService.markOrderPaid,
  markPaidAndComplete: ordersService.markPaidAndComplete,
  cancelOrder: ordersService.cancelOrder,
  refundOrder: ordersService.refundOrder,
};
