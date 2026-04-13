/**
 * Shared Inventory Service
 *
 * Wraps the inventory module service for use by other modules (Admin, future systems).
 * Other modules should require this file instead of importing directly from /modules/inventory/.
 */
const inventoryService = require('../modules/inventory/inventory.service');

module.exports = {
  getInventory: inventoryService.getInventory,
  getInventoryItem: inventoryService.getInventoryItem,
  getInventoryItemById: inventoryService.getInventoryItemById,
  adjustStock: inventoryService.adjustStock,
  safeDeduct: inventoryService.safeDeduct,
  checkAvailability: inventoryService.checkAvailability,
  checkOrderAvailability: inventoryService.checkOrderAvailability,
  getBatches: inventoryService.getBatches,
  getBatchById: inventoryService.getBatchById,
};
