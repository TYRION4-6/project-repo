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
        const dashboardEmitter = require("../utils/eventEmitter");
        dashboardEmitter.emit("alert-change", { managerId: req.user.id });
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

        // Support optional pagination via page & limit query params
        // When page is provided, return paginated response; otherwise return flat array for backward compatibility
        if (req.query.page) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [products, total] = await Promise.all([
                Product.find(filter)
                    .populate("outlet", "name city")
                    .sort({ name: 1 })
                    .skip(skip)
                    .limit(limit),
                Product.countDocuments(filter)
            ]);

            return res.json({
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }

        // Default: return flat array (backward-compatible for Dashboard, POS, etc.)
        const products = await Product.find(filter)
            .populate("outlet", "name city")
            .sort({ name: 1 });

        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/products/alerts/count
// @desc    Get count of active low stock alerts
// @access  Private
router.get("/alerts/count", auth, async (req, res) => {
    try {
        const outlets = await Outlet.find({ manager: req.user.id });
        const outletIds = outlets.map(o => o._id);

        if (outletIds.length === 0) {
            return res.json({ alertCount: 0 });
        }

        const alertCount = await Product.countDocuments({
            outlet: { $in: outletIds },
            $expr: { $lte: ["$stockLevel", "$lowStockAlertThreshold"] }
        });

        res.json({ alertCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/products/alerts/feed
// @desc    SSE feed for active low stock alerts
// @access  Private
router.get("/alerts/feed", auth, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const managerId = req.user.id;

    const sendAlertCount = async () => {
        try {
            const outlets = await Outlet.find({ manager: managerId });
            const outletIds = outlets.map(o => o._id);
            if (outletIds.length === 0) {
                res.write(`data: ${JSON.stringify({ alertCount: 0 })}\n\n`);
                return;
            }
            const alertCount = await Product.countDocuments({
                outlet: { $in: outletIds },
                $expr: { $lte: ["$stockLevel", "$lowStockAlertThreshold"] }
            });
            res.write(`data: ${JSON.stringify({ alertCount })}\n\n`);
        } catch (err) {
            console.error("Error sending alert count in SSE:", err);
        }
    };

    await sendAlertCount();

    const onAlertChange = async (data) => {
        if (!data || !data.managerId || data.managerId === managerId) {
            await sendAlertCount();
        }
    };

    const dashboardEmitter = require("../utils/eventEmitter");
    dashboardEmitter.on("alert-change", onAlertChange);

    const keepAlive = setInterval(() => {
        res.write(": keep-alive\n\n");
    }, 20000);

    req.on("close", () => {
        clearInterval(keepAlive);
        dashboardEmitter.removeListener("alert-change", onAlertChange);
        res.end();
    });
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

        const dashboardEmitter = require("../utils/eventEmitter");
        dashboardEmitter.emit("alert-change", { managerId: req.user.id });

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

        const dashboardEmitter = require("../utils/eventEmitter");
        dashboardEmitter.emit("alert-change", { managerId: req.user.id });

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
