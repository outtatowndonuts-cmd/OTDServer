const { InventoryItem, InventoryBatch, PurchaseOrder } = require('./inventory.model');
const { Order } = require('../orders/orders.model');
const eventBus = require('../../shared/eventBus');
const orderService = require('../../shared/order.service');
const catalog = require('../../shared/catalog.service');
const audit = require('../../shared/audit');

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

  if (item.quantity < 0) {
    console.warn('[Inventory] Negative stock: %s %s (refId: %s) = %d', kind, name, refId, item.quantity);
  }

  return item;
}

/**
 * Atomically deduct stock only if sufficient quantity exists.
 * Returns null if insufficient stock (caller decides how to handle).
 */
async function safeDeduct({ kind, refId, name, quantity }) {
  const qty = Math.abs(Number(quantity));
  if (Number.isNaN(qty) || qty <= 0) {
    throw new Error('quantity must be a positive number');
  }

  const item = await InventoryItem.findOneAndUpdate({ kind, refId, quantity: { $gte: qty } }, { $inc: { quantity: -qty }, $set: { name } }, { new: true });

  return item; // null if insufficient stock
}

/**
 * Check whether all items in an order can be fulfilled from current stock.
 * Returns { available: true } or { available: false, shortages: [...] }.
 */
async function checkAvailability(items) {
  const shortages = [];

  for (const item of items) {
    const product = await catalog.getProductById(item.refId);
    if (!product || !product.components || !product.components.length) continue;

    for (const comp of product.components) {
      const needed = comp.quantity * item.quantity;
      let kind;
      if (comp.type === 'Recipe') kind = 'product';
      else if (comp.type === 'Ingredient') kind = 'ingredient';
      else if (comp.type === 'Supply') kind = 'supply';
      else continue;

      const inv = await InventoryItem.findOne({ kind, refId: comp.ref });
      const available = inv ? inv.quantity : 0;
      if (available < needed) {
        const ref = await (kind === 'product' ? catalog.getRecipeById(comp.ref) : kind === 'ingredient' ? catalog.getIngredientById(comp.ref) : catalog.getSupplyById(comp.ref));
        shortages.push({
          kind,
          refId: comp.ref,
          name: ref ? ref.name : 'Unknown',
          needed,
          available,
        });
      }
    }
  }

  return shortages.length ? { available: false, shortages } : { available: true };
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

async function handleOrderCompleted(order, { skipIdempotencyCheck = false } = {}) {
  if (!order || !order.items || !order.items.length) return;

  // Idempotency guard: atomically claim processing rights for this order.
  // syncFromOrders() passes skipIdempotencyCheck=true since it rebuilds from scratch.
  if (!skipIdempotencyCheck) {
    const claimed = await Order.findOneAndUpdate({ _id: order._id, inventoryProcessed: { $ne: true } }, { $set: { inventoryProcessed: true } });
    if (!claimed) return; // already processed
  }

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

eventBus.on('order.refunded', (order) => {
  handleOrderRefunded(order).catch((err) => {
    console.error('[Inventory] Failed to handle order.refunded:', err);
  });
});

/**
 * Reverse inventory deductions for a refunded sale order.
 * Only reverses if the order was previously inventory-processed.
 */
async function handleOrderRefunded(order) {
  if (!order || order.type !== 'sale' || !order.items || !order.items.length) return;

  // Only reverse if inventory was actually deducted
  const claimed = await Order.findOneAndUpdate({ _id: order._id, inventoryProcessed: true }, { $set: { inventoryProcessed: false } });
  if (!claimed) return; // inventory was never deducted

  for (const item of order.items) {
    const product = await catalog.getProductById(item.refId);
    if (!product || !product.components || !product.components.length) continue;

    for (const comp of product.components) {
      const delta = comp.quantity * item.quantity; // positive: restoring stock

      if (comp.type === 'Recipe') {
        const recipe = await catalog.getRecipeById(comp.ref);
        const name = recipe ? recipe.name : 'Unknown recipe';
        await adjustStock({ kind: 'product', refId: comp.ref, name, quantityDelta: delta });
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

  await audit.log('inventory.refund_reversed', null, {
    targetType: 'Order',
    targetId: order._id,
    details: { itemCount: order.items.length },
  });
}

/**
 * Rebuild inventory and batches from all completed orders.
 * Resets inventoryProcessed flags since we rebuild from scratch.
 */
async function syncFromOrders() {
  await InventoryItem.deleteMany({});
  await InventoryBatch.deleteMany({});
  await Order.updateMany({ inventoryProcessed: true }, { $set: { inventoryProcessed: false } });
  const orders = await orderService.getOrders({ status: 'completed' });
  for (const order of orders) {
    await handleOrderCompleted(order, { skipIdempotencyCheck: true });
  }
  await Order.updateMany({ _id: { $in: orders.map((o) => o._id) } }, { $set: { inventoryProcessed: true } });
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
  safeDeduct,
  checkAvailability,
  getBatches,
  getBatchById,
  createBatch,
  consumeFromBatches,
  cullBatch,
  cullExpired,
  handleOrderCompleted,
  handleOrderRefunded,
  syncFromOrders,
  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
};
