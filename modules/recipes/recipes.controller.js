const path = require('path');
const service = require('./recipes.service');

const VIEWS = path.join(__dirname, 'views');

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
  frag(res, 'ingredients/form.pug', { item: null, suppliers }, csrf(req));
};

exports.fragmentIngredientsEdit = async function (req, res) {
  const [item, suppliers] = await Promise.all([service.getIngredientById(req.params.id), service.getSuppliers()]);
  if (!item) return res.status(404).send('Not found');
  frag(res, 'ingredients/form.pug', { item, suppliers }, csrf(req));
};

// --- Recipe Fragments ---------------------------------------------------------
exports.fragmentRecipesList = async function (req, res) {
  const recipes = await service.getRecipes();
  frag(res, 'recipes/list.pug', { recipes }, csrf(req));
};

exports.fragmentRecipesNew = async function (req, res) {
  const allIngredients = await service.getIngredients();
  frag(res, 'recipes/form.pug', { item: null, allIngredients }, csrf(req));
};

exports.fragmentRecipesEdit = async function (req, res) {
  const [item, allIngredients] = await Promise.all([service.getRecipeById(req.params.id), service.getIngredients()]);
  if (!item) return res.status(404).send('Not found');
  frag(res, 'recipes/form.pug', { item, allIngredients }, csrf(req));
};

// --- Product Fragments --------------------------------------------------------
exports.fragmentProductsList = async function (req, res) {
  const products = await service.getProducts();
  frag(res, 'products/list.pug', { products }, csrf(req));
};

exports.fragmentProductsNew = async function (req, res) {
  const [allIngredients, allRecipes] = await Promise.all([service.getIngredients(), service.getRecipes()]);
  frag(res, 'products/form.pug', { item: null, allIngredients, allRecipes }, csrf(req));
};

exports.fragmentProductsEdit = async function (req, res) {
  const [item, allIngredients, allRecipes] = await Promise.all([service.getProductById(req.params.id), service.getIngredients(), service.getRecipes()]);
  if (!item) return res.status(404).send('Not found');
  frag(res, 'products/form.pug', { item, allIngredients, allRecipes }, csrf(req));
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
