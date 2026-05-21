const crypto = require('crypto');
const mongoose = require('mongoose');

// 32 unambiguous characters (no modulo bias with byte % 32)
const CONF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateConfirmationNumber() {
  const bytes = crypto.randomBytes(6);
  return `OTD-SO-${Array.from(bytes)
    .map((b) => CONF_CHARS[b % CONF_CHARS.length])
    .join('')}`;
}

// ─── SpecialOrderConfig (singleton) ──────────────────────────────────────────
// Stores admin-configured available options and delivery fee rates.

const availableOptionSchema = new mongoose.Schema(
  {
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isFilled: { type: Boolean, default: false }, // base recipes only — triggers filling selector
  },
  { _id: true },
);

const storeHoursDaySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
    isOpen: { type: Boolean, default: false },
    openTime: { type: String, default: '05:30' },
    closeTime: { type: String, default: '11:00' },
  },
  { _id: false },
);

const DEFAULT_STORE_HOURS = [
  { day: 0, isOpen: false, openTime: '05:30', closeTime: '11:00' }, // Sun
  { day: 1, isOpen: true, openTime: '05:30', closeTime: '11:00' }, // Mon
  { day: 2, isOpen: true, openTime: '05:30', closeTime: '11:00' }, // Tue
  { day: 3, isOpen: true, openTime: '05:30', closeTime: '11:00' }, // Wed
  { day: 4, isOpen: true, openTime: '05:30', closeTime: '11:00' }, // Thu
  { day: 5, isOpen: true, openTime: '05:30', closeTime: '11:00' }, // Fri
  { day: 6, isOpen: false, openTime: '05:30', closeTime: '11:00' }, // Sat
];

const specialOrderConfigSchema = new mongoose.Schema(
  {
    availableBaseRecipes: { type: [availableOptionSchema], default: [] },
    availableFrostings: { type: [availableOptionSchema], default: [] },
    availableToppings: { type: [availableOptionSchema], default: [] },
    availableFillings: { type: [availableOptionSchema], default: [] },
    inCityDeliveryFee: { type: Number, default: 0, min: 0 },
    outsideCityFlatFee: { type: Number, default: 0, min: 0 },
    perMileRate: { type: Number, default: 0, min: 0 },
    storeAddress: { type: String, trim: true, default: '' },
    orderCutoffHour: { type: Number, default: 17, min: 0, max: 23 },
    storeHours: { type: [storeHoursDaySchema], default: () => DEFAULT_STORE_HOURS },
    assortedDonutBasePrice: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const SpecialOrderConfig = mongoose.model('SpecialOrderConfig', specialOrderConfigSchema);

// ─── SpecialOrder ─────────────────────────────────────────────────────────────

const toppingSnapshotSchema = new mongoose.Schema(
  {
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const variationSchema = new mongoose.Schema(
  {
    isAssorted: { type: Boolean, default: false },
    baseRecipe: {
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    frosting: {
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
    filling: {
      ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
      name: { type: String, default: null },
      price: { type: Number, default: 0 },
    },
    toppings: { type: [toppingSnapshotSchema], default: [] },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    formatted: { type: String, trim: true },
  },
  { _id: false },
);

const specialOrderSchema = new mongoose.Schema(
  {
    confirmationNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerEmail: { type: String, trim: true, maxlength: 254, default: null },
    customerPhone: { type: String, trim: true, maxlength: 30, default: null },
    fulfillmentType: {
      type: String,
      enum: ['store-early', 'store-mid', 'in-city', 'outside-city', 'outside-county'],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    deliveryAddress: { type: deliveryAddressSchema, default: null },
    totalQuantity: { type: Number, required: true, min: 1 },
    variations: {
      type: [variationSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one variation'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    bundleDiscountAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    distanceMiles: { type: Number, default: null },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    stripeSessionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'filling', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

specialOrderSchema.pre('save', async function () {
  if (!this.confirmationNumber) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const candidate = generateConfirmationNumber();
      const existing = await this.constructor.findOne({ confirmationNumber: candidate });
      if (!existing) {
        this.confirmationNumber = candidate;
        unique = true;
      }
      attempts += 1;
    }
    if (!unique) throw new Error('Failed to generate unique confirmation number');
  }
});

const SpecialOrder = mongoose.model('SpecialOrder', specialOrderSchema);

module.exports = { SpecialOrder, SpecialOrderConfig };
