const mongoose = require('mongoose');

const posSessionSchema = new mongoose.Schema(
  {
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    openingCash: { type: Number, default: 0 },
    closingCash: { type: Number },
    closedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

const POSSession = mongoose.model('POSSession', posSessionSchema);

module.exports = { POSSession };
