const express = require('express');
const router = express.Router();
const controller = require('./orders.controller');
const { isAuthenticated } = require('../../config/passport');
const { requireRole } = require('../../shared/requireRole');

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
router.get('/', isAuthenticated, controller.getDashboard);

// ─── HTML Fragment Routes (AJAX partials, no layout) ─────────────────────────
router.get('/fragments/all', isAuthenticated, controller.fragmentAllOrders);
router.get('/fragments/sales', isAuthenticated, controller.fragmentSalesOrders);
router.get('/fragments/production', isAuthenticated, controller.fragmentProductionOrders);
router.get('/fragments/new', isAuthenticated, controller.fragmentNewOrder);
router.get('/fragments/:id/detail', isAuthenticated, controller.fragmentOrderDetail);
router.get('/fragments/settings', isAuthenticated, controller.fragmentSettings);

// ─── API Routes (return JSON) ─────────────────────────────────────────────────
router.post('/', isAuthenticated, controller.createOrder);
router.post('/settings', isAuthenticated, requireRole('admin', 'manager'), controller.updateSettings);
router.get('/api', isAuthenticated, controller.listOrders);
router.get('/api/:id', isAuthenticated, controller.getOrder);
router.post('/:id/complete', isAuthenticated, controller.completeOrder);
router.post('/:id/cancel', isAuthenticated, requireRole('admin', 'manager'), controller.cancelOrder);
router.post('/:id/refund', isAuthenticated, requireRole('admin', 'manager'), controller.refundOrder);

module.exports = { basePath: '/orders', router };
