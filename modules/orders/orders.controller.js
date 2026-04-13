const path = require('path');
const service = require('./orders.service');
const catalog = require('../../shared/catalog.service');
const inventoryService = require('../../shared/inventory.service');

const VIEWS = path.join(__dirname, 'views');

function csrf(req) {
  return req.csrfToken ? req.csrfToken() : '';
}

function frag(res, view, data, _csrf) {
  res.render(path.join(VIEWS, view), Object.assign({}, data, { layout: false, _csrf }));
}

// --- Dashboard Shell ----------------------------------------------------------
exports.getDashboard = function (req, res) {
  res.render(path.join(VIEWS, 'dashboard.pug'), { title: 'Orders' });
};

// --- Fragment: All Orders list ------------------------------------------------
exports.fragmentAllOrders = async function (req, res) {
  try {
    const orders = await service.getOrders();
    frag(res, 'orders/list.pug', { orders }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Sales list -----------------------------------------------------
exports.fragmentSalesOrders = async function (req, res) {
  try {
    const orders = await service.getOrders({ type: 'sale' });
    frag(res, 'orders/list.pug', { orders, filterType: 'sale' }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Production list ------------------------------------------------
exports.fragmentProductionOrders = async function (req, res) {
  try {
    const orders = await service.getOrders({ type: 'production' });
    frag(res, 'orders/list.pug', { orders, filterType: 'production' }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Assembly list -------------------------------------------------
exports.fragmentAssemblyOrders = async function (req, res) {
  try {
    const orders = await service.getOrders({ type: 'assembly' });
    frag(res, 'orders/list.pug', { orders, filterType: 'assembly' }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: New order form -------------------------------------------------
exports.fragmentNewOrder = async function (req, res) {
  try {
    const [products, recipes, settings, kitchenItems] = await Promise.all([catalog.getProducts(), catalog.getRecipes(), service.getSettings(), inventoryService.getInventory({ kind: 'kitchen' })]);
    frag(res, 'orders/form.pug', { item: null, products, recipes, settings, kitchenItems }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Order detail ---------------------------------------------------
exports.fragmentOrderDetail = async function (req, res) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).send('Not found');
    frag(res, 'orders/detail.pug', { order }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Create order --------------------------------------------------------
exports.createOrder = async function (req, res) {
  try {
    const order = await service.createOrder(req.body);
    res.json({ ok: true, id: order._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- API: List orders ---------------------------------------------------------
exports.listOrders = async function (req, res) {
  try {
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.source) filters.source = req.query.source;
    if (req.query.status) filters.status = req.query.status;
    const orders = await service.getOrders(filters);
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Get order by ID -----------------------------------------------------
exports.getOrder = async function (req, res) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Complete order ------------------------------------------------------
exports.completeOrder = async function (req, res) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    const avail = await inventoryService.checkOrderAvailability(order);
    if (!avail.available) {
      const lines = avail.shortages.map((s) => {
        const u = s.unit ? ` ${s.unit}` : '';
        const needed = Number.isInteger(s.needed) ? s.needed : +s.needed.toFixed(3);
        const have = Number.isInteger(s.available) ? s.available : +s.available.toFixed(3);
        return `- ${s.name} (${s.kind}): need ${needed}${u}, have ${have}${u}`;
      });
      return res.status(400).json({ ok: false, error: `Insufficient stock:\n${lines.join('\n')}` });
    }

    const completed = await service.completeOrder(req.params.id);
    res.json({ ok: true, order: completed });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- API: Cancel order --------------------------------------------------------
exports.cancelOrder = async function (req, res) {
  try {
    const { reason } = req.body;
    const order = await service.cancelOrder(req.params.id, { reason, user: req.user });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- API: Refund order --------------------------------------------------------
exports.refundOrder = async function (req, res) {
  try {
    const order = await service.refundOrder(req.params.id, { user: req.user });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Fragment: Settings -------------------------------------------------------
exports.fragmentSettings = async function (req, res) {
  try {
    const settings = await service.getSettings();
    frag(res, 'settings/form.pug', { item: settings }, csrf(req));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// --- API: Update settings -----------------------------------------------------
exports.updateSettings = async function (req, res) {
  try {
    await service.updateSettings(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
