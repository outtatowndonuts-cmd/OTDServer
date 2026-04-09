const path = require('path');
const service = require('./inventory.service');
const catalog = require('../../shared/catalog.service');
const audit = require('../../shared/audit');

const VIEWS = path.join(__dirname, 'views');

function frag(res, view, data) {
  res.render(path.join(VIEWS, view), Object.assign({}, data, { layout: false }));
}

// --- Dashboard Shell ----------------------------------------------------------
exports.getDashboard = function (req, res) {
  res.render(path.join(VIEWS, 'dashboard.pug'), { title: 'Inventory' });
};

// --- Fragment: Inventory list -------------------------------------------------
exports.fragmentList = async function (req, res) {
  try {
    const filters = {};
    if (req.query.kind) filters.kind = req.query.kind;
    const items = await service.getInventory(filters);
    frag(res, 'list.pug', { items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: List inventory items ------------------------------------------------
exports.listInventory = async function (req, res) {
  try {
    const filters = {};
    if (req.query.kind) filters.kind = req.query.kind;
    const items = await service.getInventory(filters);
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Get inventory item by ID -------------------------------------------
exports.getInventoryItem = async function (req, res) {
  try {
    const item = await service.getInventoryItemById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Manual stock adjustment (admin) ------------------------------------
exports.adjustStock = async function (req, res) {
  try {
    const { kind, refId, name, quantityDelta } = req.body;
    if (!kind || !refId || !name || quantityDelta == null) {
      return res.status(400).json({ ok: false, error: 'kind, refId, name, and quantityDelta are required' });
    }
    const item = await service.adjustStock({ kind, refId, name, quantityDelta });
    await audit.log('inventory.adjusted', req.user, {
      targetType: 'InventoryItem',
      targetId: item._id,
      details: { kind, refId, name, quantityDelta: Number(quantityDelta), newQuantity: item.quantity },
    });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- API: Sync inventory from completed orders --------------------------------
exports.syncFromOrders = async function (req, res) {
  try {
    const result = await service.syncFromOrders();
    res.json({ ok: true, ordersProcessed: result.synced });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Batch list -----------------------------------------------------
exports.fragmentBatches = async function (req, res) {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    const batches = await service.getBatches(filters);
    frag(res, 'batches.pug', { batches, filterStatus: req.query.status || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Cull a specific batch -----------------------------------------------
exports.cullBatch = async function (req, res) {
  try {
    const result = await service.cullBatch(req.params.id);
    res.json({ ok: true, writeOff: result.writeOff });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- API: Auto-cull expired batches -------------------------------------------
exports.cullExpired = async function (req, res) {
  try {
    const result = await service.cullExpired();
    res.json({ ok: true, culled: result.culled });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ─── Purchase Order Fragments ─────────────────────────────────────────────────

exports.fragmentPurchaseOrders = async function (req, res) {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    const purchaseOrders = await service.getPurchaseOrders(filters);
    frag(res, 'purchase-orders/list.pug', { purchaseOrders, filterStatus: req.query.status || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.fragmentNewPurchaseOrder = async function (req, res) {
  try {
    const [suppliers, supplies, ingredients] = await Promise.all([catalog.getSuppliers(), catalog.getSupplies(), catalog.getIngredients()]);
    frag(res, 'purchase-orders/form.pug', {
      _csrf: req.csrfToken(),
      suppliers: JSON.stringify(suppliers.map((s) => ({ _id: s._id, name: s.name }))),
      supplies: JSON.stringify(supplies.map((s) => ({ _id: s._id, name: s.name, costPerUnit: s.costPerUnit || 0, unit: s.unit || '' }))),
      ingredients: JSON.stringify(ingredients.map((i) => ({ _id: i._id, name: i.name, purchaseCost: i.purchaseCost || 0, purchaseUnit: i.purchaseUnit || '' }))),
      prefill: null,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.fragmentLowStockPO = async function (req, res) {
  try {
    const [suppliers, supplies, ingredients, inventory] = await Promise.all([catalog.getSuppliers(), catalog.getSupplies(), catalog.getIngredients(), service.getInventory({ kind: 'ingredient' })]);

    // Build a qty map from live inventory
    const qtyMap = {};
    for (const item of inventory) {
      qtyMap[item.refId.toString()] = item.quantity;
    }

    // An ingredient is low-stock when quantity <= reorderLevel (or <= 0 if no reorderLevel)
    const lowStock = ingredients
      .filter((ing) => {
        const qty = qtyMap[ing._id.toString()] ?? 0;
        const threshold = ing.reorderLevel != null ? ing.reorderLevel : 0;
        return qty <= threshold;
      })
      .map((ing) => ({
        _id: ing._id,
        name: ing.name,
        purchaseCost: ing.purchaseCost || 0,
        purchaseUnit: ing.purchaseUnit || '',
        currentQty: qtyMap[ing._id.toString()] ?? 0,
        reorderLevel: ing.reorderLevel ?? 0,
      }));

    frag(res, 'purchase-orders/form.pug', {
      _csrf: req.csrfToken(),
      suppliers: JSON.stringify(suppliers.map((s) => ({ _id: s._id, name: s.name }))),
      supplies: JSON.stringify(supplies.map((s) => ({ _id: s._id, name: s.name, costPerUnit: s.costPerUnit || 0, unit: s.unit || '' }))),
      ingredients: JSON.stringify(ingredients.map((i) => ({ _id: i._id, name: i.name, purchaseCost: i.purchaseCost || 0, purchaseUnit: i.purchaseUnit || '' }))),
      prefill: JSON.stringify(lowStock),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.fragmentPurchaseOrderDetail = async function (req, res) {
  try {
    const po = await service.getPurchaseOrderById(req.params.id);
    if (!po) return res.status(404).send('<div class="alert alert-danger">Purchase order not found.</div>');
    frag(res, 'purchase-orders/detail.pug', { po });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ─── Purchase Order API ───────────────────────────────────────────────────────

exports.createPurchaseOrder = async function (req, res) {
  try {
    const po = await service.createPurchaseOrder(req.body);
    res.status(201).json({ ok: true, po });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updatePurchaseOrderStatus = async function (req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ ok: false, error: 'status is required' });
    const po = await service.updatePurchaseOrderStatus(req.params.id, status);
    res.json({ ok: true, po });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
