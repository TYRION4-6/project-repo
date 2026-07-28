const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0 },
    unit: { type: String, default: "pcs" },
    stockLevel: { type: Number, default: 0 },
    lowStockAlertThreshold: { type: Number, default: 10 },
    minStockThreshold: { type: Number, default: 10 },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    images: [{ type: String }],
    reviews: [ReviewSchema],
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: "Outlet" },
    stock: [
      {
        outletId: { type: mongoose.Schema.Types.ObjectId, ref: "Outlet" },
        quantity: { type: Number, default: 0 },
        threshold: { type: Number, default: 10 },
      },
    ],
    managerId: { type: String, default: "mgr_1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
