/**
 * Shared Catalog Service
 *
 * Exposes read-only access to products and recipes for use by other modules
 * (Orders, POS, future systems). Other modules should require this file
 * instead of importing directly from /modules/recipes/.
 */
const recipesService = require('../modules/recipes/recipes.service');

module.exports = {
  getProducts: recipesService.getProducts,
  getProductById: recipesService.getProductById,
  getRecipes: recipesService.getRecipes,
  getRecipeById: recipesService.getRecipeById,
  getIngredients: recipesService.getIngredients,
  getIngredientById: recipesService.getIngredientById,
  getSupplies: recipesService.getSupplies,
  getSupplyById: recipesService.getSupplyById,
  getSuppliers: recipesService.getSuppliers,
  getSupplierById: recipesService.getSupplierById,
};
