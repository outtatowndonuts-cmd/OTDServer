const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['product', 'recipe'], required: true },
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
      enum: ['sale', 'production'],
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
      enum: ['cash', 'card', 'none'],
      default: 'none',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'none'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
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
  },
  { timestamps: true },
);

const Order = mongoose.model('Order', orderSchema);
const OrderSettings = mongoose.model('OrderSettings', orderSettingsSchema);

module.exports = { Order, OrderSettings };
