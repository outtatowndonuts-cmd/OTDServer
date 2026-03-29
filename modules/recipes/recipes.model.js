// Recipe module data models
// Product, Recipe, Ingredient (Ingredient is a Product with supplier info)

const mongoose = require('mongoose');

// Supplier (optional, for normalization)
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  notes: { type: String },
});

// Ingredient
const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  purchaseUnit: { type: String }, // e.g. kg, L, box
  purchaseCost: { type: Number }, // per purchaseUnit
  sku: { type: String },
  inventoryQty: { type: Number, default: 0 },
  reorderLevel: { type: Number },
  notes: { type: String },
});

// Recipe
const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
      quantity: { type: Number, required: true },
      unit: { type: String },
    },
  ],
  subRecipes: [
    {
      recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
      quantity: { type: Number, required: true },
      unit: { type: String },
    },
  ],
  yield: { type: Number }, // e.g. number of donuts produced
  instructions: { type: String },
  notes: { type: String },
});

// Product
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  components: [
    {
      type: { type: String, enum: ['Ingredient', 'Recipe'], required: true },
      ref: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'components.type' },
      quantity: { type: Number, required: true },
      unit: { type: String },
    },
  ],
  price: { type: Number },
  sku: { type: String },
  inventoryQty: { type: Number, default: 0 },
  notes: { type: String },
});

const Supplier = mongoose.model('Supplier', SupplierSchema);
const Ingredient = mongoose.model('Ingredient', IngredientSchema);
const Recipe = mongoose.model('Recipe', RecipeSchema);
const Product = mongoose.model('Product', ProductSchema);

module.exports = { Supplier, Ingredient, Recipe, Product };
