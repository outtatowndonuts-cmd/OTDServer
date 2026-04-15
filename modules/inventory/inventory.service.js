const { InventoryItem, InventoryBatch, PurchaseOrder } = require('./inventory.model');
const { Order } = require('../orders/orders.model');
const eventBus = require('../../shared/eventBus');
const orderService = require('../../shared/order.service');
const catalog = require('../../shared/catalog.service');
const audit = require('../../shared/audit');
const units = require('../recipes/units');

/**
 * Convert a quantity from one unit to another, falling back to the raw quantity
 * with a warning if the units are incompatible (different families).
 */
function convertUnits(qty, fromUnit, toUnit, label) {
  if (!fromUnit || !toUnit || fromUnit.toLowerCase() === toUnit.toLowerCase()) return qty;
  const converted = units.convert(qty, fromUnit, toUnit);
  if (converted === null) {
    console.warn(`[Inventory] Unit mismatch for "${label}": cannot convert "${fromUnit}" → "${toUnit}", using raw quantity`);
    return qty;
  }
  return converted;
}

/**
 * Get inventory items with optional filters (kind).
 * Enriches items that are missing a unit by looking up the source record.
 */
async function getInventory(filters = {}) {
  const query = {};
  if (filters.kind) query.kind = filters.kind;
  const items = await InventoryItem.find(query).sort({ name: 1 });

  // Collect refIds by kind for items that are missing a unit
  const missingByKind = { ingredient: [], supply: [], kitchen: [] };
  for (const item of items) {
    if (!item.unit && item.kind !== 'product') {
      missingByKind[item.kind] = missingByKind[item.kind] || [];
      missingByKind[item.kind].push(item.refId);
    }
  }

  // Batch lookups only if needed
  const ingredientMap = {};
  const supplyMap = {};
  const recipeMap = {};

  if (missingByKind.ingredient && missingByKind.ingredient.length) {
    const ings = await catalog.getIngredients();
    for (const ing of ings) ingredientMap[ing._id.toString()] = ing.purchaseUnit || '';
  }
  if (missingByKind.supply && missingByKind.supply.length) {
    const sups = await catalog.getSupplies();
    for (const sup of sups) supplyMap[sup._id.toString()] = sup.unit || '';
  }
  if (missingByKind.kitchen && missingByKind.kitchen.length) {
    const recs = await catalog.getRecipes();
    for (const rec of recs) recipeMap[rec._id.toString()] = rec.yieldUnit || 'each';
  }

  // Apply enriched units to items and persist so future reads are instant
  const saves = [];
  for (const item of items) {
    if (item.unit) continue;
    let resolved = '';
    if (item.kind === 'ingredient') resolved = ingredientMap[item.refId.toString()] || '';
    else if (item.kind === 'supply') resolved = supplyMap[item.refId.toString()] || '';
    else if (item.kind === 'kitchen') resolved = recipeMap[item.refId.toString()] || 'each';
    else if (item.kind === 'product') resolved = 'each';
    if (resolved) {
      item.unit = resolved;
      saves.push(InventoryItem.updateOne({ _id: item._id }, { $set: { unit: resolved } }));
    }
  }
  if (saves.length) await Promise.all(saves);

  return items;
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
async function adjustStock({ kind, refId, name, quantityDelta, unit }) {
  const delta = Number(quantityDelta);
  if (Number.isNaN(delta)) {
    throw new Error('quantityDelta must be a valid number');
  }

  const setFields = { name, kind, refId };
  if (unit) setFields.unit = unit;

  // Aggregation pipeline update so we can atomically clamp quantity >= 0.
  // Prevents negative stock from sales racing ahead of available inventory.
  const item = await InventoryItem.findOneAndUpdate(
    { kind, refId },
    [
      {
        $set: {
          quantity: {
            $max: [0, { $add: [{ $ifNull: ['$quantity', 0] }, delta] }],
          },
          ...setFields,
        },
      },
    ],
    { upsert: true, new: true, updatePipeline: true },
  );

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
 * Check whether all items in an order can be fulfilled from current display-case stock.
 * For simple products: checks kind:'product' inventory for the product itself.
 * For bundle products: checks each component product's display-case stock.
 * Returns { available: true } or { available: false, shortages: [...] }.
 */
async function checkAvailability(items) {
  const shortages = [];

  for (const item of items) {
    const product = await catalog.getProductById(item.refId);
    if (!product) continue;

    if (product.productType === 'bundle') {
      // Bundle: each component product must have enough display-case stock
      for (const bi of product.bundleItems || []) {
        const needed = (bi.quantity || 1) * item.quantity;
        const inv = await InventoryItem.findOne({ kind: 'product', refId: bi.product });
        const available = inv ? inv.quantity : 0;
        if (available < needed) {
          const compProduct = await catalog.getProductById(bi.product);
          shortages.push({
            kind: 'product',
            refId: bi.product,
            name: compProduct ? compProduct.name : 'Unknown component',
            needed,
            available,
          });
        }
      }
    } else {
      // Simple product: check display-case stock directly
      const needed = item.quantity;
      const inv = await InventoryItem.findOne({ kind: 'product', refId: item.refId });
      const available = inv ? inv.quantity : 0;
      if (available < needed) {
        shortages.push({
          kind: 'product',
          refId: item.refId,
          name: product.name,
          needed,
          available,
        });
      }
    }
  }

  return shortages.length ? { available: false, shortages } : { available: true };
}

/**
 * Check whether all stock required to complete a given order is actually available.
 * Aggregates all deductions by (kind, refId) across all order items before querying,
 * so duplicate items are combined correctly.
 *
 * Handles all three order types:
 *   sale       – deducts kind:'product' (or bundle components) from display case
 *   assembly   – deducts kind:'kitchen' + finishing ingredients/supplies; bundle assembly deducts component products
 *   production – deducts kind:'ingredient' (raw inputs) + kind:'kitchen' (sub-recipe stock)
 *
 * Returns { available: true } or { available: false, shortages: [{kind, name, needed, available, unit}] }
 */
async function checkOrderAvailability(order) {
  if (!order || !order.items || !order.items.length) return { available: true };

  // Accumulate needed quantities keyed by "kind:refId" to merge duplicates
  const needed = {};
  function need(kind, refId, name, qty) {
    const key = `${kind}:${refId.toString()}`;
    if (!needed[key]) needed[key] = { kind, refId, name, needed: 0 };
    needed[key].needed += qty;
  }

  // ── Sale: deduct display-case product stock ──────────────────────────────
  if (order.type === 'sale') {
    for (const item of order.items) {
      const product = await catalog.getProductById(item.refId);
      if (!product) continue;
      if (product.productType === 'bundle') {
        for (const bi of product.bundleItems || []) {
          const compProduct = await catalog.getProductById(bi.product);
          need('product', bi.product, compProduct ? compProduct.name : 'Unknown component', (bi.quantity || 1) * item.quantity);
        }
      } else {
        need('product', item.refId, product.name, item.quantity);
      }
    }
  }

  // ── Assembly: deduct kitchen batches + finishing components (or bundle component products) ──
  if (order.type === 'assembly') {
    for (const item of order.items) {
      const product = await catalog.getProductById(item.refId);
      if (!product) continue;
      if (product.productType === 'bundle') {
        for (const bi of product.bundleItems || []) {
          const compProduct = await catalog.getProductById(bi.product);
          need('product', bi.product, compProduct ? compProduct.name : 'Unknown component', (bi.quantity || 1) * item.quantity);
        }
      } else {
        if (product.recipe) {
          const baseQty = Number(product.baseQty) || 1;
          const recipe = await catalog.getRecipeById(product.recipe);
          need('kitchen', product.recipe, recipe ? recipe.name : 'Kitchen batch', item.quantity * baseQty);
        }
        for (const fc of product.finishingComponents || []) {
          const qty = (fc.quantity || 0) * item.quantity;
          if (fc.type === 'Ingredient') {
            const ingredient = await catalog.getIngredientById(fc.ref);
            const name = ingredient ? ingredient.name : 'Unknown ingredient';
            const deductQty = convertUnits(qty, fc.unit, ingredient && ingredient.purchaseUnit, name);
            need('ingredient', fc.ref, name, deductQty);
          } else if (fc.type === 'Supply') {
            const supply = await catalog.getSupplyById(fc.ref);
            const name = supply ? supply.name : 'Unknown supply';
            const deductQty = convertUnits(qty, fc.unit, supply && supply.unit, name);
            need('supply', fc.ref, name, deductQty);
          } else if (fc.type === 'Prep') {
            const recipe = await catalog.getRecipeById(fc.ref);
            const name = recipe ? recipe.name : 'Unknown prep';
            const yieldUnit = (recipe && recipe.yieldUnit) || 'each';
            const deductQty = convertUnits(qty, fc.unit, yieldUnit, name);
            need('kitchen', fc.ref, name, deductQty);
          }
        }
      }
    }
  }

  // ── Production: deduct raw ingredients + sub-recipe kitchen stock ────────
  if (order.type === 'production') {
    for (const item of order.items) {
      const recipe = await catalog.getRecipeById(item.refId);
      if (!recipe) continue;
      const batchCount = item.quantity;
      for (const line of recipe.ingredients || []) {
        const { ingredient } = line;
        if (!ingredient) continue;
        const totalUsed = line.quantity * batchCount;
        const recipeUnit = (line.unit && line.unit.trim()) || ingredient.purchaseUnit;
        const deductQty = convertUnits(totalUsed, recipeUnit, ingredient.purchaseUnit, ingredient.name);
        need('ingredient', ingredient._id, ingredient.name, deductQty);
      }
      for (const sub of recipe.subRecipes || []) {
        const subRecipe = sub.recipe;
        if (!subRecipe) continue;
        const subId = subRecipe._id || subRecipe;
        const subName = typeof subRecipe === 'object' ? subRecipe.name : 'Sub-recipe';
        need('kitchen', subId, subName, sub.quantity * batchCount);
      }
    }
  }

  // ── Compare aggregated requirements against live stock ───────────────────
  const shortages = [];
  for (const entry of Object.values(needed)) {
    const inv = await InventoryItem.findOne({ kind: entry.kind, refId: entry.refId });
    const available = inv ? inv.quantity : 0;
    const unit = inv ? inv.unit || '' : '';
    if (available < entry.needed) {
      shortages.push({ kind: entry.kind, name: entry.name, needed: entry.needed, available, unit });
    }
  }

  return shortages.length ? { available: false, shortages } : { available: true };
}

// ─── Batch Operations ─────────────────────────────────────────────────────────

async function getBatches(filters = {}) {
  const query = {};
  if (filters.refId) query.refId = filters.refId;
  if (filters.status) query.status = filters.status;
  if (filters.batchKind) query.batchKind = filters.batchKind;
  return InventoryBatch.find(query).sort({ producedAt: 1 });
}

async function getBatchById(id) {
  return InventoryBatch.findById(id);
}

async function createBatch({ refId, name, orderId, producedQty, producedAt, shelfLifeDays, batchKind = 'kitchen', unit = '' }) {
  const batchData = {
    refId,
    name,
    orderId,
    producedQty,
    remainingQty: producedQty,
    unit,
    producedAt: producedAt || new Date(),
    status: 'active',
    batchKind,
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
 * batchKind: 'kitchen' (production output) or 'product' (assembled display-case stock)
 */
async function consumeFromBatches(refId, quantity, batchKind = 'kitchen') {
  let remaining = quantity;
  const batches = await InventoryBatch.find({ refId, batchKind, status: 'active' }).sort({ producedAt: 1 });

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

  // Recompute quantity from remaining active batches so the InventoryItem
  // stays in sync even if it drifted. This is authoritative — don't clamp.
  const activeBatches = await InventoryBatch.find({ refId: batch.refId, batchKind: batch.batchKind, status: 'active' });
  const remaining = activeBatches.reduce((sum, b) => sum + b.remainingQty, 0);
  // batchKind 'kitchen' → InventoryItem kind 'kitchen'; 'product' → 'product'
  const itemKind = batch.batchKind === 'product' ? 'product' : 'kitchen';
  await InventoryItem.findOneAndUpdate({ kind: itemKind, refId: batch.refId }, { $set: { quantity: Math.max(0, remaining) } });

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
    batch.remainingQty = 0;
    batch.status = 'culled';
    await batch.save();
    totalCulled += 1;
  }

  // Collect unique (refId, batchKind) pairs and recompute each InventoryItem
  const refKindPairs = [...new Map(expired.map((b) => [`${b.refId}:${b.batchKind}`, { refId: b.refId, batchKind: b.batchKind || 'kitchen' }])).values()];
  for (const { refId, batchKind } of refKindPairs) {
    const activeBatches = await InventoryBatch.find({ refId, batchKind, status: 'active' });
    const remaining = activeBatches.reduce((sum, b) => sum + b.remainingQty, 0);
    const itemKind = batchKind === 'product' ? 'product' : 'kitchen';
    await InventoryItem.findOneAndUpdate({ kind: itemKind, refId }, { $set: { quantity: Math.max(0, remaining) } });
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

  // ── Phase 1: Kitchen production ──────────────────────────────────────────
  // Production orders run a Recipe N times, producing kitchen batches.
  // Output goes to kind:'kitchen' inventory (NOT the display case).
  // Raw ingredients are deducted.
  if (order.type === 'production') {
    for (const item of order.items) {
      const recipe = await catalog.getRecipeById(item.refId); // fully populated
      const recipeYield = (recipe && recipe.yield) || 1;
      const batchCount = item.quantity; // number of recipe runs
      const totalProduced = batchCount * recipeYield;
      const name = recipe ? recipe.name : item.nameSnapshot;
      const shelfLifeDays = (recipe && recipe.shelfLifeDays) || 0;
      const kitchenUnit = (recipe && recipe.yieldUnit) || 'each';

      // 1. Add produced units to kitchen inventory
      await adjustStock({ kind: 'kitchen', refId: item.refId, name, quantityDelta: totalProduced, unit: kitchenUnit });

      // 2. Create kitchen batch record (for FIFO tracking + expiry)
      await createBatch({
        refId: item.refId,
        name,
        orderId: order._id,
        producedQty: totalProduced,
        producedAt: order.createdAt || new Date(),
        shelfLifeDays,
        batchKind: 'kitchen',
        unit: kitchenUnit,
      });

      if (!recipe) continue;

      // 3. Deduct raw ingredients consumed by this recipe run
      for (const line of recipe.ingredients || []) {
        const { ingredient } = line; // populated via getRecipeById
        if (!ingredient) continue;
        const totalUsed = line.quantity * batchCount;
        const recipeUnit = (line.unit && line.unit.trim()) || ingredient.purchaseUnit;
        const deductQty = convertUnits(totalUsed, recipeUnit, ingredient.purchaseUnit, ingredient.name);
        await adjustStock({
          kind: 'ingredient',
          refId: ingredient._id,
          name: ingredient.name,
          quantityDelta: -deductQty,
          unit: ingredient.purchaseUnit || '',
        });
      }

      // 4. Deduct sub-recipe kitchen stock consumed by this recipe
      // (e.g. a "Filled Donut" recipe that uses "Yeast Donut Base" as a sub-recipe)
      for (const sub of recipe.subRecipes || []) {
        const subRecipe = sub.recipe; // populated
        if (!subRecipe) continue;
        const subUsed = sub.quantity * batchCount;
        const subId = subRecipe._id || subRecipe;
        const subName = typeof subRecipe === 'object' ? subRecipe.name : 'Sub-recipe';
        const subYieldUnit = typeof subRecipe === 'object' ? subRecipe.yieldUnit || 'each' : 'each';
        await adjustStock({ kind: 'kitchen', refId: subId, name: subName, quantityDelta: -subUsed, unit: subYieldUnit });
        await consumeFromBatches(subId, subUsed, 'kitchen');
      }
    }
  }

  // ── Phase 2: Finishing / assembly ────────────────────────────────────────
  // Assembly orders pull from kitchen stock, add finishing touches, and
  // move finished products into the display-case (kind:'product') inventory.
  if (order.type === 'assembly') {
    for (const item of order.items) {
      const product = await catalog.getProductById(item.refId);
      if (!product) continue;

      if (product.productType === 'bundle') {
        // Bundles: deduct component products from display case, add bundle to display case
        for (const bi of product.bundleItems || []) {
          const compProduct = await catalog.getProductById(bi.product);
          const deductQty = (bi.quantity || 1) * item.quantity;
          const compName = compProduct ? compProduct.name : 'Unknown component';
          await adjustStock({ kind: 'product', refId: bi.product, name: compName, quantityDelta: -deductQty, unit: 'each' });
          await consumeFromBatches(bi.product, deductQty, 'product');
        }
        // Add assembled bundle units to display case
        await adjustStock({ kind: 'product', refId: item.refId, name: product.name, quantityDelta: item.quantity, unit: 'each' });
        await createBatch({
          refId: item.refId,
          name: product.name,
          orderId: order._id,
          producedQty: item.quantity,
          producedAt: order.createdAt || new Date(),
          batchKind: 'product',
          unit: 'each',
        });
      } else {
        // Simple product: pull from kitchen, add finishing components, add to display case
        const recipeId = product.recipe;
        if (recipeId) {
          const baseQty = Number(product.baseQty) || 1;
          const totalKitchenUnits = item.quantity * baseQty;
          const recipe = await catalog.getRecipeById(recipeId);
          const kitchenName = recipe ? recipe.name : 'Kitchen batch';
          const kitchenUnit = (recipe && recipe.yieldUnit) || 'each';
          await adjustStock({ kind: 'kitchen', refId: recipeId, name: kitchenName, quantityDelta: -totalKitchenUnits, unit: kitchenUnit });
          await consumeFromBatches(recipeId, totalKitchenUnits, 'kitchen');
        }

        // Deduct finishing ingredients and supplies
        for (const fc of product.finishingComponents || []) {
          const qty = (fc.quantity || 0) * item.quantity;
          if (fc.type === 'Ingredient') {
            const ingredient = await catalog.getIngredientById(fc.ref);
            const name = ingredient ? ingredient.name : 'Unknown ingredient';
            const deductQty = convertUnits(qty, fc.unit, ingredient && ingredient.purchaseUnit, name);
            await adjustStock({ kind: 'ingredient', refId: fc.ref, name, quantityDelta: -deductQty, unit: (ingredient && ingredient.purchaseUnit) || '' });
          } else if (fc.type === 'Supply') {
            const supply = await catalog.getSupplyById(fc.ref);
            const name = supply ? supply.name : 'Unknown supply';
            const deductQty = convertUnits(qty, fc.unit, supply && supply.unit, name);
            await adjustStock({ kind: 'supply', refId: fc.ref, name, quantityDelta: -deductQty, unit: (supply && supply.unit) || '' });
          } else if (fc.type === 'Prep') {
            const recipe = await catalog.getRecipeById(fc.ref);
            const name = recipe ? recipe.name : 'Unknown prep';
            const yieldUnit = (recipe && recipe.yieldUnit) || 'each';
            const deductQty = convertUnits(qty, fc.unit, yieldUnit, name);
            await adjustStock({ kind: 'kitchen', refId: fc.ref, name, quantityDelta: -deductQty, unit: yieldUnit });
            await consumeFromBatches(fc.ref, deductQty, 'kitchen');
          }
        }

        // Add finished products to display-case inventory
        await adjustStock({ kind: 'product', refId: item.refId, name: product.name, quantityDelta: item.quantity, unit: 'each' });
        await createBatch({
          refId: item.refId,
          name: product.name,
          orderId: order._id,
          producedQty: item.quantity,
          producedAt: order.createdAt || new Date(),
          batchKind: 'product',
          unit: 'each',
        });
      }
    }
  }

  // ── Sales: deduct from display case ──────────────────────────────────────
  // Sale orders simply remove finished products from the display-case inventory.
  // Bundle sales deduct each component product instead of the bundle itself.
  if (order.type === 'sale') {
    for (const item of order.items) {
      const product = await catalog.getProductById(item.refId);
      if (!product) continue;

      if (product.productType === 'bundle') {
        // Bundle sold: deduct component products from display case
        for (const bi of product.bundleItems || []) {
          const compProduct = await catalog.getProductById(bi.product);
          const deductQty = (bi.quantity || 1) * item.quantity;
          const compName = compProduct ? compProduct.name : 'Unknown component';
          await adjustStock({ kind: 'product', refId: bi.product, name: compName, quantityDelta: -deductQty, unit: 'each' });
          await consumeFromBatches(bi.product, deductQty, 'product');
        }
      } else {
        // Simple product: deduct from display-case inventory (FIFO)
        await adjustStock({ kind: 'product', refId: item.refId, name: product.name, quantityDelta: -item.quantity, unit: 'each' });
        await consumeFromBatches(item.refId, item.quantity, 'product');
      }
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
    if (!product) continue;

    if (product.productType === 'bundle') {
      // Restore each component product's display-case stock
      for (const bi of product.bundleItems || []) {
        const compProduct = await catalog.getProductById(bi.product);
        const restoreQty = (bi.quantity || 1) * item.quantity;
        const compName = compProduct ? compProduct.name : 'Unknown component';
        await adjustStock({ kind: 'product', refId: bi.product, name: compName, quantityDelta: restoreQty });
      }
    } else {
      // Simple product: restore display-case stock
      await adjustStock({ kind: 'product', refId: item.refId, name: product.name, quantityDelta: item.quantity });
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
  checkOrderAvailability,
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
