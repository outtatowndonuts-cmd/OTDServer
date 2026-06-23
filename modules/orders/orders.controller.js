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

// --- API: Force-complete order (admin bypass, skips inventory check) ----------
exports.forceCompleteOrder = async function (req, res) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

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

// --- API: KPI Report ----------------------------------------------------------
exports.getKPIReport = async function (req, res) {
  try {
    const { Order } = require('./orders.model');
    
    // 1. Total Revenue & Sales Volume
    const revenueData = await Order.aggregate([
      { $match: { type: 'sale' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          minOrder: { $min: '$total' },
          maxOrder: { $max: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // 2. Order Count by Status
    const statusData = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Top Products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.priceSnapshot'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    // 4. Customer Metrics
    const customerData = await Order.aggregate([
      { $match: { type: 'sale' } },
      { $group: { _id: '$customerId', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } },
          avgOrdersPerCustomer: { $avg: '$orderCount' }
        }
      }
    ]);

    // 5. Payment Method Breakdown
    const paymentData = await Order.aggregate([
      { $match: { type: 'sale' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { count: -1 } }
    ]);

    // 6. Monthly Trends
    const timeData = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 7. Geographic Breakdown
    const geoData = await Order.aggregate([
      { $match: { 'shippingAddress.state': { $exists: true } } },
      { $group: { _id: '$shippingAddress.state', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 8. Fulfillment Status
    const fulfillmentData = await Order.aggregate([
      { $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 9. Order Type Breakdown
    const typeData = await Order.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      ok: true,
      kpi: {
        revenue: revenueData[0] || { totalRevenue: 0, avgOrderValue: 0, minOrder: 0, maxOrder: 0, totalOrders: 0 },
        statusBreakdown: statusData,
        topProducts,
        customers: customerData[0] || { totalCustomers: 0, repeatCustomers: 0, avgOrdersPerCustomer: 0 },
        paymentMethods: paymentData,
        monthlyTrends: timeData,
        geography: geoData,
        fulfillment: fulfillmentData,
        orderTypes: typeData
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
