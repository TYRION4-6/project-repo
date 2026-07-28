const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: "Outlet" },
    outletName: { type: String, required: true },
    currentStock: { type: Number, required: true },
    minThreshold: { type: Number, default: 10 },
    severity: { type: String, enum: ["LOW_STOCK", "CRITICAL"], default: "LOW_STOCK" },
    status: { type: String, enum: ["ACTIVE", "RESOLVED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
