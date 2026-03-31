const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');
const { isAuthenticated } = require('../../config/passport');

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
router.get('/', isAuthenticated, controller.getDashboard);

// ─── HTML Fragment Routes (AJAX partials, no layout) ─────────────────────────
router.get('/fragments/all', isAuthenticated, controller.fragmentList);
router.get('/fragments/products', isAuthenticated, (req, res) => {
  req.query.kind = 'product';
  controller.fragmentList(req, res);
});
router.get('/fragments/ingredients', isAuthenticated, (req, res) => {
  req.query.kind = 'ingredient';
  controller.fragmentList(req, res);
});
router.get('/fragments/supplies', isAuthenticated, (req, res) => {
  req.query.kind = 'supply';
  controller.fragmentList(req, res);
});
router.get('/fragments/batches', isAuthenticated, controller.fragmentBatches);
router.get('/fragments/batches/active', isAuthenticated, (req, res) => {
  req.query.status = 'active';
  controller.fragmentBatches(req, res);
});
router.get('/fragments/batches/culled', isAuthenticated, (req, res) => {
  req.query.status = 'culled';
  controller.fragmentBatches(req, res);
});

// ─── API Routes (return JSON) ─────────────────────────────────────────────────
router.get('/api', isAuthenticated, controller.listInventory);
router.get('/api/:id', isAuthenticated, controller.getInventoryItem);
router.post('/adjust', isAuthenticated, controller.adjustStock);
router.post('/sync', isAuthenticated, controller.syncFromOrders);
router.post('/batches/:id/cull', isAuthenticated, controller.cullBatch);
router.post('/cull-expired', isAuthenticated, controller.cullExpired);

// ─── Purchase Order Fragments ─────────────────────────────────────────────────
router.get('/fragments/purchase-orders', isAuthenticated, controller.fragmentPurchaseOrders);
router.get('/fragments/purchase-orders/draft', isAuthenticated, (req, res) => {
  req.query.status = 'draft';
  controller.fragmentPurchaseOrders(req, res);
});
router.get('/fragments/purchase-orders/ordered', isAuthenticated, (req, res) => {
  req.query.status = 'ordered';
  controller.fragmentPurchaseOrders(req, res);
});
router.get('/fragments/purchase-orders/received', isAuthenticated, (req, res) => {
  req.query.status = 'received';
  controller.fragmentPurchaseOrders(req, res);
});
router.get('/fragments/purchase-orders/new', isAuthenticated, controller.fragmentNewPurchaseOrder);
router.get('/fragments/purchase-orders/:id/detail', isAuthenticated, controller.fragmentPurchaseOrderDetail);

// ─── Purchase Order API ───────────────────────────────────────────────────────
router.post('/purchase-orders', isAuthenticated, controller.createPurchaseOrder);
router.post('/purchase-orders/:id/status', isAuthenticated, controller.updatePurchaseOrderStatus);

module.exports = { basePath: '/inventory', router };
