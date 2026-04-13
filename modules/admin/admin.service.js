/**
 * Admin Service
 *
 * Aggregates data from shared services for the admin control panel.
 * Does NOT contain core business logic — delegates to shared services.
 */
const orderService = require('../../shared/order.service');
const inventoryService = require('../../shared/inventory.service');
const audit = require('../../shared/audit');
const User = require('../../models/User');
const { CustomBoxConfig } = require('../commerce/custom-box.model');

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
  if (filters.dateFrom) serviceFilters.dateFrom = filters.dateFrom;
  if (filters.dateTo) serviceFilters.dateTo = filters.dateTo;

  return orderService.getOrders(serviceFilters);
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
  return User.find({}).select('email role status applicationNote profile.name profile.picture createdAt').sort({ createdAt: -1 });
}

/**
 * Update a user's role. Assigning a role implicitly activates a pending account.
 */
async function updateEmployeeRole(userId, newRole, { actor } = {}) {
  const validRoles = ['admin', 'manager', 'staff'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const oldRole = user.role;
  const oldStatus = user.status;
  user.role = newRole;
  if (user.status === 'pending' || user.status === 'denied') {
    user.status = 'active';
  }
  await user.save();

  await audit.log('employee.roleChanged', actor, {
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, oldRole, newRole, oldStatus, newStatus: user.status },
  });

  return { id: user._id, email: user.email, role: user.role, status: user.status };
}

/**
 * Explicitly set a user's account status (active / pending / denied).
 */
async function setEmployeeStatus(userId, newStatus, { actor } = {}) {
  const validStatuses = ['active', 'pending', 'denied', 'suspended'];
  if (!validStatuses.includes(newStatus)) throw new Error(`Invalid status: ${newStatus}`);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const oldStatus = user.status;
  user.status = newStatus;
  await user.save();

  await audit.log('employee.statusChanged', actor, {
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, oldStatus, newStatus },
  });

  return { id: user._id, email: user.email, role: user.role, status: user.status };
}

/**
 * List user applications filtered by status.
 */
async function getApplications(status = 'pending') {
  const validStatuses = ['pending', 'active', 'denied'];
  const filter = validStatuses.includes(status) ? { status: { $eq: status } } : { status: { $eq: 'pending' } };
  return User.find(filter).select('email role status applicationNote profile.name createdAt').sort({ createdAt: -1 });
}

/**
 * Approve an application: set status to 'active' and assign a role.
 */
async function approveApplication(userId, role, { actor } = {}) {
  const validRoles = ['admin', 'manager', 'staff'];
  if (!validRoles.includes(role)) throw new Error(`Invalid role: ${role}`);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.status !== 'pending') throw new Error('User is not in pending status');
  user.status = 'active';
  user.role = role;
  await user.save();
  await audit.log('application.approved', actor, {
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, role },
  });
  return { id: user._id, email: user.email, role: user.role, status: user.status };
}

/**
 * Deny an application: set status to 'denied'.
 */
async function denyApplication(userId, { actor } = {}) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.status !== 'pending') throw new Error('User is not in pending status');
  user.status = 'denied';
  await user.save();
  await audit.log('application.denied', actor, {
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email },
  });
  return { id: user._id, email: user.email, status: user.status };
}

// ─── Custom Box Config ────────────────────────────────────────────────────────

async function getCustomBoxConfigs() {
  return CustomBoxConfig.find({}).sort({ createdAt: -1 });
}

async function createCustomBoxConfig({ name, size, discountPct, isActive }) {
  const config = new CustomBoxConfig({
    name: String(name).trim().slice(0, 100),
    size: Math.max(1, Math.floor(Number(size))),
    discountPct: Math.min(100, Math.max(0, Number(discountPct) || 0)),
    isActive: isActive !== false,
  });
  return config.save();
}

async function updateCustomBoxConfig(id, { name, size, discountPct, isActive }) {
  const config = await CustomBoxConfig.findById(id);
  if (!config) throw new Error('Box config not found');
  if (name !== undefined) config.name = String(name).trim().slice(0, 100);
  if (size !== undefined) config.size = Math.max(1, Math.floor(Number(size)));
  if (discountPct !== undefined) config.discountPct = Math.min(100, Math.max(0, Number(discountPct)));
  if (isActive !== undefined) config.isActive = Boolean(isActive);
  return config.save();
}

async function deleteCustomBoxConfig(id) {
  const result = await CustomBoxConfig.findByIdAndDelete(id);
  if (!result) throw new Error('Box config not found');
  return result;
}

module.exports = {
  getDashboard,
  getOrders,
  getInventory,
  adjustInventory,
  getEmployees,
  updateEmployeeRole,
  setEmployeeStatus,
  getApplications,
  approveApplication,
  denyApplication,
  getCustomBoxConfigs,
  createCustomBoxConfig,
  updateCustomBoxConfig,
  deleteCustomBoxConfig,
};
