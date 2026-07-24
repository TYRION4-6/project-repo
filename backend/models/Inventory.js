const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    outletId: { type: String, required: true },
    productId: { type: String, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure 1 inventory document per outlet per product
inventorySchema.index({ outletId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
