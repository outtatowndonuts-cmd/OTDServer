// Register all modules here
const posRoutes = require('../modules/pos/pos.routes');
const recipesRoutes = require('../modules/recipes/recipes.routes');
module.exports = [posRoutes, recipesRoutes];
