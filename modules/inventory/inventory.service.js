const { InventoryItem, InventoryBatch, PurchaseOrder } = require('./inventory.model');
const eventBus = require('../../shared/eventBus');
const orderService = require('../../shared/order.service');
const catalog = require('../../shared/catalog.service');

/**
 * Get inventory items with optional filters (kind).
 */
async function getInventory(filters = {}) {
  const query = {};
  if (filters.kind) query.kind = filters.kind;
  return InventoryItem.find(query).sort({ name: 1 });
}

async function getInventoryItem(refId) {
  return InventoryItem.findOne({ refId });
}

async function getInventoryItemById(id) {
  return InventoryItem.findById(id);
}

/**
 * Adjust stock for a given item. Creates the item if it does not exist.
 */
async function adjustStock({ kind, refId, name, quantityDelta }) {
  const delta = Number(quantityDelta);
  if (Number.isNaN(delta)) {
    throw new Error('quantityDelta must be a valid number');
  }

  const item = await InventoryItem.findOneAndUpdate(
    { kind, refId },
    {
      $inc: { quantity: delta },
      $set: { name },
      $setOnInsert: { kind, refId },
    },
    { upsert: true, new: true },
  );

  if (Number.isNaN(item.quantity)) {
    item.quantity = 0;
    await item.save();
  }

  return item;
}

// ─── Batch Operations ─────────────────────────────────────────────────────────

async function getBatches(filters = {}) {
  const query = {};
  if (filters.refId) query.refId = filters.refId;
  if (filters.status) query.status = filters.status;
  return InventoryBatch.find(query).sort({ producedAt: 1 });
}

async function getBatchById(id) {
  return InventoryBatch.findById(id);
}

async function createBatch({ refId, name, orderId, producedQty, producedAt, shelfLifeDays }) {
  const batchData = {
    refId,
    name,
    orderId,
    producedQty,
    remainingQty: producedQty,
    producedAt: producedAt || new Date(),
    status: 'active',
  };

  if (shelfLifeDays && shelfLifeDays > 0) {
    const expiry = new Date(batchData.producedAt);
    expiry.setDate(expiry.getDate() + shelfLifeDays);
    batchData.expiresAt = expiry;
  }

  return InventoryBatch.create(batchData);
}

/**
 * Consume from the oldest active batches (FIFO).
 */
async function consumeFromBatches(refId, quantity) {
  let remaining = quantity;
  const batches = await InventoryBatch.find({ refId, status: 'active' }).sort({ producedAt: 1 });

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remainingQty, remaining);
    batch.remainingQty -= take;
    remaining -= take;
    if (batch.remainingQty <= 0) {
      batch.remainingQty = 0;
      batch.status = 'depleted';
    }
    await batch.save();
  }

  return quantity - remaining;
}

/**
 * Manually cull a specific batch — write off remaining stock.
 */
async function cullBatch(batchId) {
  const batch = await InventoryBatch.findById(batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.status !== 'active') throw new Error(`Batch is already ${batch.status}`);

  const writeOff = batch.remainingQty;
  batch.remainingQty = 0;
  batch.status = 'culled';
  await batch.save();

  await adjustStock({ kind: 'product', refId: batch.refId, name: batch.name, quantityDelta: -writeOff });
  return { batch, writeOff };
}

/**
 * Auto-cull all active batches past their expiresAt date.
 */
async function cullExpired() {
  const now = new Date();
  const expired = await InventoryBatch.find({ status: 'active', expiresAt: { $lte: now } });

  let totalCulled = 0;
  for (const batch of expired) {
    const writeOff = batch.remainingQty;
    batch.remainingQty = 0;
    batch.status = 'culled';
    await batch.save();
    await adjustStock({ kind: 'product', refId: batch.refId, name: batch.name, quantityDelta: -writeOff });
    totalCulled += 1;
  }

  return { culled: totalCulled };
}

// ─── Order Event Handler ──────────────────────────────────────────────────────

async function handleOrderCompleted(order) {
  if (!order || !order.items || !order.items.length) return;

  if (order.type === 'sale') {
    for (const item of order.items) {
      const product = await catalog.getProductById(item.refId);
      if (!product || !product.components || !product.components.length) continue;

      for (const comp of product.components) {
        const delta = -(comp.quantity * item.quantity);

        if (comp.type === 'Recipe') {
          const recipe = await catalog.getRecipeById(comp.ref);
          const name = recipe ? recipe.name : 'Unknown recipe';
          await adjustStock({ kind: 'product', refId: comp.ref, name, quantityDelta: delta });
          await consumeFromBatches(comp.ref, comp.quantity * item.quantity);
        } else if (comp.type === 'Ingredient') {
          const ingredient = await catalog.getIngredientById(comp.ref);
          const name = ingredient ? ingredient.name : 'Unknown ingredient';
          await adjustStock({ kind: 'ingredient', refId: comp.ref, name, quantityDelta: delta });
        } else if (comp.type === 'Supply') {
          const supply = await catalog.getSupplyById(comp.ref);
          const name = supply ? supply.name : 'Unknown supply';
          await adjustStock({ kind: 'supply', refId: comp.ref, name, quantityDelta: delta });
        }
      }
    }
  }

  if (order.type === 'production') {
    for (const item of order.items) {
      const recipe = await catalog.getRecipeById(item.refId);
      const recipeYield = (recipe && recipe.yield) || 1;
      const delta = item.quantity * recipeYield;
      const name = recipe ? recipe.name : item.nameSnapshot;
      const shelfLifeDays = (recipe && recipe.shelfLifeDays) || 0;

      await adjustStock({ kind: 'product', refId: item.refId, name, quantityDelta: delta });

      await createBatch({
        refId: item.refId,
        name,
        orderId: order._id,
        producedQty: delta,
        producedAt: order.createdAt || new Date(),
        shelfLifeDays,
      });
    }
  }
}

// ─── Event Subscription ───────────────────────────────────────────────────────
eventBus.on('order.completed', (order) => {
  handleOrderCompleted(order).catch((err) => {
    console.error('[Inventory] Failed to handle order.completed:', err);
  });
});

/**
 * Rebuild inventory and batches from all completed orders.
 */
async function syncFromOrders() {
  await InventoryItem.deleteMany({});
  await InventoryBatch.deleteMany({});
  const orders = await orderService.getOrders({ status: 'completed' });
  for (const order of orders) {
    await handleOrderCompleted(order);
  }
  return { synced: orders.length };
}

// ─── Purchase Order Operations ────────────────────────────────────────────────

async function getPurchaseOrders(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  return PurchaseOrder.find(query).sort({ createdAt: -1 });
}

async function getPurchaseOrderById(id) {
  return PurchaseOrder.findById(id);
}

async function createPurchaseOrder(data) {
  if (!data.supplierName) throw new Error('Supplier name is required');
  if (!data.items || !data.items.length) throw new Error('At least one item is required');

  let subtotal = 0;
  for (const item of data.items) {
    if (!item.kind || !item.refId || !item.name) {
      throw new Error('Each item must have kind, refId, and name');
    }
    item.quantity = parseFloat(item.quantity) || 0;
    item.unitCost = parseFloat(item.unitCost) || 0;
    item.totalCost = item.quantity * item.unitCost;
    subtotal += item.totalCost;
  }

  return PurchaseOrder.create({
    supplier: data.supplier || undefined,
    supplierName: data.supplierName,
    items: data.items,
    subtotal,
    status: 'draft',
    notes: data.notes || '',
  });
}

async function updatePurchaseOrderStatus(id, newStatus) {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw new Error('Purchase order not found');

  const validTransitions = {
    draft: ['ordered', 'cancelled'],
    ordered: ['received', 'cancelled'],
  };

  const allowed = validTransitions[po.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from "${po.status}" to "${newStatus}"`);
  }

  po.status = newStatus;
  if (newStatus === 'ordered') po.orderedAt = new Date();
  if (newStatus === 'received') {
    po.receivedAt = new Date();
    await receivePurchaseOrder(po);
  }

  await po.save();
  return po;
}

/**
 * When a PO is received, add quantities to inventory for each line item.
 */
async function receivePurchaseOrder(po) {
  for (const item of po.items) {
    await adjustStock({
      kind: item.kind,
      refId: item.refId,
      name: item.name,
      quantityDelta: item.quantity,
    });
  }
  eventBus.emit('purchaseorder.received', po);
}

module.exports = {
  getInventory,
  getInventoryItem,
  getInventoryItemById,
  adjustStock,
  getBatches,
  getBatchById,
  createBatch,
  consumeFromBatches,
  cullBatch,
  cullExpired,
  handleOrderCompleted,
  syncFromOrders,
  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
};
