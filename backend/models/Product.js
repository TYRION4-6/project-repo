const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stockLevel: {
        type: Number,
        required: true,
        min: 0
    },
    lowStockAlertThreshold: {
        type: Number,
        default: 10,
        min: 0
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlet",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite unique index for SKU per Outlet
ProductSchema.index({ sku: 1, outlet: 1 }, { unique: true });

module.exports = mongoose.model("Product", ProductSchema);
