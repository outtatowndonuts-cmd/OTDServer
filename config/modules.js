// Register all modules here
const posRoutes = require('../modules/pos/pos.routes');
const recipesRoutes = require('../modules/recipes/recipes.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const commerceRoutes = require('../modules/commerce/commerce.routes');
module.exports = [posRoutes, recipesRoutes, ordersRoutes, inventoryRoutes, adminRoutes, commerceRoutes];
