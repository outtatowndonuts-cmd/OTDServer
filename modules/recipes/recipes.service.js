// Business logic for Recipe module
const { Supplier, Ingredient, Recipe, Product, Supply, Settings } = require('./recipes.model');
const units = require('./units');

// Derive per-unit cost from a bulk purchase entry
function derivePerUnitCost(data) {
  const qty = parseFloat(data.purchaseQty);
  const cost = parseFloat(data.purchaseTotalCost);
  if (qty > 0 && cost >= 0) data.purchaseCost = cost / qty;
  return data;
}

function deriveSupplyCost(data) {
  const qty = parseFloat(data.purchaseQty);
  const cost = parseFloat(data.purchaseTotalCost);
  if (qty > 0 && cost >= 0) data.costPerUnit = cost / qty;
  return data;
}

// Supplier CRUD
async function createSupplier(data) {
  return Supplier.create(data);
}
async function getSuppliers() {
  return Supplier.find();
}
async function getSupplierById(id) {
  return Supplier.findById(id);
}
async function updateSupplier(id, data) {
  return Supplier.findByIdAndUpdate(id, data, { new: true });
}
async function deleteSupplier(id) {
  const usedByIngredients = await Ingredient.countDocuments({ supplier: id });
  if (usedByIngredients > 0) throw new Error(`Cannot delete: supplier is referenced by ${usedByIngredients} ingredient(s)`);
  const usedBySupplies = await Supply.countDocuments({ supplier: id });
  if (usedBySupplies > 0) throw new Error(`Cannot delete: supplier is referenced by ${usedBySupplies} supply item(s)`);
  return Supplier.findByIdAndDelete(id);
}

// Ingredient CRUD
async function createIngredient(data) {
  return Ingredient.create(derivePerUnitCost(data));
}
async function getIngredients() {
  return Ingredient.find().populate('supplier');
}
async function getIngredientById(id) {
  return Ingredient.findById(id).populate('supplier');
}
async function updateIngredient(id, data) {
  return Ingredient.findByIdAndUpdate(id, derivePerUnitCost(data), { new: true });
}
async function deleteIngredient(id) {
  const usedInRecipes = await Recipe.countDocuments({ 'ingredients.ingredient': id });
  if (usedInRecipes > 0) throw new Error(`Cannot delete: ingredient is used in ${usedInRecipes} recipe(s)`);
  const usedInProducts = await Product.countDocuments({ 'components.ref': id, 'components.type': 'Ingredient' });
  if (usedInProducts > 0) throw new Error(`Cannot delete: ingredient is used in ${usedInProducts} product(s)`);
  return Ingredient.findByIdAndDelete(id);
}

// Recipe CRUD
async function createRecipe(data) {
  return Recipe.create(data);
}
async function getRecipes() {
  return Recipe.find()
    .populate('ingredients.ingredient')
    .populate({ path: 'subRecipes.recipe', populate: { path: 'ingredients.ingredient' } });
}
async function getRecipeById(id) {
  return Recipe.findById(id)
    .populate('ingredients.ingredient')
    .populate({ path: 'subRecipes.recipe', populate: { path: 'ingredients.ingredient' } });
}
async function updateRecipe(id, data) {
  return Recipe.findByIdAndUpdate(id, data, { new: true });
}
async function deleteRecipe(id) {
  const usedInProducts = await Product.countDocuments({ 'components.ref': id, 'components.type': 'Recipe' });
  if (usedInProducts > 0) throw new Error(`Cannot delete: recipe is used in ${usedInProducts} product(s)`);
  const usedInRecipes = await Recipe.countDocuments({ 'subRecipes.recipe': id });
  if (usedInRecipes > 0) throw new Error(`Cannot delete: recipe is used as a sub-recipe in ${usedInRecipes} recipe(s)`);
  return Recipe.findByIdAndDelete(id);
}

// Product CRUD
async function createProduct(data) {
  return Product.create(data);
}
async function getProducts() {
  return Product.find();
}
async function getProductById(id) {
  return Product.findById(id);
}
async function updateProduct(id, data) {
  return Product.findByIdAndUpdate(id, data, { new: true });
}
async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

// Supply CRUD
async function createSupply(data) {
  return Supply.create(deriveSupplyCost(data));
}
async function getSupplies() {
  return Supply.find().populate('supplier');
}
async function getSupplyById(id) {
  return Supply.findById(id).populate('supplier');
}
async function updateSupply(id, data) {
  return Supply.findByIdAndUpdate(id, deriveSupplyCost(data), { new: true });
}
async function deleteSupply(id) {
  const usedInProducts = await Product.countDocuments({ 'components.ref': id, 'components.type': 'Supply' });
  if (usedInProducts > 0) throw new Error(`Cannot delete: supply is used in ${usedInProducts} product(s)`);
  return Supply.findByIdAndDelete(id);
}

// ─── Costing helpers ──────────────────────────────────────────────────────────

// Sync: calculate recipe cost from an already-populated recipe object.
// Use this when getRecipes() has already done the populate.
// Returns partial costs even when some ingredients lack pricing (missingCount > 0).
// _visited prevents infinite loops from circular sub-recipe references.
function calculateRecipeCostSync(recipe, _visited) {
  const visited = _visited || new Set();
  const recipeId = recipe._id ? recipe._id.toString() : '';
  if (recipeId && visited.has(recipeId)) return { costPerBatch: 0, costPerUnit: 0, yield: 1, yieldUnit: 'each', canCalculate: false, missingCount: 1, hasIngredients: false };
  if (recipeId) visited.add(recipeId);

  let costPerBatch = 0;
  let missingCount = 0;
  const hasIngredients = !!((recipe.ingredients && recipe.ingredients.length) || (recipe.subRecipes && recipe.subRecipes.length));
  for (const line of recipe.ingredients || []) {
    const ing = line.ingredient;
    if (!ing || ing.purchaseCost == null || !ing.purchaseUnit) {
      missingCount += 1;
      continue;
    }
    const lineUnit = line.unit && line.unit.trim() ? line.unit.trim() : ing.purchaseUnit;
    const cost = units.lineCost(line.quantity || 0, lineUnit, ing.purchaseCost, ing.purchaseUnit);
    if (cost === null) {
      missingCount += 1;
    } else costPerBatch += cost;
  }
  // Sub-recipe costs
  for (const line of recipe.subRecipes || []) {
    const sub = line.recipe;
    if (!sub || !sub._id) {
      missingCount += 1;
      continue;
    }
    const subCost = calculateRecipeCostSync(sub, visited);
    if (!subCost.canCalculate) {
      missingCount += 1;
    }
    // line.quantity is in the sub-recipe's yield units
    costPerBatch += subCost.costPerUnit * (Number(line.quantity) || 0);
  }
  const canCalculate = hasIngredients && missingCount === 0;
  const yieldQty = Number(recipe.yield) || 1;
  const yieldUnit = recipe.yieldUnit || 'each';
  return { costPerBatch, costPerUnit: costPerBatch / yieldQty, yield: yieldQty, yieldUnit, canCalculate, missingCount, hasIngredients };
}

// Async: fetch recipe by ID, populate, and return cost breakdown.
async function calculateRecipeCost(recipeId) {
  const recipe = await Recipe.findById(recipeId)
    .populate('ingredients.ingredient')
    .populate({ path: 'subRecipes.recipe', populate: { path: 'ingredients.ingredient' } })
    .lean();
  if (!recipe) return { costPerBatch: 0, costPerUnit: 0, yield: 1, canCalculate: false };
  return calculateRecipeCostSync(recipe);
}

// Async: calculate full COGS breakdown for a product.
// Takes a plain product object (from .lean() or mongoose doc).
async function calculateProductCosting(product) {
  let ingredientCost = 0;
  let canCalculate = true;

  for (const comp of product.components || []) {
    const typeNorm = (comp.type || '').toLowerCase();
    if (typeNorm === 'recipe') {
      const rc = await calculateRecipeCost(comp.ref);
      if (!rc.canCalculate) canCalculate = false;
      // qty = number of output units (e.g. 12 donuts), not number of batches
      ingredientCost += rc.costPerUnit * (Number(comp.quantity) || 1);
    } else if (typeNorm === 'supply') {
      const sup = await Supply.findById(comp.ref).lean();
      if (!sup || sup.costPerUnit == null) {
        canCalculate = false;
        continue;
      }
      ingredientCost += sup.costPerUnit * (Number(comp.quantity) || 1);
    } else {
      const ing = await Ingredient.findById(comp.ref).lean();
      if (!ing || ing.purchaseCost == null) {
        canCalculate = false;
        continue;
      }
      // qty is in the ingredient's purchaseUnit — direct multiplication
      ingredientCost += (ing.purchaseCost || 0) * (Number(comp.quantity) || 0);
    }
  }

  const laborCost = Number(product.laborCost) || 0;
  const overheadCost = Number(product.overheadCost) || 0;
  const totalCOGS = ingredientCost + laborCost + overheadCost;
  const price = Number(product.price) || 0;
  const margin = price > 0 ? ((price - totalCOGS) / price) * 100 : null;
  const targetMargin = Number(product.targetMarginPct) || 30;
  const suggestedPrice = totalCOGS > 0 && targetMargin < 100 ? totalCOGS / (1 - targetMargin / 100) : 0;

  return { ingredientCost, laborCost, overheadCost, totalCOGS, price, margin, targetMargin, suggestedPrice, canCalculate };
}

// Settings (singleton — always one document, created atomically if missing)
async function getSettings() {
  return Settings.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true, setDefaultsOnInsert: true });
}
async function updateSettings(data) {
  const allowed = {};
  if (data.defaultWeightUnit != null) allowed.defaultWeightUnit = data.defaultWeightUnit;
  if (data.defaultVolumeUnit != null) allowed.defaultVolumeUnit = data.defaultVolumeUnit;
  if (data.defaultCountUnit != null) allowed.defaultCountUnit = data.defaultCountUnit;
  if (data.defaultLaborCost != null) allowed.defaultLaborCost = data.defaultLaborCost;
  if (data.defaultOverheadCost != null) allowed.defaultOverheadCost = data.defaultOverheadCost;
  if (data.defaultMarginPct != null) allowed.defaultMarginPct = data.defaultMarginPct;
  if (data.supplyCategories != null) {
    if (typeof data.supplyCategories === 'string') {
      allowed.supplyCategories = data.supplyCategories
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);
    } else if (Array.isArray(data.supplyCategories)) {
      allowed.supplyCategories = data.supplyCategories;
    } else {
      allowed.supplyCategories = [];
    }
  }
  return Settings.findOneAndUpdate({}, allowed, { upsert: true, new: true, setDefaultsOnInsert: true });
}

module.exports = {
  // Supplier
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  // Ingredient
  createIngredient,
  getIngredients,
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  // Recipe
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  // Product
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  // Supply
  createSupply,
  getSupplies,
  getSupplyById,
  updateSupply,
  deleteSupply,
  // Costing
  calculateRecipeCostSync,
  calculateRecipeCost,
  calculateProductCosting,
  // Settings
  getSettings,
  updateSettings,
};
