// ─── Unit tables (all normalize to grams for weight, ml for volume) ───────────

const WEIGHT = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

const VOLUME = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  tsp: 4.92892,
  teaspoon: 4.92892,
  teaspoons: 4.92892,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tablespoons: 14.7868,
  cup: 236.588,
  cups: 236.588,
  pt: 473.176,
  pint: 473.176,
  pints: 473.176,
  qt: 946.353,
  quart: 946.353,
  quarts: 946.353,
  gal: 3785.41,
  gallon: 3785.41,
  gallons: 3785.41,
};

const COUNT = {
  each: 1,
  ea: 1,
  piece: 1,
  pieces: 1,
  item: 1,
  items: 1,
  dozen: 12,
  doz: 12,
  dz: 12,
};

function norm(u) {
  return (u || '').toLowerCase().trim();
}

function family(unit) {
  const u = norm(unit);
  if (WEIGHT[u] !== undefined) return 'weight';
  if (VOLUME[u] !== undefined) return 'volume';
  if (COUNT[u] !== undefined) return 'count';
  return null;
}

function toBase(qty, unit) {
  const u = norm(unit);
  if (WEIGHT[u] !== undefined) return qty * WEIGHT[u];
  if (VOLUME[u] !== undefined) return qty * VOLUME[u];
  if (COUNT[u] !== undefined) return qty * COUNT[u];
  return qty;
}

function fromBase(base, unit) {
  const u = norm(unit);
  if (WEIGHT[u] !== undefined) return base / WEIGHT[u];
  if (VOLUME[u] !== undefined) return base / VOLUME[u];
  if (COUNT[u] !== undefined) return base / COUNT[u];
  return base;
}

// Convert qty from fromUnit to toUnit. Returns null if units are incompatible.
function convert(qty, fromUnit, toUnit) {
  const f1 = family(fromUnit);
  const f2 = family(toUnit);
  if (!f1 || !f2 || f1 !== f2) return null;
  return fromBase(toBase(qty, fromUnit), toUnit);
}

// Cost of using (qty, unit) of an ingredient priced at purchaseCost per purchaseUnit.
// Returns null if the units are from different families (e.g. weight vs volume).
function lineCost(qty, unit, purchaseCost, purchaseUnit) {
  if (!purchaseCost || !qty) return 0;
  if (!unit || !purchaseUnit) return null;
  const f1 = family(unit);
  const f2 = family(purchaseUnit);
  if (!f1 || !f2 || f1 !== f2) return null;
  const baseQty = toBase(qty, unit);
  const basePurchase = toBase(1, purchaseUnit);
  return (purchaseCost / basePurchase) * baseQty;
}

// Sync: calculate recipe cost from an already-populated recipe object
function calcRecipeCostSync(recipe) {
  let costPerBatch = 0;
  let canCalculate = !!(recipe.ingredients && recipe.ingredients.length);
  for (const line of recipe.ingredients || []) {
    const ing = line.ingredient;
    if (!ing || !ing.purchaseCost || !ing.purchaseUnit) {
      canCalculate = false;
      continue;
    }
    const cost = lineCost(line.quantity || 0, line.unit || '', ing.purchaseCost, ing.purchaseUnit);
    if (cost === null) {
      canCalculate = false;
    } else costPerBatch += cost;
  }
  const yieldQty = Number(recipe.yield) || 1;
  return { costPerBatch, costPerUnit: costPerBatch / yieldQty, yield: yieldQty, canCalculate };
}

const COMMON_WEIGHT = ['g', 'kg', 'oz', 'lb'];
const COMMON_VOLUME = ['tsp', 'tbsp', 'cup', 'fl oz', 'ml', 'L'];
const COMMON_COUNT = ['each', 'dozen'];
const COMMON_UNITS = [...COMMON_WEIGHT, ...COMMON_VOLUME, ...COMMON_COUNT];

module.exports = { convert, lineCost, family, toBase, fromBase, calcRecipeCostSync, COMMON_UNITS, COMMON_WEIGHT, COMMON_VOLUME, COMMON_COUNT };
