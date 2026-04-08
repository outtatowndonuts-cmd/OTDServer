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
  purchaseUnit: { type: String }, // unit of the purchase package (lb, kg, L, each...)
  purchaseQty: { type: Number }, // how many units in one purchase (e.g. 50)
  purchaseTotalCost: { type: Number }, // total $ paid for purchaseQty units (e.g. 30)
  purchaseCost: { type: Number }, // COMPUTED: purchaseTotalCost / purchaseQty (cost per purchaseUnit)
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
  yield: { type: Number, min: 1 }, // e.g. number of donuts produced
  yieldUnit: { type: String, default: 'each' }, // unit for yield (each, g, oz, lb, ml, cup...)
  shelfLifeDays: { type: Number }, // days before batch expires (optional)
  instructions: { type: String },
  notes: { type: String },
});

// Product — what goes in the display case for sale.
// Phase 1 (kitchen) produces batches of a Recipe.
// Phase 2 (assembly/finishing) converts those batches into Products.
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productType: { type: String, enum: ['simple', 'bundle'], default: 'simple' },

  // ── Simple products ────────────────────────────────────────────────────────
  // recipe: the kitchen Recipe that produces the base unit (e.g. "Yeast Donut Base")
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  // baseQty: how many kitchen-batch units are consumed to make ONE of this product
  baseQty: { type: Number, default: 1, min: 0.001 },
  // finishingComponents: what gets added during front-of-house assembly
  // (toppings, glazes, decorations, packaging supplies — NOT the base recipe)
  finishingComponents: [
    {
      type: { type: String, enum: ['Ingredient', 'Supply'], required: true },
      ref: { type: mongoose.Schema.Types.ObjectId, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String },
    },
  ],

  // ── Bundle products ────────────────────────────────────────────────────────
  // bundleItems: component Products (and quantities) that make up this bundle.
  // Bundles are assembled on-demand at point-of-sale; stock is drawn from
  // each component product's display-case inventory.
  bundleItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],

  // ── Shared ─────────────────────────────────────────────────────────────────
  price: { type: Number },
  sku: { type: String },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
  // Costing fields
  laborCost: { type: Number, default: 0 }, // $ per unit of product
  overheadCost: { type: Number, default: 0 }, // $ per unit
  targetMarginPct: { type: Number, default: 30 }, // desired gross margin %
});

const Supplier = mongoose.model('Supplier', SupplierSchema);
const Ingredient = mongoose.model('Ingredient', IngredientSchema);
const Recipe = mongoose.model('Recipe', RecipeSchema);
const Product = mongoose.model('Product', ProductSchema);

// Supply (packaging, labels, non-ingredient consumables)
const SupplySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  unit: { type: String }, // the unit being counted (box, roll, label...)
  purchaseQty: { type: Number }, // how many units bought at once (e.g. 100)
  purchaseTotalCost: { type: Number }, // total $ paid (e.g. 50)
  costPerUnit: { type: Number }, // COMPUTED: purchaseTotalCost / purchaseQty (e.g. 0.50)
  sku: { type: String },
  inventoryQty: { type: Number, default: 0 },
  notes: { type: String },
});

const Supply = mongoose.model('Supply', SupplySchema);

// Module-level settings (singleton)
const SettingsSchema = new mongoose.Schema({
  defaultWeightUnit: { type: String, default: 'oz' },
  defaultVolumeUnit: { type: String, default: 'cup' },
  defaultCountUnit: { type: String, default: 'each' },
  defaultLaborCost: { type: Number, default: 0 },
  defaultOverheadCost: { type: Number, default: 0 },
  defaultMarginPct: { type: Number, default: 30 },
  supplyCategories: { type: [String], default: () => ['Packaging', 'Labels', 'Cleaning', 'Equipment', 'Other'] },
});
const Settings = mongoose.model('RecipeSettings', SettingsSchema);

module.exports = { Supplier, Ingredient, Recipe, Product, Supply, Settings };
