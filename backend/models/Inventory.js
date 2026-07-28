const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    outletId: { type: String, required: true },
    productId: { type: String, required: true },
    stockQuantity: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", InventorySchema);
