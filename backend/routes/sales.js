const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const { protect } = require("../middleware/auth");
const salesEmitter = require("../config/emitter");

// @desc    Record a new sale (transaction)
// @route   POST /sales
// @access  Private
router.post("/", protect, async (req, res) => {
  const { product: productId, outlet: outletId, quantity } = req.body;

  if (!productId || !outletId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid product, outlet, or quantity" });
  }

  try {
    // Check if product exists and belongs to the outlet
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.outlet.toString() !== outletId) {
      return res.status(400).json({ message: "Product does not belong to the selected outlet" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available stock: ${product.stock}, Requested: ${quantity}`,
      });
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    // Calculate total amount
    const totalAmount = product.price * quantity;

    // Create sale
    const sale = await Sale.create({
      product: productId,
      outlet: outletId,
      quantity,
      totalAmount,
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate("product", "name price category sku")
      .populate("outlet", "name city");

    // Emit the newSale event to update the WebSocket server and connected clients
    salesEmitter.emit("newSale", populatedSale);

    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all sales list
// @route   GET /sales
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.outlet) {
      filter.outlet = req.query.outlet;
    }
    const sales = await Sale.find(filter)
      .populate("product", "name price sku category")
      .populate("outlet", "name city")
      .sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get recent sales list across all outlets
// @route   GET /sales/recent
// @access  Private
router.get("/recent", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sales = await Sale.find({})
      .populate("product", "name price sku category")
      .populate("outlet", "name city")
      .sort({ date: -1 })
      .limit(limit);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get real-time sales analytics and dashboard metrics
// @route   GET /sales/analytics
// @access  Private
router.get("/analytics", protect, async (req, res) => {
  try {
    // 1. Basic Counts & Sums
    const totalSalesDocs = await Sale.find({});
    const totalRevenue = totalSalesDocs.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalTransactions = totalSalesDocs.length;

    const totalOutlets = await Outlet.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    
    // Low stock alert (stock <= 10)
    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .populate("outlet", "name city");

    // 2. Sales by Outlet
    const outletSalesMap = {};
    const outletsList = await Outlet.find({});
    outletsList.forEach(o => {
      outletSalesMap[o._id.toString()] = {
        name: o.name,
        city: o.city,
        revenue: 0,
        transactions: 0,
      };
    });

    totalSalesDocs.forEach(sale => {
      const oId = sale.outlet.toString();
      if (outletSalesMap[oId]) {
        outletSalesMap[oId].revenue += sale.totalAmount;
        outletSalesMap[oId].transactions += 1;
      }
    });

    const salesByOutlet = Object.values(outletSalesMap);

    // 3. Sales by City
    const citySalesMap = {};
    salesByOutlet.forEach(os => {
      if (!citySalesMap[os.city]) {
        citySalesMap[os.city] = { city: os.city, revenue: 0 };
      }
      citySalesMap[os.city].revenue += os.revenue;
    });
    const salesByCity = Object.values(citySalesMap);

    // 4. Sales by Category
    const categorySalesMap = {};
    const productsList = await Product.find({});
    const productMap = {};
    productsList.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    totalSalesDocs.forEach(sale => {
      const pId = sale.product.toString();
      const product = productMap[pId];
      const category = product ? product.category : "Unknown";
      if (!categorySalesMap[category]) {
        categorySalesMap[category] = { category, revenue: 0, quantity: 0 };
      }
      categorySalesMap[category].revenue += sale.totalAmount;
      categorySalesMap[category].quantity += sale.quantity;
    });
    const salesByCategory = Object.values(categorySalesMap);

    // 5. Sales Over Time (Last 7 days or all history grouped by date)
    const dateSalesMap = {};
    
    // Initialize last 7 days with 0 to ensure we have continuous data
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      dateSalesMap[dateStr] = { date: dateStr, revenue: 0, transactions: 0 };
    }

    totalSalesDocs.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split("T")[0];
      if (dateSalesMap[dateStr]) {
        dateSalesMap[dateStr].revenue += sale.totalAmount;
        dateSalesMap[dateStr].transactions += 1;
      } else {
        // If outside 7 days but we want to track it if it matches
        // For simplicity, we just keep the last 7 days in the timeline chart or we add it dynamically.
        // Let's add it dynamically if it's within the range or let it show up.
        // Actually, initializing last 7 days is perfect.
      }
    });
    const salesOverTime = Object.values(dateSalesMap).sort((a, b) => a.date.localeCompare(b.date));

    // 6. Top Selling Products
    const productSalesMap = {};
    totalSalesDocs.forEach(sale => {
      const pId = sale.product.toString();
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = {
          productId: pId,
          name: productMap[pId] ? productMap[pId].name : "Unknown Product",
          sku: productMap[pId] ? productMap[pId].sku : "N/A",
          price: productMap[pId] ? productMap[pId].price : 0,
          revenue: 0,
          quantity: 0,
        };
      }
      productSalesMap[pId].revenue += sale.totalAmount;
      productSalesMap[pId].quantity += sale.quantity;
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      summary: {
        totalRevenue,
        totalTransactions,
        totalOutlets,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      salesByOutlet,
      salesByCity,
      salesByCategory,
      salesOverTime,
      topSellingProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
