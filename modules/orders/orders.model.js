const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['product', 'recipe', 'fee'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    priceSnapshot: { type: Number },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['sale', 'production', 'assembly'],
      required: true,
    },
    source: {
      type: String,
      enum: ['pos', 'online', 'internal'],
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one item'],
    },
    subtotal: { type: Number },
    tax: { type: Number },
    total: { type: Number },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'none', 'donation'],
      default: 'none',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'none'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'filled', 'delivered', 'cancelled'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    inventoryProcessed: {
      type: Boolean,
      default: false,
    },
    pickupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true },
);

// ─── Order Settings (singleton) ───────────────────────────────────────────────
const orderSettingsSchema = new mongoose.Schema(
  {
    taxRate: { type: Number, default: 0 },
    defaultPaymentMethod: { type: String, enum: ['cash', 'card', 'none'], default: 'none' },
    defaultSource: { type: String, enum: ['pos', 'online'], default: 'pos' },
    preordersEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Order = mongoose.model('Order', orderSchema);
const OrderSettings = mongoose.model('OrderSettings', orderSettingsSchema);

module.exports = { Order, OrderSettings };
