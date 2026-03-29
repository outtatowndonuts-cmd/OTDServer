// Business logic for Recipe module
const { Supplier, Ingredient, Recipe, Product } = require('./recipes.model');

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
  return Supplier.findByIdAndDelete(id);
}

// Ingredient CRUD
async function createIngredient(data) {
  return Ingredient.create(data);
}
async function getIngredients() {
  return Ingredient.find().populate('supplier');
}
async function getIngredientById(id) {
  return Ingredient.findById(id).populate('supplier');
}
async function updateIngredient(id, data) {
  return Ingredient.findByIdAndUpdate(id, data, { new: true });
}
async function deleteIngredient(id) {
  return Ingredient.findByIdAndDelete(id);
}

// Recipe CRUD
async function createRecipe(data) {
  return Recipe.create(data);
}
async function getRecipes() {
  return Recipe.find().populate('ingredients.ingredient').populate('subRecipes.recipe');
}
async function getRecipeById(id) {
  return Recipe.findById(id).populate('ingredients.ingredient').populate('subRecipes.recipe');
}
async function updateRecipe(id, data) {
  return Recipe.findByIdAndUpdate(id, data, { new: true });
}
async function deleteRecipe(id) {
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
};
