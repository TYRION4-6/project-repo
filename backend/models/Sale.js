const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productId: { type: String },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

const SaleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, required: true },
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: "Outlet" },
    outletId: { type: String },
    outletName: { type: String, default: "" },
    items: [SaleItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["Cash", "Card", "UPI", "Net Banking", "Other"], default: "UPI" },
    customerPhone: { type: String, default: "" },
    saleDate: { type: Date, default: Date.now },
    date: { type: Date, default: Date.now },
    managerId: { type: String, default: "mgr_1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
