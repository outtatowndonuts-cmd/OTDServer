const path = require('path');
const service = require('./recipes.service');
const units = require('./units');

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
function parseLines(obj) {
  if (!obj) return [];
  return Object.values(obj).filter(function (r) {
    return r.ingredient || r.ref;
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
  const costings = recipes.map((r) => service.calculateRecipeCostSync(r));
  frag(res, 'recipes/list.pug', { recipes, costings }, csrf(req));
};

exports.fragmentRecipesNew = async function (req, res) {
  const [allIngredients, settings] = await Promise.all([service.getIngredients(), service.getSettings()]);
  const ingCostData = {};
  for (const i of allIngredients) ingCostData[i._id] = i.purchaseCost != null ? { cost: i.purchaseCost, unit: i.purchaseUnit || '' } : null;
  frag(res, 'recipes/form.pug', { item: null, allIngredients, ingCostData, unitOptions: UNIT_OPTIONS, settings }, csrf(req));
};

exports.fragmentRecipesEdit = async function (req, res) {
  const [item, allIngredients, settings] = await Promise.all([service.getRecipeById(req.params.id), service.getIngredients(), service.getSettings()]);
  if (!item) return res.status(404).send('Not found');
  const ingCostData = {};
  for (const i of allIngredients) ingCostData[i._id] = i.purchaseCost != null ? { cost: i.purchaseCost, unit: i.purchaseUnit || '' } : null;
  frag(res, 'recipes/form.pug', { item, allIngredients, ingCostData, unitOptions: UNIT_OPTIONS, settings }, csrf(req));
};

// Build a cost-per-unit lookup map for all items, keyed 'Type:id'
function buildCostData(allIngredients, allRecipes, allSupplies) {
  const costData = {};
  for (const r of allRecipes) {
    const c = service.calculateRecipeCostSync(r);
    costData[`Recipe:${r._id}`] = c.canCalculate ? c.costPerUnit : null;
  }
  for (const i of allIngredients) {
    costData[`Ingredient:${i._id}`] = i.purchaseCost != null ? i.purchaseCost : null;
  }
  for (const s of allSupplies) {
    costData[`Supply:${s._id}`] = s.costPerUnit != null ? s.costPerUnit : null;
  }
  return costData;
}

// --- Product Fragments --------------------------------------------------------
exports.fragmentProductsList = async function (req, res) {
  const products = await service.getProducts();
  const costings = await Promise.all(products.map((p) => service.calculateProductCosting(p)));
  frag(res, 'products/list.pug', { products, costings }, csrf(req));
};

exports.fragmentProductsNew = async function (req, res) {
  const [allIngredients, allRecipes, allSupplies, defaults] = await Promise.all([service.getIngredients(), service.getRecipes(), service.getSupplies(), service.getSettings()]);
  const costData = buildCostData(allIngredients, allRecipes, allSupplies);
  frag(res, 'products/form.pug', { item: null, allIngredients, allRecipes, allSupplies, costData, costing: null, defaults }, csrf(req));
};

exports.fragmentProductsEdit = async function (req, res) {
  const [item, allIngredients, allRecipes, allSupplies] = await Promise.all([service.getProductById(req.params.id), service.getIngredients(), service.getRecipes(), service.getSupplies()]);
  if (!item) return res.status(404).send('Not found');
  const [costing, costData] = await Promise.all([service.calculateProductCosting(item), Promise.resolve(buildCostData(allIngredients, allRecipes, allSupplies))]);
  frag(res, 'products/form.pug', { item, allIngredients, allRecipes, allSupplies, costData, costing }, csrf(req));
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
    data.ingredients = parseLines(data.ingredients).map(function (r) {
      return { ingredient: r.ingredient, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
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
    data.ingredients = parseLines(data.ingredients).map(function (r) {
      return { ingredient: r.ingredient, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
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
    const data = Object.assign({}, req.body);
    data.components = parseLines(data.components).map(function (r) {
      return { type: r.type || 'Recipe', ref: r.ref, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    const item = await service.createProduct(data);
    res.json({ ok: true, id: item._id });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

exports.updateProduct = async function (req, res) {
  try {
    const data = Object.assign({}, req.body);
    data.components = parseLines(data.components).map(function (r) {
      return { type: r.type || 'Recipe', ref: r.ref, quantity: parseFloat(r.quantity) || 0, unit: r.unit || '' };
    });
    await service.updateProduct(req.params.id, data);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

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
