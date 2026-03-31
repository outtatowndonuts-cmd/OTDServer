// Register all modules here
const posRoutes = require('../modules/pos/pos.routes');
const recipesRoutes = require('../modules/recipes/recipes.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
module.exports = [posRoutes, recipesRoutes, ordersRoutes];
