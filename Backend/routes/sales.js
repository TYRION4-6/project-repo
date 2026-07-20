const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const auth = require("../middleware/auth");

// @route   POST /sales
// @desc    Record a new sales transaction & update stock
// @access  Private
router.post("/", auth, async (req, res) => {
  const { outletId, productId, quantity } = req.body;

  if (!outletId || !productId || !quantity) {
    return res.status(400).json({ msg: "Please enter all fields: outletId, productId, quantity" });
  }

  const qty = parseInt(quantity);
  if (qty <= 0) {
    return res.status(400).json({ msg: "Quantity must be at least 1" });
  }

  try {
    // 1. Verify outlet exists
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(404).json({ msg: "Outlet not found" });
    }

    // 2. Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // 3. Check stock level at this outlet
    const stockItemIndex = product.stock.findIndex(
      item => item.outletId.toString() === outletId.toString()
    );

    if (stockItemIndex === -1) {
      return res.status(400).json({ msg: `Product is not in stock at ${outlet.name}` });
    }

    const currentStock = product.stock[stockItemIndex].quantity;
    if (currentStock < qty) {
      return res.status(400).json({ 
        msg: `Insufficient stock at ${outlet.name}. Available: ${currentStock}, Requested: ${qty}` 
      });
    }

    // 4. Decrement stock
    product.stock[stockItemIndex].quantity = currentStock - qty;
    await product.save();

    // 5. Create Sale record
    const totalPrice = product.price * qty;
    const newSale = new Sale({
      outletId,
      productId,
      quantity: qty,
      totalPrice
    });

    const sale = await newSale.save();
    
    // Populate and return
    const populatedSale = await Sale.findById(sale._id)
      .populate("productId", "name sku category price")
      .populate("outletId", "name city");

    res.json(populatedSale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /sales
// @desc    Get sales history
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("productId", "name sku category price")
      .populate("outletId", "name city")
      .sort({ timestamp: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /sales/analytics
// @desc    Get aggregated sales analytics and dashboard statistics
// @access  Private
router.get("/analytics", auth, async (req, res) => {
  try {
    // 1. Fetch all data needed for calculations
    const sales = await Sale.find()
      .populate("productId", "name sku category price")
      .populate("outletId", "name city");
    
    const products = await Product.find().populate("stock.outletId", "name city");
    const outlets = await Outlet.find();

    // 2. Basic stats
    let totalRevenue = 0;
    let totalItemsSold = 0;
    sales.forEach(sale => {
      totalRevenue += sale.totalPrice;
      totalItemsSold += sale.quantity;
    });

    // 3. Sales over time (last 7 days or group by date)
    const salesOverTimeMap = {};
    sales.forEach(sale => {
      const dateStr = new Date(sale.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      salesOverTimeMap[dateStr] = (salesOverTimeMap[dateStr] || 0) + sale.totalPrice;
    });
    
    // Convert to sorted array of objects for Recharts: [{ date: 'Jul 15', revenue: 1500 }]
    const salesOverTime = Object.keys(salesOverTimeMap).map(date => ({
      date,
      revenue: parseFloat(salesOverTimeMap[date].toFixed(2))
    })).reverse().slice(-10); // Keep last 10 dates for readability

    // 4. Sales by Metro City
    const citySalesMap = {
      Mumbai: 0,
      Delhi: 0,
      Bangalore: 0,
      Kolkata: 0,
      Chennai: 0,
      Hyderabad: 0,
      Pune: 0,
      Ahmedabad: 0
    };
    sales.forEach(sale => {
      if (sale.outletId && sale.outletId.city) {
        citySalesMap[sale.outletId.city] = (citySalesMap[sale.outletId.city] || 0) + sale.totalPrice;
      }
    });
    const salesByCity = Object.keys(citySalesMap)
      .map(city => ({
        city,
        revenue: parseFloat(citySalesMap[city].toFixed(2))
      }))
      .filter(item => item.revenue > 0); // Only include cities with sales

    // 5. Sales by Outlet
    const outletSalesMap = {};
    sales.forEach(sale => {
      if (sale.outletId) {
        const key = sale.outletId.name;
        outletSalesMap[key] = (outletSalesMap[key] || 0) + sale.totalPrice;
      }
    });
    const salesByOutlet = Object.keys(outletSalesMap).map(outletName => ({
      name: outletName,
      revenue: parseFloat(outletSalesMap[outletName].toFixed(2))
    }));

    // 6. Top selling products
    const productSalesMap = {};
    sales.forEach(sale => {
      if (sale.productId) {
        const key = sale.productId.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += sale.quantity;
        productSalesMap[key].revenue += sale.totalPrice;
      }
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // top 5 products

    // 7. Low stock alerts (stock <= 10)
    const lowStockAlerts = [];
    products.forEach(product => {
      product.stock.forEach(stockItem => {
        if (stockItem.quantity <= 10 && stockItem.outletId) {
          lowStockAlerts.push({
            productName: product.name,
            sku: product.sku,
            outletName: stockItem.outletId.name,
            city: stockItem.outletId.city,
            quantity: stockItem.quantity
          });
        }
      });
    });

    res.json({
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalSalesCount: sales.length,
        totalItemsSold,
        activeOutlets: outlets.length,
        totalProducts: products.length
      },
      salesOverTime,
      salesByCity,
      salesByOutlet,
      topProducts,
      lowStockAlerts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
