const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

const saleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, required: true },
    outletId: { type: String, required: true },
    outletName: { type: String, required: true },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        "Transaction must contain at least one product item",
      ],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["UPI", "Card", "Cash", "Net Banking"], default: "UPI" },
    customerPhone: { type: String, default: "" },
    saleDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: "" },
    managerId: { type: String, default: "default_manager" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);

