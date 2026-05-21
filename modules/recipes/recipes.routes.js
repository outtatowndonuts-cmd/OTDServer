const express = require('express');
const router = express.Router();
const controller = require('./recipes.controller');
const { isAuthenticated } = require('../../config/passport');

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
router.get('/', isAuthenticated, controller.getDashboard);

// ─── HTML Fragment Routes (AJAX partials, no layout) ─────────────────────────
router.get('/fragments/ingredients', isAuthenticated, controller.fragmentIngredientsList);
router.get('/fragments/ingredients/new', isAuthenticated, controller.fragmentIngredientsNew);
router.get('/fragments/ingredients/:id/edit', isAuthenticated, controller.fragmentIngredientsEdit);

router.get('/fragments/recipes', isAuthenticated, controller.fragmentRecipesList);
router.get('/fragments/recipes/new', isAuthenticated, controller.fragmentRecipesNew);
router.get('/fragments/recipes/:id/edit', isAuthenticated, controller.fragmentRecipesEdit);

router.get('/fragments/products', isAuthenticated, controller.fragmentProductsList);
router.get('/fragments/products/new', isAuthenticated, controller.fragmentProductsNew);
router.get('/fragments/products/:id/edit', isAuthenticated, controller.fragmentProductsEdit);

router.get('/fragments/suppliers', isAuthenticated, controller.fragmentSuppliersList);
router.get('/fragments/suppliers/new', isAuthenticated, controller.fragmentSuppliersNew);
router.get('/fragments/suppliers/:id/edit', isAuthenticated, controller.fragmentSuppliersEdit);

router.get('/fragments/supplies', isAuthenticated, controller.fragmentSuppliesList);
router.get('/fragments/supplies/new', isAuthenticated, controller.fragmentSuppliesNew);
router.get('/fragments/supplies/:id/edit', isAuthenticated, controller.fragmentSuppliesEdit);

// ─── CRUD Mutations (return JSON — no redirects) ──────────────────────────────
router.post('/ingredients', isAuthenticated, controller.createIngredient);
router.post('/ingredients/:id', isAuthenticated, controller.updateIngredient);
router.post('/ingredients/:id/delete', isAuthenticated, controller.deleteIngredient);

router.post('/recipes', isAuthenticated, controller.createRecipe);
router.post('/recipes/:id', isAuthenticated, controller.updateRecipe);
router.post('/recipes/:id/delete', isAuthenticated, controller.deleteRecipe);

router.post('/products', isAuthenticated, controller.createProduct);
router.post('/products/:id', isAuthenticated, controller.updateProduct);
router.post('/products/:id/delete', isAuthenticated, controller.deleteProduct);

router.post('/suppliers', isAuthenticated, controller.createSupplier);
router.post('/suppliers/:id', isAuthenticated, controller.updateSupplier);
router.post('/suppliers/:id/delete', isAuthenticated, controller.deleteSupplier);

router.post('/supplies', isAuthenticated, controller.createSupply);
router.post('/supplies/:id', isAuthenticated, controller.updateSupply);
router.post('/supplies/:id/delete', isAuthenticated, controller.deleteSupply);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/fragments/settings', isAuthenticated, controller.fragmentSettings);
router.post('/settings', isAuthenticated, controller.updateSettings);

// ─── JSON Data APIs (used by other modules) ───────────────────────────────────
router.get('/api/recipes', isAuthenticated, controller.apiGetRecipes);
router.get('/api/ingredients', isAuthenticated, controller.apiGetIngredients);

module.exports = { basePath: '/recipes', router };
