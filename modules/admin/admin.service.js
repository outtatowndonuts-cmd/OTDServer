/**
 * Admin Service
 *
 * Aggregates data from shared services for the admin control panel.
 * Does NOT contain core business logic — delegates to shared services.
 */
const orderService = require('../../shared/order.service');
const inventoryService = require('../../shared/inventory.service');
const User = require('../../models/User');

const LOW_STOCK_THRESHOLD = 5;

/**
 * Dashboard summary: today's sales, order count, recent orders, low-stock items.
 */
async function getDashboard() {
  const allOrders = await orderService.getOrders();

  // Today's boundaries
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todaysOrders = allOrders.filter((o) => o.createdAt >= startOfDay && o.type === 'sale');

  const totalSalesToday = todaysOrders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);

  const recentOrders = allOrders.slice(0, 10);

  const inventory = await inventoryService.getInventory();
  const lowStock = inventory.filter((i) => i.quantity <= LOW_STOCK_THRESHOLD);

  return {
    totalSalesToday,
    orderCountToday: todaysOrders.length,
    recentOrders,
    lowStock,
  };
}

/**
 * Orders list with optional type/date filters.
 */
async function getOrders(filters = {}) {
  const serviceFilters = {};
  if (filters.type) serviceFilters.type = filters.type;
  if (filters.status) serviceFilters.status = filters.status;

  let orders = await orderService.getOrders(serviceFilters);

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    orders = orders.filter((o) => o.createdAt >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    orders = orders.filter((o) => o.createdAt <= to);
  }

  return orders;
}

/**
 * Inventory list.
 */
async function getInventory(filters = {}) {
  return inventoryService.getInventory(filters);
}

/**
 * Manual inventory adjustment (admin only).
 */
async function adjustInventory({ kind, refId, name, quantityDelta }) {
  return inventoryService.adjustStock({ kind, refId, name, quantityDelta });
}

/**
 * Employee list (safe projection — no passwords/tokens).
 */
async function getEmployees() {
  return User.find({}).select('email role profile.name profile.picture createdAt').sort({ createdAt: -1 });
}

/**
 * Update a user's role.
 */
async function updateEmployeeRole(userId, newRole) {
  const validRoles = ['admin', 'manager', 'staff'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.role = newRole;
  await user.save();
  return { id: user._id, email: user.email, role: user.role };
}

module.exports = {
  getDashboard,
  getOrders,
  getInventory,
  adjustInventory,
  getEmployees,
  updateEmployeeRole,
};
