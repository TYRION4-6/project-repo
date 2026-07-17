const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const auth = require("../middleware/auth");

// Helper function to verify that the outlet belongs to the logged-in manager
const verifyOutletOwnership = async (outletId, managerId) => {
    const outlet = await Outlet.findById(outletId);
    return outlet && outlet.manager.toString() === managerId;
};

// @route   POST api/products
// @desc    Add a product to an outlet
// @access  Private
router.post("/", auth, async (req, res) => {
    const { name, sku, category, price, stockLevel, lowStockAlertThreshold, outlet } = req.body;

    if (!name || !sku || !category || price === undefined || stockLevel === undefined || !outlet) {
        return res.status(400).json({ message: "Please enter all required fields" });
    }

    try {
        // Validate outlet ownership
        const isOwner = await verifyOutletOwnership(outlet, req.user.id);
        if (!isOwner) {
            return res.status(401).json({ message: "Not authorized to add products to this outlet" });
        }

        // Check if SKU already exists for this outlet
        const existingProduct = await Product.findOne({ sku, outlet });
        if (existingProduct) {
            return res.status(400).json({ message: "A product with this SKU already exists in this outlet" });
        }

        const newProduct = new Product({
            name,
            sku,
            category,
            price,
            stockLevel,
            lowStockAlertThreshold,
            outlet
        });

        const product = await newProduct.save();
        res.status(201).json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/products
// @desc    Get products (filtered by outlet, category, lowStock flag) for the manager's outlets
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        // First get all outlets belonging to this manager
        const outlets = await Outlet.find({ manager: req.user.id });
        const outletIds = outlets.map(o => o._id);

        let filter = { outlet: { $in: outletIds } };

        // Apply outlet filter if query contains it (must verify manager owns that outlet)
        if (req.query.outlet) {
            if (!outletIds.map(id => id.toString()).includes(req.query.outlet)) {
                return res.status(401).json({ message: "Not authorized to access products of this outlet" });
            }
            filter.outlet = req.query.outlet;
        }

        // Apply category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Apply low stock filter
        if (req.query.lowStock === "true") {
            // Match products where stockLevel is less than or equal to lowStockAlertThreshold
            filter.$expr = { $lte: ["$stockLevel", "$lowStockAlertThreshold"] };
        }

        const products = await Product.find(filter)
            .populate("outlet", "name city")
            .sort({ name: 1 });

        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/products/:id
// @desc    Get a single product details
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("outlet", "name city manager");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check ownership of the outlet that contains the product
        if (product.outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to view this product" });
        }

        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(500).send("Server error");
    }
});

// @route   PUT api/products/:id
// @desc    Update product details
// @access  Private
router.put("/:id", auth, async (req, res) => {
    const { name, sku, category, price, stockLevel, lowStockAlertThreshold } = req.body;

    try {
        let product = await Product.findById(req.params.id).populate("outlet");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check ownership of the outlet containing the product
        if (product.outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to update products in this outlet" });
        }

        // If SKU is changed, make sure it is unique for this outlet
        if (sku && sku !== product.sku) {
            const existingProduct = await Product.findOne({ sku, outlet: product.outlet._id });
            if (existingProduct) {
                return res.status(400).json({ message: "A product with this SKU already exists in this outlet" });
            }
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: { name, sku, category, price, stockLevel, lowStockAlertThreshold } },
            { new: true }
        );

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("outlet");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check ownership
        if (product.outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to delete products in this outlet" });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
