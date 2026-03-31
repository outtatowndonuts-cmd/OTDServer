const path = require('path');
const fs = require('fs');
const adminService = require('./admin.service');

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
    const result = await adminService.updateEmployeeRole(req.params.id, role);
    res.json({ ok: true, employee: result });
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ ok: false, error: err.message });
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
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
