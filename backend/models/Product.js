const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, required: true }, // Electronics, Apparel, Groceries, Beverages, Personal Care
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    unit: { type: String, default: "pcs" },
    minStockThreshold: { type: Number, default: 15 },
    description: { type: String, default: "" },
    managerId: { type: String, default: "default_manager" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
