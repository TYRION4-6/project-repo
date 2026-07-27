const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a single alert per product-outlet combination
AlertSchema.index({ productId: 1, outletId: 1 }, { unique: true });

module.exports = mongoose.model("Alert", AlertSchema);
