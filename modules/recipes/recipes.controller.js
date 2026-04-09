const path = require('path');
const service = require('./recipes.service');
const units = require('./units');
const { InventoryItem } = require('../inventory/inventory.model');

const VIEWS = path.join(__dirname, 'views');
const UNIT_OPTIONS = { weight: units.COMMON_WEIGHT, volume: units.COMMON_VOLUME, count: units.COMMON_COUNT };

function csrf(req) {
  return req.csrfToken ? req.csrfToken() : '';
}

// Render a bare HTML fragment (no layout wrapper)
function frag(res, view, data, _csrf) {
  res.render(path.join(VIEWS, view), Object.assign({}, data, { layout: false, _csrf: _csrf }));
}

// Parse bracketed form arrays: body.lines = { '0': {...}, '1': {...} } -> [...]
function parseLines(obj, keyField) {
  if (!obj) return [];
  return Object.values(obj).filter(function (r) {
    return r[keyField || 'ingredient'] || r.ref;
  });
}

// --- Dashboard Shell ----------------------------------------------------------
exports.getDashboard = function (req, res) {
  res.render(path.join(VIEWS, 'dashboard.pug'), { title: 'Production' });
};

// --- Ingredient Fragments -----------------------------------------------------
exports.fragmentIngredientsList = async function (req, res) {
  const ingredients = await service.getIngredients();
  frag(res, 'ingredients/list.pug', { ingredients }, csrf(req));
};

exports.fragmentIngredientsNew = async function (req, res) {
  const suppliers = await service.getSuppliers();
  frag(res, 'ingredients/form.pug', { item: null, suppliers, unitOptions: UNIT_OPTIONS }, csrf(req));
};

exports.fragmentIngredientsEdit = async function (req, res) {
  const [item, suppliers] = await Promise.all([service.getIngredientById(req.params.id), service.getSuppliers()]);
  if (!item) return res.status(404).send('Not found');
  frag(res, 'ingredients/form.pug', { item, suppliers, unitOptions: UNIT_OPTIONS }, csrf(req));
};

// --- Recipe Fragments ---------------------------------------------------------
exports.fragmentRecipesList = async function (req, res) {
  const recipes = await service.getRecipes();
  const recipeMap = {};
  for (const r of recipes) recipeMap[r._id.toString()] = r;
  const costings = recipes.map((r) => service.calculateRecipeCostSync(r, undefined, recipeMap));
  frag(res, 'recipes/list.pug', { recipes, costings }, csrf(req));
};

exports.fragmentRecipesNew = async function (req, res) {
  const [allIngredients, allRecipes, settings] = await Promise.all([service.getIngredients(), service.getRecipes(), service.getSettings()]);
  const ingCostData = {};
  for (const i of allIngredients) ingCostData[i._id] = i.purchaseCost != null ? { cost: i.purchaseCost, unit: i.purchaseUnit || '' } : null;
  const recipeMap = {};
  for (const r of allRecipes) recipeMap[r._id.toString()] = r;
  const subRecipeCostData = {};
  for (const r of allRecipes) {
    const c = service.calculateRecipeCostSync(r, undefined, recipeMap);
    subRecipeCostData[r._id] = { cost: c.canCalculate ? c.costPerUnit : null, unit: r.yieldUnit || 'each' };
  }
  frag(res, 'recipes/form.pug', { item: null, allIngredients, allRecipes, ingCostData, subRecipeCostData, unitOptions: UNIT_OPTIONS, settings }, csrf(req));
};

exports.fragmentRecipesEdit = async function (req, res) {
  const [item, allIngredients, allRecipes, settings] = await Promise.all([service.getRecipeById(req.params.id), service.getIngredients(), service.getRecipes(), service.getSettings()]);
  if (!item) return res.status(404).send('Not found');
  const ingCostData = {};
  for (const i of allIngredients) ingCostData[i._id] = i.purchaseCost != null ? { cost: i.purchaseCost, unit: i.purchaseUnit || '' } : null;
  const recipeMap = {};
  for (const r of allRecipes) recipeMap[r._id.toString()] = r;
  const subRecipeCostData = {};
  for (const r of allRecipes) {
    const c = service.calculateRecipeCostSync(r, undefined, recipeMap);
    subRecipeCostData[r._id] = { cost: c.canCalculate ? c.costPerUnit : null, unit: r.yieldUnit || 'each' };
  }
  frag(res, 'recipes/form.pug', { item, allIngredients, allRecipes, ingCostData, subRecipeCostData, unitOptions: UNIT_OPTIONS, settings }, csrf(req));
};

// --- Product Fragments --------------------------------------------------------
exports.fragmentProductsList = async function (req, res) {
  const products = await service.getProducts();
  const costings = await Promise.all(products.map((p) => service.calculateProductCosting(p)));
  frag(res, 'products/list.pug', { products, costings }, csrf(req));
};

exports.fragmentProductsNew = async function (req, res) {
  const [allIngredients, allRecipes, allSupplies, allProducts, defaults, inStockItems, prepItems] = await Promise.all([
    service.getIngredients(),
    service.getRecipes(),
    service.getSupplies(),
    service.getProducts(),
    service.getSettings(),
    InventoryItem.find({ kind: 'product', quantity: { $gt: 0 } }, { refId: 1 }),
    InventoryItem.find({ kind: 'kitchen', quantity: { $gt: 0 } }, { refId: 1, name: 1 }),
  ]);
  const inStockIds = new Set(inStockItems.map((i) => i.refId.toString()));
  const inStockProducts = allProducts.filter((p) => p.productType === 'simple' && inStockIds.has(p._id.toString()));
  const prepProducts = prepItems.map((i) => ({ _id: i.refId, name: i.name }));
  frag(res, 'products/form.pug', { item: null, allIngredients, allRecipes, allSupplies, allProducts, inStockProducts, prepProducts, costing: null, defaults }, csrf(req));
};

exports.fragmentProductsEdit = async function (req, res) {
  const [item, allIngredients, allRecipes, allSupplies, allProducts, inStockItems, prepItems] = await Promise.all([
    service.getProductById(req.params.id),
    service.getIngredients(),
    service.getRecipes(),
    service.getSupplies(),
    service.getProducts(),
    InventoryItem.find({ kind: 'product', quantity: { $gt: 0 } }, { refId: 1 }),
    InventoryItem.find({ kind: 'kitchen', quantity: { $gt: 0 } }, { refId: 1, name: 1 }),
  ]);
  if (!item) return res.status(404).send('Not found');
  const inStockIds = new Set(inStockItems.map((i) => i.refId.toString()));
  const inStockProducts = allProducts.filter((p) => p.productType === 'simple' && inStockIds.has(p._id.toString()));
  const prepProducts = prepItems.map((i) => ({ _id: i.refId, name: i.name }));
  const costing = await service.calculateProductCosting(item);
  frag(res, 'products/form.pug', { item, allIngredients, allRecipes, allSupplies, allProducts, inStockProducts, prepProducts, costing }, csrf(req));
};

// --- Supplier Fragments -------------------------------------------------------
exports.fragmentSuppliersList = async function (req, res) {
  const suppliers = await service.getSuppliers();
  frag(res, 'suppliers/list.pug', { suppliers }, csrf(req));
};

exports.fragmentSuppliersNew = function (req, res) {
  frag(res, 'suppliers/form.pug', { item: null }, csrf(req));
};

exports.fragmentSuppliersEdit = async function (req, res) {
  const item = await service.getSupplierById(req.params.id);
  if (!item) return res.status(404).send('Not found');
  frag(res, 'suppliers/form.pug', { item }, csrf(req));
};

// --- Supply Fragments --------------------------------------------------------
exports.fragmentSuppliesList = async function (req, res) {
  const supplies = await service.getSupplies();
  frag(res, 'supplies/list.pug', { supplies }, csrf(req));
};

exports.fragmentSuppliesNew = async function (req, res) {
  const [suppliers, settings] = await Promise.all([service.getSuppliers(), service.getSettings()]);
  const supplyCategories = settings.supplyCategories && settings.supplyCategories.length ? settings.supplyCategories : ['Packaging', 'Labels', 'Cleaning', 'Equipment', 'Other'];
  frag(res, 'supplies/form.pug', { item: null, suppliers, supplyCategories, unitOptions: UNIT_OPTIONS }, csrf(req));
};

exports.fragmentSuppliesEdit = async function (req, res) {
  const [item, suppliers, settings] = await Promise.all([service.getSupplyById(req.params.id), service.getSuppliers(), service.getSettings()]);
  if (!item) return res.status(404).send('Not found');
  const supplyCategories = settings.supplyCategories && settings.supplyCategories.length ? settings.supplyCategories : ['Packaging', 'Labels', 'Cleaning', 'Equipment', 'Other'];
  frag(res, 'supplies/form.pug', { item, suppliers, supplyCategories, unitOptions: UNIT_OPTIONS }, csrf(req));
};

// --- Settings Fragments -------------------------------------------------------
exports.fragmentSettings = async function (req, res) {
  const item = await service.getSettings();
  frag(res, 'settings/form.pug', { item, unitOptions: UNIT_OPTIONS }, csrf(req));
};

exports.updateSettings = async function (req, res) {
  try {
    await service.updateSettings(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Ingredient CRUD ----------------------------------------------------------
exports.createIngredient = async function (req, res) {
  try {
    const item = await service.createIngredient(req.body);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateIngredient = async function (req, res) {
  try {
    await service.updateIngredient(req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.deleteIngredient = async function (req, res) {
  try {
    await service.deleteIngredient(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Recipe CRUD --------------------------------------------------------------
exports.createRecipe = async function (req, res) {
  try {
    const data = Object.assign({}, req.body);
    data.ingredients = parseLines(data.ingredients, 'ingredient').map(function (r) {
      return { ingredient: r.ingredient, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    data.subRecipes = parseLines(data.subRecipes, 'recipe').map(function (r) {
      return { recipe: r.recipe, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    const item = await service.createRecipe(data);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateRecipe = async function (req, res) {
  try {
    const data = Object.assign({}, req.body);
    data.ingredients = parseLines(data.ingredients, 'ingredient').map(function (r) {
      return { ingredient: r.ingredient, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    data.subRecipes = parseLines(data.subRecipes, 'recipe').map(function (r) {
      return { recipe: r.recipe, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    await service.updateRecipe(req.params.id, data);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.deleteRecipe = async function (req, res) {
  try {
    await service.deleteRecipe(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Product CRUD -------------------------------------------------------------
exports.createProduct = async function (req, res) {
  try {
    const data = parseProductBody(req.body);
    const item = await service.createProduct(data);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateProduct = async function (req, res) {
  try {
    const data = parseProductBody(req.body);
    await service.updateProduct(req.params.id, data);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

function parseProductBody(body) {
  const data = Object.assign({}, body);
  data.productType = data.productType || 'simple';
  data.isActive = data.isActive === 'true' || data.isActive === true || data.isActive === '1';
  data.baseQty = parseFloat(data.baseQty) || 1;
  data.price = data.price ? parseFloat(data.price) : undefined;
  data.laborCost = parseFloat(data.laborCost) || 0;
  data.overheadCost = parseFloat(data.overheadCost) || 0;
  data.targetMarginPct = parseFloat(data.targetMarginPct) || 30;

  if (data.productType === 'bundle') {
    data.finishingComponents = [];
    data.recipe = undefined;
    data.bundleItems = parseLines(data.bundleItems, 'product').map(function (r) {
      return { product: r.product, quantity: parseFloat(r.quantity) || 1 };
    });
  } else {
    data.bundleItems = [];
    data.finishingComponents = parseLines(data.finishingComponents, 'ref').map(function (r) {
      return { type: r.type || 'Ingredient', ref: r.ref, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
  }
  return data;
}

exports.deleteProduct = async function (req, res) {
  try {
    await service.deleteProduct(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Supplier CRUD ------------------------------------------------------------
exports.createSupplier = async function (req, res) {
  try {
    const item = await service.createSupplier(req.body);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateSupplier = async function (req, res) {
  try {
    await service.updateSupplier(req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.deleteSupplier = async function (req, res) {
  try {
    await service.deleteSupplier(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// --- Supply CRUD -------------------------------------------------------------
exports.createSupply = async function (req, res) {
  try {
    const item = await service.createSupply(req.body);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateSupply = async function (req, res) {
  try {
    await service.updateSupply(req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.deleteSupply = async function (req, res) {
  try {
    await service.deleteSupply(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
