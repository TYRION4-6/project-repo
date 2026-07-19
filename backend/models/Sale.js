const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
