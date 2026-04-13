const path = require('path');
const fs = require('fs');
const adminService = require('./admin.service');
const audit = require('../../shared/audit');
const orderService = require('../../shared/order.service');

let htmlTemplate = null;
function getHtml() {
  if (!htmlTemplate || process.env.NODE_ENV !== 'production') {
    htmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  }
  return htmlTemplate;
}

/**
 * GET /admin
 * Serve the React SPA shell with CSRF token injected.
 */
exports.index = (req, res) => {
  let html = getHtml();
  const csrf = res.locals._csrf || '';
  const meta = `<meta name="csrf-token" content="${csrf}">`;
  html = html.replace('</head>', `${meta}\n</head>`);
  res.type('html').send(html);
};

/**
 * GET /admin/api/csrf
 */
exports.getCsrf = (req, res) => {
  res.json({ csrfToken: res.locals._csrf });
};

/**
 * GET /admin/api/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const data = await adminService.getDashboard();
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /admin/api/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const orders = await adminService.getOrders(req.query);
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /admin/api/inventory
 */
exports.getInventory = async (req, res) => {
  try {
    const items = await adminService.getInventory(req.query);
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /admin/api/employees
 */
exports.getEmployees = async (req, res) => {
  try {
    const employees = await adminService.getEmployees();
    res.json({ ok: true, employees });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/employees/:id/role
 */
exports.updateEmployeeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ ok: false, error: 'role is required' });
    const result = await adminService.updateEmployeeRole(req.params.id, role, { actor: req.user });
    res.json({ ok: true, employee: result });
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/employees/:id/status
 */
exports.setEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ ok: false, error: 'status is required' });
    const result = await adminService.setEmployeeStatus(req.params.id, status, { actor: req.user });
    res.json({ ok: true, employee: result });
  } catch (err) {
    const httpStatus = err.message === 'User not found' ? 404 : 400;
    res.status(httpStatus).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/inventory/adjust
 */
exports.adjustInventory = async (req, res) => {
  try {
    const { kind, refId, name, quantityDelta } = req.body;
    if (!kind || !refId || !name || quantityDelta == null) {
      return res.status(400).json({ ok: false, error: 'kind, refId, name, and quantityDelta are required' });
    }
    const item = await adminService.adjustInventory({ kind, refId, name, quantityDelta });
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

/**
 * GET /admin/api/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await audit.getAuditLogs(req.query);
    res.json({ ok: true, logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /admin/api/applications
 */
exports.getApplications = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const applications = await adminService.getApplications(status);
    res.json({ ok: true, applications });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/applications/:id/approve
 */
exports.approveApplication = async (req, res) => {
  try {
    const role = req.body.role || 'staff';
    const result = await adminService.approveApplication(req.params.id, role, { actor: req.user });
    res.json({ ok: true, user: result });
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/applications/:id/deny
 */
exports.denyApplication = async (req, res) => {
  try {
    const result = await adminService.denyApplication(req.params.id, { actor: req.user });
    res.json({ ok: true, user: result });
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ ok: false, error: err.message });
  }
};

/**
 * GET /admin/api/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await orderService.getSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const settings = await orderService.updateSettings(req.body);
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// ─── Custom Box Config ────────────────────────────────────────────────────────

/**
 * GET /admin/api/custom-boxes
 */
exports.getCustomBoxConfigs = async (req, res) => {
  try {
    const configs = await adminService.getCustomBoxConfigs();
    res.json({ ok: true, configs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/custom-boxes
 */
exports.createCustomBoxConfig = async (req, res) => {
  try {
    const config = await adminService.createCustomBoxConfig(req.body);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /admin/api/custom-boxes/:id
 */
exports.updateCustomBoxConfig = async (req, res) => {
  try {
    const config = await adminService.updateCustomBoxConfig(req.params.id, req.body);
    res.json({ ok: true, config });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ ok: false, error: err.message });
  }
};

/**
 * DELETE /admin/api/custom-boxes/:id
 */
exports.deleteCustomBoxConfig = async (req, res) => {
  try {
    await adminService.deleteCustomBoxConfig(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ ok: false, error: err.message });
  }
};
