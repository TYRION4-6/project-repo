const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtSale: {
        type: Number,
        required: true,
        min: 0
    }
});

const SaleSchema = new mongoose.Schema({
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlet",
        required: true
    },
    items: [SaleItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Sale", SaleSchema);
