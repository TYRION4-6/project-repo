const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const auth = require("../middleware/auth");

// @route   POST api/sales
// @desc    Record a new sales transaction and update inventory levels
// @access  Private
router.post("/", auth, async (req, res) => {
    const { outlet, items } = req.body;

    if (!outlet || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Outlet and items are required" });
    }

    try {
        // Verify outlet ownership
        const outletDoc = await Outlet.findById(outlet);
        if (!outletDoc) {
            return res.status(404).json({ message: "Outlet not found" });
        }
        if (outletDoc.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to record sales for this outlet" });
        }

        let totalAmount = 0;
        const saleItems = [];
        const productsToUpdate = [];

        // Validate products and check stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }

            // Ensure product belongs to the selected outlet
            if (product.outlet.toString() !== outlet) {
                return res.status(400).json({ 
                    message: `Product ${product.name} does not belong to the selected outlet` 
                });
            }

            // Check stock level
            if (product.stockLevel < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for product ${product.name}. Available: ${product.stockLevel}, Requested: ${item.quantity}` 
                });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            saleItems.push({
                product: product._id,
                quantity: item.quantity,
                priceAtSale: product.price
            });

            productsToUpdate.push({
                productDoc: product,
                newStock: product.stockLevel - item.quantity
            });
        }

        // Deduct inventory stock
        for (const update of productsToUpdate) {
            update.productDoc.stockLevel = update.newStock;
            await update.productDoc.save();
        }

        // Create and save sale
        const newSale = new Sale({
            outlet,
            items: saleItems,
            totalAmount,
            recordedBy: req.user.id
        });

        const sale = await newSale.save();
        
        // Populate and return
        const populatedSale = await Sale.findById(sale._id)
            .populate("outlet", "name city")
            .populate("items.product", "name sku category");

        res.status(201).json(populatedSale);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/sales
// @desc    Get all sales recorded by the manager
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const outlets = await Outlet.find({ manager: req.user.id });
        const outletIds = outlets.map(o => o._id);

        const sales = await Sale.find({ outlet: { $in: outletIds } })
            .populate("outlet", "name city")
            .populate("items.product", "name sku category")
            .sort({ date: -1 });

        res.json(sales);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/sales/analytics
// @desc    Get aggregate sales analytics for manager dashboard
// @access  Private
router.get("/analytics", auth, async (req, res) => {
    try {
        const managerId = new mongoose.Types.ObjectId(req.user.id);

        // Fetch outlets owned by manager
        const outlets = await Outlet.find({ manager: managerId });
        const outletIds = outlets.map(o => o._id);

        if (outletIds.length === 0) {
            return res.json({
                totalRevenue: 0,
                totalSalesCount: 0,
                lowStockCount: 0,
                activeOutletsCount: 0,
                salesByDate: [],
                salesByOutlet: [],
                salesByCategory: [],
                topProducts: []
            });
        }

        // 1. Overall low stock count
        const lowStockCount = await Product.countDocuments({
            outlet: { $in: outletIds },
            $expr: { $lte: ["$stockLevel", "$lowStockAlertThreshold"] }
        });

        // 2. Total active outlets count
        const activeOutletsCount = outletIds.length;

        // 3. Overall Revenue and Total Sales Count
        const overallStats = await Sale.aggregate([
            { $match: { outlet: { $in: outletIds } } },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: "$totalAmount" },
                    totalSalesCount: { $sum: 1 }
                } 
            }
        ]);

        const totalRevenue = overallStats[0]?.totalRevenue || 0;
        const totalSalesCount = overallStats[0]?.totalSalesCount || 0;

        // 4. Sales Over Time (grouped by day, last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesByDate = await Sale.aggregate([
            { 
                $match: { 
                    outlet: { $in: outletIds },
                    date: { $gte: thirtyDaysAgo }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    revenue: { $sum: "$totalAmount" },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    revenue: 1,
                    transactions: 1,
                    _id: 0
                }
            }
        ]);

        // 5. Sales by Outlet Branch
        const salesByOutlet = await Sale.aggregate([
            { $match: { outlet: { $in: outletIds } } },
            {
                $group: {
                    _id: "$outlet",
                    revenue: { $sum: "$totalAmount" },
                    salesCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "outlets",
                    localField: "_id",
                    foreignField: "_id",
                    as: "outletInfo"
                }
            },
            { $unwind: "$outletInfo" },
            {
                $project: {
                    outletId: "$_id",
                    name: "$outletInfo.name",
                    city: "$outletInfo.city",
                    revenue: 1,
                    salesCount: 1,
                    _id: 0
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // 6. Sales by Category & Top Products
        // To get product details like category, we need to unwind items and lookup products
        const itemSales = await Sale.aggregate([
            { $match: { outlet: { $in: outletIds } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    category: "$productInfo.category",
                    productName: "$productInfo.name",
                    quantity: "$items.quantity",
                    revenue: { $multiply: ["$items.quantity", "$items.priceAtSale"] }
                }
            }
        ]);

        // Aggregate by Category
        const categoryMap = {};
        const productMap = {};

        itemSales.forEach(sale => {
            // Category distribution
            if (!categoryMap[sale.category]) {
                categoryMap[sale.category] = { category: sale.category, revenue: 0, quantity: 0 };
            }
            categoryMap[sale.category].revenue += sale.revenue;
            categoryMap[sale.category].quantity += sale.quantity;

            // Product statistics
            if (!productMap[sale.productName]) {
                productMap[sale.productName] = { name: sale.productName, category: sale.category, revenue: 0, unitsSold: 0 };
            }
            productMap[sale.productName].revenue += sale.revenue;
            productMap[sale.productName].unitsSold += sale.quantity;
        });

        const salesByCategory = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5); // top 5 products

        res.json({
            totalRevenue,
            totalSalesCount,
            lowStockCount,
            activeOutletsCount,
            salesByDate,
            salesByOutlet,
            salesByCategory,
            topProducts
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
