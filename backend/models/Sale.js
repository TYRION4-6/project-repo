const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, required: true },
    outletId: { type: String, required: true },
    outletName: { type: String, required: true },
    items: [saleItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["UPI", "Card", "Cash", "Net Banking"], default: "UPI" },
    customerPhone: { type: String, default: "" },
    saleDate: { type: Date, default: Date.now },
    managerId: { type: String, default: "default_manager" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
