const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    // 'kitchen' = output of a production run (tracks Recipe batches awaiting assembly)
    // 'product' = finished/assembled products in the display case ready for sale
    kind: { type: String, enum: ['product', 'ingredient', 'supply', 'kitchen'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ kind: 1, refId: 1 }, { unique: true });

const inventoryBatchSchema = new mongoose.Schema(
  {
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId },
    producedQty: { type: Number, required: true },
    remainingQty: { type: Number, required: true },
    producedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    status: { type: String, enum: ['active', 'depleted', 'culled'], default: 'active' },
    // 'kitchen' = produced by a production order (raw batch from kitchen)
    // 'product' = assembled/finished product sent to the display case
    batchKind: { type: String, enum: ['kitchen', 'product'], default: 'kitchen' },
  },
  { timestamps: true },
);

inventoryBatchSchema.index({ refId: 1, batchKind: 1, status: 1 });
inventoryBatchSchema.index({ expiresAt: 1, status: 1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const InventoryBatch = mongoose.model('InventoryBatch', inventoryBatchSchema);

// ─── Purchase Orders ──────────────────────────────────────────────────────────
const purchaseOrderItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['supply', 'ingredient'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },
  { _id: false },
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true },
    items: [purchaseOrderItemSchema],
    subtotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'received', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String },
    orderedAt: { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true },
);

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = { InventoryItem, InventoryBatch, PurchaseOrder };
