const mongoose = require('mongoose');

/**
 * CustomBoxConfig — admin-defined templates for the customer-facing
 * custom box builder.  Each config specifies:
 *   - how many individual products the customer picks  (size)
 *   - the percentage discount applied to the sum of those items  (discountPct)
 */
const customBoxConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    size: { type: Number, required: true, min: 1, max: 500 },
    discountPct: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const CustomBoxConfig = mongoose.model('CustomBoxConfig', customBoxConfigSchema);

module.exports = { CustomBoxConfig };
